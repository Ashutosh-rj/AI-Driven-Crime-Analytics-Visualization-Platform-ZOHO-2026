from pydantic import BaseModel, Field, constr
from typing import List, Optional, Generic, TypeVar, Any
from datetime import datetime
import re

T = TypeVar('T')

class StandardResponse(BaseModel, Generic[T]):
    """Standardized API Response wrapper."""
    status: str = Field(default="success")
    message: Optional[str] = None
    data: Optional[T] = None

class FIRRegistrationRequest(BaseModel):
    unit: str = Field(..., min_length=2, max_length=100)
    act: str = Field(..., min_length=2, max_length=200)
    section: str = Field(..., min_length=1, max_length=50)
    victim: str = Field(default="Unknown Victim", min_length=2, max_length=150)
    accused: str = Field(..., min_length=2, max_length=150)
    briefFacts: str = Field(default="Under Investigation", min_length=2, max_length=2000)
    latitude: float = Field(default=12.9716, ge=-90, le=90)
    longitude: float = Field(default=77.5946, ge=-180, le=180)

class FIRRegistrationData(BaseModel):
    crimeNo: str
    caseMasterId: int
    oltpLatencyMs: int
    neo4jProjection: str

class SwarmQueryRequest(BaseModel):
    prompt: str = Field(..., min_length=10, max_length=5000)
    rbacRole: str = Field(..., pattern=r"^[A-Z_]+$")

class SwarmQueryData(BaseModel):
    model: str
    rbacRole: str
    groundingScore: float
    hallucinationCount: int
    finalReport: Optional[str] = None   # Gemini-synthesized intelligence brief
    reasoningTrace: List[dict]
    citations: List[str]

class EventResponse(BaseModel):
    eventId: str
    type: str
    caseId: str

class StatsData(BaseModel):
    timestamp: datetime
    metrics: dict
    activeCases: int
    totalCases: int
    recentEvents: List[EventResponse]

class HotspotData(BaseModel):
    model: str
    features: List[dict]
