from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from core.database import get_db, execute_cypher
from core.security import verify_jwt_token, RoleChecker
from api.schemas import FIRRegistrationRequest, FIRRegistrationData, StandardResponse
from repositories.fir_repository import FIRRepository
from services.kafka_service import get_kafka_producer
from core.rate_limit import limiter
import time
import json
import logging

logger = logging.getLogger("api")
router = APIRouter(prefix="/api/v2/fir", tags=["FIR"])

@router.post("/register", status_code=201, response_model=StandardResponse[FIRRegistrationData])
@limiter.limit("20/minute")
async def register_fir(
    request: Request, 
    req_body: FIRRegistrationRequest, 
    db: Session = Depends(get_db), 
    token: dict = Depends(RoleChecker(["SHO_Inspector", "DGP", "P09", "P02"]))
):
    start_time = time.time()
    
    # Use repository for database operations
    repo = FIRRepository(db)
    
    try:
        new_case = repo.create_case(
            unit=req_body.unit, 
            act=req_body.act, 
            section=req_body.section, 
            brief_facts=req_body.briefFacts, 
            latitude=req_body.latitude, 
            longitude=req_body.longitude
        )
        
        repo.create_accused(case_id=new_case.id, name=req_body.accused)
        
        # Commit PG Transaction
        db.commit()
        db.refresh(new_case)
        
        # Write to Neo4j Graph
        cypher_query = """
            MERGE (c:Case {id: $crime_no})
            MERGE (p:Person {name: $accused_name})
            MERGE (p)-[:ACCUSED_IN]->(c)
        """
        neo_status = execute_cypher(cypher_query, {"crime_no": new_case.crime_no, "accused_name": req_body.accused})

        # Publish Event to Kafka
        event_id = f"EVT-{1000 + new_case.id}"
        producer = get_kafka_producer()
        if producer:
            kafka_payload = {
                "event_id": event_id,
                "event_type": "FIRRegistered",
                "case_no": new_case.crime_no,
                # Include coordinates so GIS map can plot live events
                "lat": req_body.latitude,
                "lng": req_body.longitude
            }
            producer.produce('crime.events', value=json.dumps(kafka_payload))
            producer.poll(0)

        logger.info(f"FIR {new_case.crime_no} registered successfully.")
        return StandardResponse(
            status="success",
            message="FIR Registered Successfully",
            data=FIRRegistrationData(
                crimeNo=new_case.crime_no,  # BUG-01 fix: use actual generated crime number
                caseMasterId=new_case.id,
                oltpLatencyMs=int((time.time() - start_time) * 1000),
                neo4jProjection=f"MATCH (p:Person {{name: '{req_body.accused}'}})-[:ACCUSED_IN]->(c:Case {{id: '{new_case.crime_no}'}}) RETURN c"
            )
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error registering FIR: {str(e)}")
        raise
