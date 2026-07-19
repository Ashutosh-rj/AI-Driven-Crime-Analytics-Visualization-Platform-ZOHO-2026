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

        while True:
            # Non-blocking poll for ASGI compatibility
            msg = await asyncio.to_thread(_consumer.poll, 1.0)
            if msg is None:
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
                
            db: Session = SessionLocal()
            try:
                new_evt = EventsLedger(
                    event_id=payload.get("event_id"),
                    topic="crime.events",
                    event_type=payload.get("event_type"),
                    case_no=payload.get("case_no")
                )
                db.add(new_evt)
                db.commit()
                _consumer.commit(msg) 
                
                # Push to websockets
                dead_sockets = []
                for ws in active_websockets:
                    try:
                        await ws.send_json(payload)
                    except Exception:
                        dead_sockets.append(ws)
                
                for ws in dead_sockets:
                    if ws in active_websockets:
                        active_websockets.remove(ws)
                
            except Exception as e:
                db.rollback()
                logger.error(f"Kafka Consumer Error DB Write: {e}. Retrying later.")
            finally:
                db.close()
    except asyncio.CancelledError:
        logger.info("Kafka Consumer loop cancelled. Shutting down gracefully...")
    except Exception as e:
        logger.error(f"Kafka Consumer Failed: {e}")
    finally:
        if _consumer:
            _consumer.close()

async def start_kafka_consumer():
    global consumer_task
    consumer_task = asyncio.create_task(kafka_consumer_loop())

async def stop_kafka_consumer():
    global consumer_task
    if consumer_task:
        consumer_task.cancel()
        try:
            await consumer_task
        except asyncio.CancelledError:
            pass
