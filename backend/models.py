from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

# Profile Models
class Profile(BaseModel):
    entity_id: str
    name: str
    role: str
    email: str
    department: str
    student_id: Optional[str] = None
    staff_id: Optional[str] = None
    card_id: Optional[str] = None
    device_hash: Optional[str] = None
    face_id: Optional[str] = None
    metadata_json: Optional[Dict[str, Any]] = None

# Swipe Models
class Swipe(BaseModel):
    identity: str
    card_id: str
    location_id: str
    timestamp: datetime
    raw_record_json: Optional[Dict[str, Any]] = None

# WiFi Log Models
class WiFiLog(BaseModel):
    identity: str
    device_hash: str
    ap_id: str
    timestamp: datetime
    raw_record_json: Optional[Dict[str, Any]] = None

# Lab Booking Models
class LabBooking(BaseModel):
    identity: str
    booking_id: str
    entity_id: str
    lab_id: str
    start_time: datetime
    end_time: datetime
    attended_flag: bool
    metadata: Optional[Dict[str, Any]] = None

# Library Checkout Models
class LibraryCheckout(BaseModel):
    identity: str
    checkout_id: str
    entity_id: str
    book_id: str
    timestamp: datetime

# Notes Models
class Note(BaseModel):
    identity: str
    entity_id: str
    source: str
    text: str
    timestamp: datetime

# CCTV Frame Models
class CCTVFrame(BaseModel):
    identity: str
    frame_id: str
    location_id: str
    timestamp: datetime
    face_id: Optional[str] = None

# Face Embedding Models
class FaceEmbedding(BaseModel):
    identity: str
    face_id: str
    embedding: str

# Security Alert Models (for the Security page)
class SecurityAlert(BaseModel):
    id: Optional[str] = None
    entity_id: Optional[str] = None
    alert_type: str
    severity: str  # "critical", "high", "medium", "low"
    description: str
    location: Optional[str] = None
    timestamp: datetime
    status: str  # "active", "resolved", "investigating"
    resolved_at: Optional[datetime] = None
    resolved_by: Optional[str] = None

# Entity Resolution Result
class EntityResolutionResult(BaseModel):
    entity_id: str
    confidence_score: float
    matched_sources: list[str]
    profile: Optional[Profile] = None
    recent_activities: Optional[Dict[str, Any]] = None

# Timeline Models
class TimelineEntry(BaseModel):
    entity_id: str
    detection_types: list[str]
    locations: list[str]
    timestamps: list[datetime]

class TimelineActivity(BaseModel):
    timestamp: datetime
    location: str
    detection_type: str
    description: str
