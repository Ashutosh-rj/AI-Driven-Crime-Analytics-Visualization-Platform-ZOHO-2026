from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from neo4j import GraphDatabase
import logging
from .config import get_settings

settings = get_settings()
logger = logging.getLogger("api")

# PostgreSQL Engine setup
# Enterprise connection pooling, timeout, and recycle limits
engine = create_engine(
    settings.DATABASE_URL,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_recycle=1800, # Recycle connections every 30 mins to avoid idle timeouts
    pool_pre_ping=True # Verify connection before usage
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency to get DB session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Neo4j Driver Singleton Pattern
class Neo4jConnection:
    _driver = None

    @classmethod
    def get_driver(cls):
        if cls._driver is None:
            try:
                cls._driver = GraphDatabase.driver(
                    settings.NEO4J_URI, 
                    auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
                    max_connection_lifetime=3600,
                    max_connection_pool_size=50,
                    connection_acquisition_timeout=120
                )
                cls._driver.verify_connectivity()
            except Exception as e:
                logger.error(f"Failed to initialize Neo4j Driver: {e}")
                # We do not fail hard to allow graceful degradation
        return cls._driver

    @classmethod
    def close(cls):
        if cls._driver:
            cls._driver.close()
            cls._driver = None

def execute_cypher(query, parameters=None):
    driver = Neo4jConnection.get_driver()
    if not driver:
        return []
    try:
        with driver.session() as session:
            result = session.run(query, parameters or {})
            return [record.data() for record in result]
    except Exception as e:
        logger.error(f"Neo4j query execution failed: {e}")
        return []
