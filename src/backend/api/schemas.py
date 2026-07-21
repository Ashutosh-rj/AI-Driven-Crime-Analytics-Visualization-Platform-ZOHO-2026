from pydantic import BaseModel, Field
from typing import List, Optional, Generic, TypeVar
from datetime import datetime

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
    # Pattern allows TitleCase_With_Underscores format used by all real roles
    # e.g. Chief_Intel_Officer, District_SP, SHO_Inspector, P09, DGP
    rbacRole: str = Field(..., pattern=r"^[A-Za-z0-9_]+$")

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
