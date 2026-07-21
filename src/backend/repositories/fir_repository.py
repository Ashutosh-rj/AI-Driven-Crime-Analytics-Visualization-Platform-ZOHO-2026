from sqlalchemy.orm import Session
from models.domain import CaseMaster, Accused, EventsLedger
import uuid

class FIRRepository:
    def __init__(self, db: Session):
        self.db = db

    def create_case(self, unit: str, act: str, section: str, brief_facts: str, latitude: float, longitude: float) -> CaseMaster:
        # UUID-based crime number — collision-safe even under rapid demo use
        crime_no = f"FIR/2026/{uuid.uuid4().hex[:8].upper()}"
        wkt_location = f"SRID=4326;POINT({longitude} {latitude})"
        
        new_case = CaseMaster(
            crime_no=crime_no, 
            unit_id=unit, 
            act_code=act,
            section_code=section, 
            brief_facts=brief_facts,
            status="Under Investigation", 
            location=wkt_location
        )
        self.db.add(new_case)
        self.db.flush() # Flush to get ID without committing transaction
        return new_case

    def create_accused(self, case_id: int, name: str, age: int = 30) -> Accused:
        new_accused = Accused(case_id=case_id, accused_name=name, age=age, arrested=False)
        self.db.add(new_accused)
        self.db.flush()
        return new_accused

    def get_stats(self):
        total_cases = self.db.query(CaseMaster).count()
        closed_cases = self.db.query(CaseMaster).filter(CaseMaster.status == "Closed").count()
        events = self.db.query(EventsLedger).order_by(EventsLedger.id.desc()).limit(5).all()
        return total_cases, closed_cases, events

    def get_all_cases(self):
        return self.db.query(CaseMaster).all()
