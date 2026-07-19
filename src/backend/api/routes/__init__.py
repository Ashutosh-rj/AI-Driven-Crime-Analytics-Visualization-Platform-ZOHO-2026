from fastapi import APIRouter
from .fir import router as fir_router
from .stats import router as stats_router
from .websockets import router as websockets_router
from .gis import router as gis_router
from .swarm import router as swarm_router

api_router = APIRouter()
api_router.include_router(fir_router)
api_router.include_router(stats_router)
api_router.include_router(websockets_router)
api_router.include_router(gis_router)
api_router.include_router(swarm_router)
