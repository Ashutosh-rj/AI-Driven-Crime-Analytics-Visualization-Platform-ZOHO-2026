from sqlalchemy import Column, Integer, String, Boolean, DateTime
from geoalchemy2 import Geometry
from datetime import datetime
from core.database import Base

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
