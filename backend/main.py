import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
import uvicorn
from database import DatabaseService
from models import (
    Profile, Swipe, WiFiLog, LabBooking, LibraryCheckout,
    Note, CCTVFrame, FaceEmbedding, EntityResolutionResult
)

app = FastAPI(
    title="Campus Entity Resolution & Security API",
    description="Backend API for Campus Entity Resolution and Security Monitoring System",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = DatabaseService()

# ============================================
# HEALTH CHECK
# ============================================
@app.get("/")
async def root():
    return {
        "message": "Campus Entity Resolution & Security API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# ============================================
# PROFILE ENDPOINTS
# ============================================
@app.get("/api/profiles", response_model=List[dict])
async def get_profiles(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0)
):
    """Get all profiles with pagination"""
    return db.get_all_profiles(limit=limit, offset=offset)

@app.get("/api/profiles/{entity_id}")
async def get_profile(entity_id: str):
    """Get a specific profile by entity_id"""
    profile = db.get_profile_by_entity_id(entity_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.get("/api/profiles/search/{query}")
async def search_profiles(
    query: str,
    field: str = Query("name", regex="^(name|email|department)$")
):
    """Search profiles by name, email, or department"""
    return db.search_profiles(query, field)

# ============================================
# SWIPE ENDPOINTS
# ============================================
@app.get("/api/swipes")
async def get_swipes(
    limit: int = Query(50, ge=1, le=500),
    entity_id: Optional[str] = None
):
    """Get recent swipe records"""
    return db.get_recent_swipes(limit=limit, entity_id=entity_id)

# ============================================
# WIFI LOG ENDPOINTS
# ============================================
@app.get("/api/wifi_logs")
async def get_wifi_logs(
    limit: int = Query(50, ge=1, le=500),
    entity_id: Optional[str] = None
):
    """Get recent WiFi logs"""
    return db.get_recent_wifi_logs(limit=limit, entity_id=entity_id)

# ============================================
# LAB BOOKING ENDPOINTS
# ============================================
@app.get("/api/lab_bookings")
async def get_lab_bookings(
    entity_id: Optional[str] = None,
    upcoming: bool = False
):
    """Get lab bookings"""
    return db.get_lab_bookings(entity_id=entity_id, upcoming=upcoming)

# ============================================
# LIBRARY CHECKOUT ENDPOINTS
# ============================================
@app.get("/api/library_checkouts")
async def get_library_checkouts(entity_id: Optional[str] = None):
    """Get library checkouts"""
    return db.get_library_checkouts(entity_id=entity_id)

# ============================================
# NOTES ENDPOINTS
# ============================================
@app.get("/api/notes")
async def get_notes(
    entity_id: Optional[str] = None,
    source: Optional[str] = None
):
    """Get notes"""
    return db.get_notes(entity_id=entity_id, source=source)

# ============================================
# CCTV FRAME ENDPOINTS
# ============================================
@app.get("/api/cctv_frame")
async def get_cctv_frames(
    location_id: Optional[str] = None,
    limit: int = Query(50, ge=1, le=500)
):
    """Get CCTV frames"""
    return db.get_cctv_frames(location_id=location_id, limit=limit)

# ============================================
# FACE EMBEDDING ENDPOINTS
# ============================================
@app.get("/api/face_embedding")
async def get_face_embeddings():
    """Get all face embeddings"""
    from database import supabase
    response = supabase.table("face_embedding").select("*").execute()
    return response.data

@app.get("/api/face_embedding/{face_id}")
async def get_face_embedding(face_id: str):
    """Get face embedding by face_id"""
    embedding = db.get_face_embedding(face_id)
    if not embedding:
        raise HTTPException(status_code=404, detail="Face embedding not found")
    return embedding

# ============================================
# ENTITY RESOLUTION ENDPOINTS
# ============================================
@app.get("/api/resolve")
async def resolve_entity(
    card_id: Optional[str] = None,
    device_hash: Optional[str] = None,
    face_id: Optional[str] = None
):
    """
    Resolve entity across multiple data sources
    Provide at least one identifier: card_id, device_hash, or face_id
    """
    if not any([card_id, device_hash, face_id]):
        raise HTTPException(
            status_code=400,
            detail="At least one identifier required: card_id, device_hash, or face_id"
        )
    
    result = db.resolve_entity(card_id=card_id, device_hash=device_hash, face_id=face_id)
    
    if not result:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    return result

@app.get("/api/entity/{entity_id}/timeline")
async def get_entity_timeline(
    entity_id: str,
    days: int = Query(7, ge=1, le=30)
):
    """Get comprehensive activity timeline for an entity"""
    profile = db.get_profile_by_entity_id(entity_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    timeline = db.get_entity_activity_timeline(entity_id, days=days)
    return timeline

# ============================================
# DASHBOARD & ANALYTICS ENDPOINTS
# ============================================
@app.get("/api/dashboard/stats")
async def get_dashboard_stats():
    """Get dashboard statistics"""
    return db.get_dashboard_stats()

@app.get("/api/security/stats")
async def get_security_stats():
    """Get security statistics for the Security dashboard"""
    return db.get_security_stats()

@app.get("/api/analytics/activity-heatmap")
async def get_activity_heatmap(days: int = Query(7, ge=1, le=30)):
    """Get activity heatmap data for analytics"""
    # This would generate heatmap data based on swipes and wifi logs
    # Mock implementation for now
    return {
        "days": days,
        "heatmap": [
            {"hour": i, "day": j, "count": (i + j) % 10}
            for i in range(24) for j in range(days)
        ]
    }

# ============================================
# ALERTS & SECURITY ENDPOINTS
# ============================================
@app.get("/api/alerts")
async def get_alerts(
    status: Optional[str] = Query(None, regex="^(active|resolved|investigating)$"),
    severity: Optional[str] = Query(None, regex="^(critical|high|medium|low)$")
):
    """Get security alerts (mock data for now)"""
    # This would query a real alerts table
    # Mock implementation
    alerts = [
        {
            "id": "alert-1",
            "entity_id": "E001",
            "alert_type": "Unauthorized Access",
            "severity": "critical",
            "description": "Multiple failed access attempts detected",
            "location": "Building A - Lab 301",
            "timestamp": "2025-10-04T10:30:00Z",
            "status": "active"
        },
        {
            "id": "alert-2",
            "entity_id": "E042",
            "alert_type": "Suspicious Activity",
            "severity": "high",
            "description": "Unusual access pattern detected",
            "location": "Library - Restricted Section",
            "timestamp": "2025-10-04T09:15:00Z",
            "status": "investigating"
        }
    ]
    
    # Filter by status and severity if provided
    if status:
        alerts = [a for a in alerts if a["status"] == status]
    if severity:
        alerts = [a for a in alerts if a["severity"] == severity]
    
    return alerts

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
