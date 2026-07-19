import numpy as np
from sklearn.cluster import DBSCAN

def detect_hotspots(case_records):
    """
    case_records: List of dicts [{"lat": 12.9, "lng": 77.5, "crime": "Theft"}, ...]
    Returns list of hotspot clusters.
    """
    if not case_records or len(case_records) < 2:
        return []

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
        
        # Calculate Centroid
        centroid_lat = np.mean(cluster_coords[:, 0])
        centroid_lng = np.mean(cluster_coords[:, 1])
        
        # Calculate exact number of incidents
        incident_count = len(cluster_coords)
        
        # Get dominant crime type
        crimes = [case_records[i]["crime"] for i in range(len(case_records)) if labels[i] == k]
        dominant_crime = max(set(crimes), key=crimes.count) if crimes else "Unknown"
        
        # Risk percentage based on incident density
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
        
    return hotspots
