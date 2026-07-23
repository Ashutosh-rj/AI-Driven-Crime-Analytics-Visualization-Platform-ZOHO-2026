import json
import asyncio
from confluent_kafka import Producer, Consumer
from sqlalchemy.orm import Session
from models.domain import EventsLedger
from core.database import SessionLocal
from core.config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger("api")

active_websockets = []
consumer_task = None
_consumer = None
_producer = None

BATCH_SIZE = 50  # Flush DB write every N messages to avoid N+1 session opens

def get_kafka_producer():
    global _producer
    if _producer is None:
        try:
            _producer = Producer({'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS})
        except Exception as e:
            logger.error(f"Failed to initialize Kafka Producer: {e}")
    return _producer

async def kafka_consumer_loop():
    global _consumer
    logger.info(f"Starting Robust Kafka Consumer on {settings.KAFKA_BOOTSTRAP_SERVERS}...")
    try:
        _consumer = Consumer({
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP,
            'auto.offset.reset': 'earliest',
            'enable.auto.commit': False
        })
        _consumer.subscribe(['crime.events'])

        pending_events: list[dict] = []  # In-memory batch buffer
        pending_msgs = []                # Track raw msgs for commit

        while True:
            # Non-blocking poll for ASGI compatibility
            msg = await asyncio.to_thread(_consumer.poll, 1.0)
            if msg is None:
                # Flush any pending batch even when no new messages arrive
                if pending_events:
                    await _flush_batch(pending_events, pending_msgs)
                    pending_events.clear()
                    pending_msgs.clear()
                await asyncio.sleep(0.1)
                continue
            if msg.error():
                logger.error(f"Consumer error: {msg.error()}")
                continue
            
            payload_str = msg.value().decode('utf-8')
            try:
                payload = json.loads(payload_str)
            except json.JSONDecodeError:
                logger.error("Failed to decode JSON. Sending to DLQ.")
                _consumer.commit(msg)
                continue

            pending_events.append(payload)
            pending_msgs.append(msg)

            # Flush batch when it reaches BATCH_SIZE
            if len(pending_events) >= BATCH_SIZE:
                await _flush_batch(pending_events, pending_msgs)
                pending_events.clear()
                pending_msgs.clear()

    except asyncio.CancelledError:
        logger.info("Kafka Consumer loop cancelled. Shutting down gracefully...")
        # Final flush on shutdown
        if pending_events:
            await _flush_batch(pending_events, pending_msgs)
    except Exception as e:
        logger.error(f"Kafka Consumer Failed: {e}")
    finally:
        if _consumer:
            _consumer.close()

async def _flush_batch(payloads: list[dict], msgs: list):
    """Write a batch of payloads to DB in one transaction and push to WebSockets."""
    def _sync_db_kafka_commit():
        db: Session = SessionLocal()
        try:
            new_events = [
                EventsLedger(
                    event_id=p.get("event_id"),
                    topic="crime.events",
                    event_type=p.get("event_type"),
                    case_no=p.get("case_no")
                )
                for p in payloads
            ]
            db.bulk_save_objects(new_events)
            db.commit()

            # Commit all Kafka offsets after successful DB write
            for msg in msgs:
                _consumer.commit(msg)
        except Exception as e:
            db.rollback()
            logger.error(f"Batch DB write failed: {e}")
            raise
        finally:
            db.close()

    try:
        await asyncio.to_thread(_sync_db_kafka_commit)

        # Push to WebSockets
        dead_sockets = []
        for payload in payloads:
            for ws in active_websockets:
                try:
                    await ws.send_json(payload)
                except Exception:
                    if ws not in dead_sockets:
                        dead_sockets.append(ws)

        for ws in dead_sockets:
            if ws in active_websockets:
                active_websockets.remove(ws)

    except Exception as e:
        logger.error(f"Batch DB write failed: {e}")

async def start_kafka_consumer():
    global consumer_task
    consumer_task = asyncio.create_task(kafka_consumer_loop())

async def stop_kafka_consumer():
    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass
