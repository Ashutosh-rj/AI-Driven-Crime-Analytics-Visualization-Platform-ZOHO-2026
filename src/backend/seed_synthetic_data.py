import os
import random
from datetime import datetime, timedelta
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, text
from sqlalchemy.orm import declarative_base, sessionmaker
from geoalchemy2 import Geometry
from neo4j import GraphDatabase

# Setup DB
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://ksp_admin:ksp_password@localhost:5432/ksp_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class CaseMaster(Base):
    __tablename__ = "CaseMaster"
    id = Column(Integer, primary_key=True, index=True)
    crime_no = Column(String, unique=True, index=True)
    unit_id = Column(String)
    act_code = Column(String)
    section_code = Column(String)
    brief_facts = Column(String)
    status = Column(String)
    location = Column(Geometry('POINT', srid=4326))
    reg_date = Column(DateTime, default=datetime.utcnow)

class Accused(Base):
    __tablename__ = "Accused"
    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer)
    accused_name = Column(String)
    age = Column(Integer)
    arrested = Column(Boolean)

class EventsLedger(Base):
    __tablename__ = "EventsLedger"
    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String, unique=True)
    topic = Column(String)
    event_type = Column(String)
    case_no = Column(String)
    timestamp = Column(DateTime, default=datetime.utcnow)

NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "password")

def seed_database():
    try:
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
            conn.commit()
    except Exception:
        pass

    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    
    if db.query(CaseMaster).count() > 10:
        print("Database already seeded.")
        db.close()
        return

    print("Seeding synthetic database...")
    
    # Generate 100 cases
    acts = [("BNS", "Sec 305", "Theft in dwelling house."), 
            ("NDPS", "Sec 21(b)", "Possession of contraband."), 
            ("BNS", "Sec 111", "Organized crime syndicate.")]
            
    names = ["Syed Imran", "Adv. R. Sharma", "Rahul K", "Ravi Kumar @ Langda", "Mohammed Ali", "Pooja Hegde", "Suresh Gowda", "Arun Patil"]
    
    cases = []
    for i in range(1, 101):
        act, sec, brief = random.choice(acts)
        lat = random.uniform(12.8, 13.1)
        lng = random.uniform(77.5, 77.7)
        c = CaseMaster(
            crime_no=f"FIR/2026/1{i:03d}",
            unit_id=f"U-{random.randint(101, 105)}",
            act_code=act,
            section_code=sec,
            brief_facts=f"{brief} Incident reported at lat {lat:.2f}, lng {lng:.2f}.",
            status=random.choice(["Under Investigation", "Charge Sheeted", "Closed"]),
            location=f"SRID=4326;POINT({lng} {lat})",
            reg_date=datetime.utcnow() - timedelta(days=random.randint(1, 180))
        )
        db.add(c)
        cases.append(c)
        
    db.commit()
    
    # Generate accused and neo4j graph
    try:
        neo4j_driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    except Exception:
        neo4j_driver = None
        
    for c in db.query(CaseMaster).all():
        num_accused = random.randint(1, 3)
        accused_list = random.sample(names, num_accused)
        
        for name in accused_list:
            accused_entry = Accused(case_id=c.id, accused_name=name, age=random.randint(20, 50), arrested=random.choice([True, False]))
            db.add(accused_entry)
            
            if neo4j_driver:
                with neo4j_driver.session() as session:
                    session.run(
                        """
                        MERGE (case:Case {id: $crime_no})
                        MERGE (p:Person {name: $name})
                        MERGE (p)-[:ACCUSED_IN]->(case)
                        """,
                        crime_no=c.crime_no, name=name
                    )
    db.commit()
    db.close()
    
    if neo4j_driver:
        # Build co-accused links
        with neo4j_driver.session() as session:
            session.run("""
            MATCH (p1:Person)-[:ACCUSED_IN]->(c:Case)<-[:ACCUSED_IN]-(p2:Person)
            WHERE p1 <> p2
            MERGE (p1)-[:CO_ACCUSED_WITH]-(p2)
            """)
        neo4j_driver.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed_database()
