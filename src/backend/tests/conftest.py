"""
conftest.py — Test configuration and fixtures for KSP AI backend.

IMPORTANT: sys.modules patches MUST happen before any app import.
All heavy optional services are mocked here so tests run on bare CI
runners without Kafka, Redis, Neo4j, PostGIS, Qdrant, or Gemini.
"""
import sys
import types
import pytest
from unittest.mock import MagicMock, AsyncMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool


# =============================================================================
# STEP 1 — Mock every external package before any app code is imported.
#
# Rule: for a dotted import like `from fastapi_cache.backends.redis import X`,
# Python needs EVERY node of the path in sys.modules as a separate entry:
#   sys.modules["fastapi_cache"]
#   sys.modules["fastapi_cache.backends"]
#   sys.modules["fastapi_cache.backends.redis"]
# =============================================================================

def _make_module(name: str, **attrs) -> types.ModuleType:
    """Create a fake module with optional attributes."""
    mod = types.ModuleType(name)
    for k, v in attrs.items():
        setattr(mod, k, v)
    sys.modules[name] = mod
    return mod


# ── geoalchemy2 ───────────────────────────────────────────────────────────────
# SQLite has no PostGIS; replace Geometry with plain String for test schema.
_geo = _make_module("geoalchemy2", Geometry=lambda *a, **kw: String(255))
_make_module("geoalchemy2.shape", to_shape=MagicMock(), from_shape=MagicMock())
_make_module("geoalchemy2.functions")
_make_module("geoalchemy2.types")

# ── fastapi_cache (all submodules) ────────────────────────────────────────────
_fca = _make_module("fastapi_cache", FastAPICache=MagicMock())
_fca_dec = _make_module("fastapi_cache.decorator")
# cache(expire=N) must return a decorator: cache(30)(fn) -> fn
_cache_noop = lambda *a, **kw: (lambda fn: fn)
_fca_dec.cache = _cache_noop
_fca.decorator = _fca_dec

_make_module("fastapi_cache.backends")
_make_module("fastapi_cache.backends.redis", RedisBackend=MagicMock())
_make_module("fastapi_cache.backends.memcached")
_make_module("fastapi_cache.backends.inmemory")

# ── redis (async) ─────────────────────────────────────────────────────────────
# slowapi's `limits` library reads redis.__version__ and requires >= 3.0.
# Without __version__, limits reports "0.0.0" and rejects our mock.
_redis = _make_module("redis", __version__="4.6.0", VERSION=(4, 6, 0))
_redis_async = _make_module("redis.asyncio",
                            from_url=MagicMock(return_value=AsyncMock()),
                            __version__="4.6.0")
_redis.asyncio = _redis_async
_make_module("redis.exceptions", ConnectionError=ConnectionError, TimeoutError=TimeoutError)

# ── prometheus_fastapi_instrumentator ────────────────────────────────────────
_instr = MagicMock()
_instr.instrument.return_value = _instr   # Instrumentator().instrument(app)
_instr.expose.return_value = _instr       # .expose(app)
_pfi_mod = _make_module(
    "prometheus_fastapi_instrumentator",
    Instrumentator=MagicMock(return_value=_instr)
)

# ── opentelemetry ─────────────────────────────────────────────────────────────
_make_module("opentelemetry")
_make_module("opentelemetry.instrumentation")
_make_module("opentelemetry.instrumentation.fastapi",
             FastAPIInstrumentor=MagicMock())
_make_module("opentelemetry.sdk")
_make_module("opentelemetry.exporter")
_make_module("opentelemetry.exporter.otlp")
_make_module("opentelemetry.exporter.otlp.proto")
_make_module("opentelemetry.exporter.otlp.proto.grpc")

# ── confluent_kafka ───────────────────────────────────────────────────────────
# Consumer.poll() MUST return None to satisfy the `if msg is None: continue`
# guard in kafka_consumer_loop. A MagicMock is truthy, so msg.error() would
# also be truthy, causing infinite error-log spam during tests.
_mock_consumer_instance = MagicMock()
_mock_consumer_instance.poll.return_value = None   # <-- critical
_mock_consumer_class = MagicMock(return_value=_mock_consumer_instance)
_mock_producer_instance = MagicMock()
_mock_producer_class = MagicMock(return_value=_mock_producer_instance)
_make_module("confluent_kafka",
             Producer=_mock_producer_class,
             Consumer=_mock_consumer_class)

# ── qdrant_client ─────────────────────────────────────────────────────────────
_make_module("qdrant_client", QdrantClient=MagicMock())
_make_module("qdrant_client.models",
             Distance=MagicMock(),
             VectorParams=MagicMock(),
             PointStruct=MagicMock())

# ── sentence_transformers ─────────────────────────────────────────────────────
_make_module("sentence_transformers", SentenceTransformer=MagicMock())

# ── google.generativeai ───────────────────────────────────────────────────────
_make_module("google")
_make_module("google.generativeai", GenerativeModel=MagicMock(), configure=MagicMock())

# ── neo4j ─────────────────────────────────────────────────────────────────────
# neo4j is in requirements.txt, but its import may trigger driver version checks.
# The actual connection (verify_connectivity) only runs in app lifespan,
# which TestClient skips. We mock at import level as belt-and-suspenders.
try:
    import neo4j  # noqa: F401 — confirm it's installed
except ImportError:
    _neo4j_mock = MagicMock()
    _neo4j_mock.GraphDatabase.driver.return_value = MagicMock()
    _make_module("neo4j", GraphDatabase=_neo4j_mock.GraphDatabase)

# =============================================================================
# STEP 2 — Now it's safe to import the app
# =============================================================================
from main import app                          # noqa: E402
from core.database import Base, get_db        # noqa: E402
from core.security import verify_jwt_token    # noqa: E402

# =============================================================================
# STEP 3 — In-memory SQLite test database
# =============================================================================
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def setup_database():
    """Create all tables once per test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    """Transactional scope — each test is rolled back after."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    """FastAPI TestClient with all external dependencies overridden."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_verify_jwt_token():
        return {
            "sub": "testuser",
            "realm_access": {
                "roles": [
                    "Chief_Intel_Officer", "SHO_Inspector",
                    "DGP", "District_SP", "P09", "P02", "P03"
                ]
            }
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt_token

    # Mock Neo4j — not available on CI
    monkeypatch.setattr("core.database.execute_cypher", lambda q, p=None: [])

    # Mock Kafka Producer — not available on CI
    class MockProducer:
        def produce(self, topic, value): pass
        def poll(self, timeout): pass

    monkeypatch.setattr("services.kafka_service.get_kafka_producer", lambda: MockProducer())

    # MUST patch kafka lifecycle BEFORE TestClient.__enter__ fires the lifespan.
    # lifespan calls `await start_kafka_consumer()` which spawns an infinite loop.
    # Patching after TestClient init is too late.
    async def _noop(): pass
    monkeypatch.setattr("services.kafka_service.start_kafka_consumer", _noop)
    monkeypatch.setattr("services.kafka_service.stop_kafka_consumer", _noop)
    monkeypatch.setattr("main.start_kafka_consumer", _noop)
    monkeypatch.setattr("main.stop_kafka_consumer", _noop)

    # Mock seed_database: it runs via asyncio.to_thread() in lifespan, creating
    # SQLite connections in a worker thread. SQLite objects cannot cross thread
    # boundaries — this causes ProgrammingError spam in teardown logs.
    monkeypatch.setattr("main.seed_database", lambda: None)

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
