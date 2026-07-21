import sys
import pytest
from unittest.mock import MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, String
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# ─────────────────────────────────────────────────────────────────────────────
# CRITICAL: Mock geoalchemy2 BEFORE any app imports touch it.
# SQLite (used for tests) has no PostGIS extension, so geoalchemy2.Geometry
# would raise "Could not load library 'libgdal'" or similar on CI runners.
# We replace Geometry with a plain String column for the test environment.
# ─────────────────────────────────────────────────────────────────────────────
geoalchemy2_mock = MagicMock()
geoalchemy2_mock.Geometry = lambda *args, **kwargs: String(255)
sys.modules["geoalchemy2"] = geoalchemy2_mock
sys.modules["geoalchemy2.shape"] = MagicMock()
sys.modules["geoalchemy2.functions"] = MagicMock()

# ─────────────────────────────────────────────────────────────────────────────
# Also mock heavy optional services that aren't available on CI:
# Kafka, Redis (fastapi-cache), Qdrant, SentenceTransformer, Gemini
# ─────────────────────────────────────────────────────────────────────────────
sys.modules["confluent_kafka"] = MagicMock()
sys.modules["qdrant_client"] = MagicMock()
sys.modules["qdrant_client.models"] = MagicMock()
sys.modules["sentence_transformers"] = MagicMock()
sys.modules["google.generativeai"] = MagicMock()
sys.modules["fastapi_cache"] = MagicMock()
sys.modules["fastapi_cache.decorator"] = MagicMock()

# Provide a no-op @cache decorator so stats.py can be imported
cache_mock = MagicMock()
cache_mock.return_value = lambda f: f  # cache(expire=30)(fn) -> fn unchanged
sys.modules["fastapi_cache.decorator"].cache = cache_mock

# ─────────────────────────────────────────────────────────────────────────────
# Now it's safe to import the app and database layer
# ─────────────────────────────────────────────────────────────────────────────
from main import app
from core.database import Base, get_db
from core.security import verify_jwt_token

# In-memory SQLite database for tests (fast, no external dependencies)
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session")
def setup_database():
    """Create all tables once per test session in the in-memory SQLite DB."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(setup_database):
    """Provides a transactional scope around each test — rolled back after."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    """Returns a FastAPI TestClient with all external dependencies overridden."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_verify_jwt_token():
        return {
            "sub": "testuser",
            "realm_access": {
                "roles": ["Chief_Intel_Officer", "SHO_Inspector", "DGP", "District_SP", "P09", "P02", "P03"]
            }
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt_token

    # Mock Neo4j — no Neo4j on CI
    monkeypatch.setattr("core.database.execute_cypher", lambda q, p=None: [])

    # Mock Kafka Producer — no Kafka on CI
    class MockProducer:
        def produce(self, topic, value): pass
        def poll(self, timeout): pass

    monkeypatch.setattr("services.kafka_service.get_kafka_producer", lambda: MockProducer())

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
