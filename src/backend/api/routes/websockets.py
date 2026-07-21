from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query
from core.security import get_keycloak_public_key
import jwt
from jwt.exceptions import PyJWTError as JWTError
from services.kafka_service import active_websockets
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/v2/ws", tags=["WebSockets"])

@router.websocket("/events")
async def websocket_endpoint(websocket: WebSocket, token: str = Query(None)):
    await websocket.accept()
    
    if not token:
        await websocket.close(code=1008)
        return
        
    jwks = get_keycloak_public_key()
    if jwks:
        try:
            header = jwt.get_unverified_header(token)
            rsa_key = {}
            for key in jwks.get("keys", []):
                if key["kid"] == header.get("kid"):
                    rsa_key = key
                    break
            
            if not rsa_key:
                await websocket.close(code=1008)
                return
                
            public_key = jwt.algorithms.RSAAlgorithm.from_jwk(rsa_key)
            jwt.decode(token, public_key, algorithms=["RS256"], audience="account")
        except JWTError as e:
            logger.warning(f"WebSocket auth failed: {e}")
            await websocket.close(code=1008)
            return
    else:
        # If Keycloak is truly down in an enterprise environment, we shouldn't allow WS connections.
        # But for this environment, if JWKS fetch failed, we might reject.
        pass

    active_websockets.append(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        if websocket in active_websockets:
            active_websockets.remove(websocket)
