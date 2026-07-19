from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from core.rate_limit import limiter
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from fastapi.exceptions import RequestValidationError
from core.exceptions import (
    AppException, 
    app_exception_handler, 
    validation_exception_handler, 
    global_exception_handler
)
from contextlib import asynccontextmanager
import logging
from redis import asyncio as aioredis
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend

from core.config import get_settings
from core.database import Base, engine, Neo4jConnection
from core.logging import setup_logging
from api.routes import api_router
from services.kafka_service import start_kafka_consumer, stop_kafka_consumer
from seed_synthetic_data import seed_database

settings = get_settings()
logger = setup_logging()

# ============================================================================
# LIFESPAN & INITIALIZATION
# ============================================================================
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Enterprise Backend Components...")
    
    # 1. Database (PostgreSQL) is now managed via Alembic migrations.
    # Base.metadata.create_all is removed.
    logger.info("PostgreSQL Schema managed by Alembic.")

    # 2. Init Database (Neo4j)
    Neo4jConnection.get_driver()
    
    # 3. Seed Data
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seeding failed/skipped: {e}")

    # 4. Initialize Redis Cache
    redis = aioredis.from_url(settings.REDIS_URL, encoding="utf8", decode_responses=True)
    FastAPICache.init(RedisBackend(redis), prefix="ksp-cache")

    # 5. Start Kafka Consumer Background Task
    await start_kafka_consumer()
    
    logger.info("Application Startup Complete.")
    yield
    
    logger.info("Shutting down Enterprise Backend Components...")
    # Cleanup logic
    await stop_kafka_consumer()
    Neo4jConnection.close()
    logger.info("Application Shutdown Complete.")

# ============================================================================
# FASTAPI APP
# ============================================================================
tags_metadata = [
    {"name": "FIR", "description": "First Information Report operations. Includes high-velocity Kafka streaming and PostGIS synchronization."},
    {"name": "Stats", "description": "Enterprise KPI & SLA metrics dashboard data."},
    {"name": "Swarm", "description": "Multi-agent LLM Swarm Intelligence interface for investigating officers."},
    {"name": "GIS", "description": "Geospatial Intelligence, Hotspot Buffers & Live Event Layers."},
    {"name": "WebSockets", "description": "Live streaming connection for the operations dashboard."}
]

app = FastAPI(
    title="KSP AI Command Center - Enterprise API",
    description="""
    # High-Performance Backend Architecture
    
    This API serves as the backbone for the 31-District Statewide Executive Compliance Matrix.
    It integrates **PostgreSQL (PostGIS)** for spatial indexing, **Neo4j** for graph syndicates,
    **Redpanda/Kafka** for event-driven pipelines, and a **15-Agent Swarm** powered by LangGraph.
    
    *Confidential & Proprietary - Authorized Personnel Only.*
    """,
    version="2.0.0",
    terms_of_service="http://ksp.gov.in/terms/",
    contact={
        "name": "KSP Architecture Team",
        "email": "architecture@ksp.gov.in",
    },
    openapi_tags=tags_metadata,
    swagger_ui_parameters={"defaultModelsExpandDepth": -1}, # Hide standard models list in Swagger UI
    lifespan=lifespan
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_exception_handler(AppException, app_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. Observability: Expose /metrics for Prometheus
Instrumentator().instrument(app).expose(app)

# 2. Distributed Tracing: OpenTelemetry
FastAPIInstrumentor.instrument_app(app)

# 3. Routers
app.include_router(api_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
