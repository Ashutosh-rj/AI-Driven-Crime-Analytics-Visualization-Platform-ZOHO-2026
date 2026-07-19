from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
from sklearn.cluster import DBSCAN

app = FastAPI(title="KSP AI ML Service", description="Standalone ML pipeline for geospatial and predictive analytics.")

class CaseRecord(BaseModel):
    id: str
    lat: float
    lng: float
    crime: str

class HotspotRequest(BaseModel):
    records: List[CaseRecord]

@app.post("/api/v1/ml/hotspots")
async def detect_hotspots(req: HotspotRequest):
    case_records = [{"lat": r.lat, "lng": r.lng, "crime": r.crime} for r in req.records]
    if not case_records or len(case_records) < 2:
        return {"hotspots": []}

    # Extract coordinates
    coords = np.array([[c["lat"], c["lng"]] for c in case_records])
    
    # Earth radius in kilometers for Haversine metric
    kms_per_radian = 6371.0088
    epsilon_km = 0.5 # Group crimes within 500 meters
    epsilon = epsilon_km / kms_per_radian
    
    # Run DBSCAN
    db = DBSCAN(eps=epsilon, min_samples=2, algorithm='ball_tree', metric='haversine').fit(np.radians(coords))
    labels = db.labels_
    
    unique_labels = set(labels)
    hotspots = []
    
    for k in unique_labels:
        if k == -1:
            # Noise (unclustered crimes)
            continue
            
        # Get members of this cluster
        class_member_mask = (labels == k)
        cluster_coords = coords[class_member_mask]
        
        centroid_lat = float(np.mean(cluster_coords[:, 0]))
        centroid_lng = float(np.mean(cluster_coords[:, 1]))
        incident_count = len(cluster_coords)
        
        crimes = [case_records[i]["crime"] for i in range(len(case_records)) if labels[i] == k]
        dominant_crime = max(set(crimes), key=crimes.count) if crimes else "Unknown"
        risk_pct = min(99.0, 50.0 + (incident_count * 5.0))
        
        hotspots.append({
            "type": "Hotspot",
            "name": f"ML Cluster #{k+1}",
            "coords": [centroid_lat, centroid_lng],
            "radiusMeters": 300 + (incident_count * 50),
            "riskPct": round(risk_pct, 1),
            "targetCrime": dominant_crime,
            "incidentCount": incident_count
        })
        
    return {"hotspots": hotspots}

@app.get("/health")
def health_check():
    return {"status": "healthy"}
