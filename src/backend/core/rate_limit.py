from slowapi import Limiter
from slowapi.util import get_remote_address
from .config import get_settings
import logging

settings = get_settings()
logger = logging.getLogger("api")

# Determine storage backend
# In a true distributed enterprise environment, we use Redis for rate limit storage.
try:
    # `limits` library supports redis out of the box when the redis package is installed.
    # We initialize the limiter pointing to our REDIS_URL.
    storage_uri = settings.REDIS_URL
    limiter = Limiter(
        key_func=get_remote_address,
        storage_uri=storage_uri,
        strategy="fixed-window" # Predictable and enterprise-standard
    )
    logger.info(f"Rate Limiter configured with Redis backend at {storage_uri}")
except Exception as e:
    logger.error(f"Failed to configure Redis for rate limiting. Falling back to memory: {e}")
    limiter = Limiter(key_func=get_remote_address)
