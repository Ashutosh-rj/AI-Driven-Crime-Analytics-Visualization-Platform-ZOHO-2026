from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from core.database import get_db
from api.schemas import HotspotData, StandardResponse
from repositories.fir_repository import FIRRepository
import httpx
from geoalchemy2.shape import to_shape
from core.rate_limit import limiter

router = APIRouter(prefix="/api/v2/gis", tags=["GIS"])

@router.get("/hotspots", response_model=StandardResponse[HotspotData])
@limiter.limit("60/minute")
async def get_hotspots(request: Request, db: Session = Depends(get_db)):
    import asyncio
    repo = FIRRepository(db)
    cases = await asyncio.to_thread(repo.get_all_cases)
    
    # 1. Extract coordinates from PostGIS
    case_records = []
    for c in cases:
        if c.location:
            pt = to_shape(c.location)
            case_records.append({
                "lat": pt.y, 
                "lng": pt.x, 
                "crime": c.brief_facts[:25] if c.brief_facts else ""
            })
            
    # 2. Run mathematical DBSCAN clustering via ML Microservice
    ml_hotspots = []
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://ksp-ml:8001/api/v1/ml/hotspots",
                json={"records": case_records},
                timeout=10.0
            )
            if resp.status_code == 200:
                ml_hotspots = resp.json().get("hotspots", [])
    except Exception:
        # Fallback empty list if ML service is down
        pass
    
    features = ml_hotspots
            
    return StandardResponse(
        status="success",
        data=HotspotData(
            model="dbscan-spatial-v2",
            features=features
        )
    )
