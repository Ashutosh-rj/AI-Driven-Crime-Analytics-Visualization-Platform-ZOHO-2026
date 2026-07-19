from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from functools import lru_cache

class Settings(BaseSettings):
    """
    Enterprise configuration using Pydantic Settings.
    Validates environment variables at startup.
    """
    APP_NAME: str = "KSP AI Platform (NCIOS v2.5)"
    APP_VERSION: str = "2.5.0"
    ENVIRONMENT: str = Field(default="development")
    
    # Security
    KEYCLOAK_URL: str = Field(default="http://localhost:8080")
    KEYCLOAK_REALM: str = Field(default="master")
    
    # Database
    DATABASE_URL: str = Field(default="postgresql://ksp_admin:ksp_password@localhost:5432/ksp_db")
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    
    # Neo4j
    NEO4J_URI: str = Field(default="bolt://localhost:7687")
    NEO4J_USER: str = Field(default="neo4j")
    NEO4J_PASSWORD: str = Field(default="password")
    
    # Kafka / Redpanda
    KAFKA_BOOTSTRAP_SERVERS: str = Field(default="localhost:19092")
    KAFKA_CONSUMER_GROUP: str = "ksp_ledger_group"
    
    # Redis (Rate Limiting & Caching)
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # Qdrant
    QDRANT_URL: str = Field(default="http://localhost:6333")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache()
def get_settings() -> Settings:
    return Settings()
