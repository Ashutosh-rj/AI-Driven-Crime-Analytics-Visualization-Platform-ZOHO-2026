import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app
from core.database import Base, get_db

# Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database():
    # Create all tables in the test database
    Base.metadata.create_all(bind=engine)
    yield
    # Drop all tables after the tests are done
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session(setup_database):
    """Provides a transactional scope around a series of operations."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    
    yield session
    
    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="function")
def client(db_session, monkeypatch):
    """Returns a FastAPI TestClient with dependencies overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    def override_verify_jwt_token():
        return {
            "sub": "testuser", 
            "realm_access": {
                "roles": ["Chief_Intel_Officer", "SHO_Inspector", "DGP", "District_SP"]
            }
        }

    app.dependency_overrides[get_db] = override_get_db
    from core.security import verify_jwt_token
    app.dependency_overrides[verify_jwt_token] = override_verify_jwt_token
    
    # Mock Neo4j execute_cypher
    monkeypatch.setattr("core.database.execute_cypher", lambda q, p=None: {"status": "success", "mocked": True})
    
    # Mock Kafka Producer
    class MockProducer:
        def produce(self, topic, value): pass
        def poll(self, timeout): pass
    monkeypatch.setattr("services.kafka_service.get_kafka_producer", lambda: MockProducer())
    
    with TestClient(app) as test_client:
        yield test_client
        
    app.dependency_overrides.clear()
