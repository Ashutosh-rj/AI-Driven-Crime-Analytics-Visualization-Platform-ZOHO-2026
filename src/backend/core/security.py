from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import requests
from functools import lru_cache
from .config import get_settings

settings = get_settings()

security_scheme = HTTPBearer()

@lru_cache(maxsize=1)
def get_keycloak_public_key():
    jwks_url = f"{settings.KEYCLOAK_URL}/realms/{settings.KEYCLOAK_REALM}/protocol/openid-connect/certs"
    try:
        # For enterprise grade, timeout should be small and exceptions caught properly
        response = requests.get(jwks_url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        # Log this securely via structured logger in a real scenario
        # Do NOT return a fallback backdoor in production
        raise HTTPException(
            status_code=503, 
            detail="Authentication provider is currently unreachable."
        )

def verify_jwt_token(credentials: HTTPAuthorizationCredentials = Security(security_scheme)) -> dict:
    token = credentials.credentials
    jwks = get_keycloak_public_key()
        
    try:
        header = jwt.get_unverified_header(token)
        rsa_key = {}
        for key in jwks.get("keys", []):
            if key["kid"] == header.get("kid"):
                rsa_key = {
                    "kty": key["kty"],
                    "kid": key["kid"],
                    "use": key["use"],
                    "n": key["n"],
                    "e": key["e"]
                }
                break
        
        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token signature")
            
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            audience="account"  # Validate audience based on Keycloak setup
        )
        return payload
    except JWTError as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")

class RoleChecker:
    """
    Enterprise RBAC Policy Enforcement Point.
    Validates that the authenticated user possesses the required Keycloak roles.
    """
    def __init__(self, allowed_roles: list[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, token_payload: dict = Depends(verify_jwt_token)) -> dict:
        # In a real Keycloak setup, roles are usually in realm_access.roles or resource_access
        user_roles = token_payload.get("realm_access", {}).get("roles", [])
        
        # If any allowed role is present in user's roles, grant access
        if any(role in user_roles for role in self.allowed_roles):
            return token_payload
            
        # Deny access and log security event (Audit)
        raise HTTPException(
            status_code=403, 
            detail=f"RBAC Deny: Insufficient privileges. Required one of: {self.allowed_roles}"
        )
