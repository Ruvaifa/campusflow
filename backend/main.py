import os
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional, List
from datetime import datetime
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
    field: str = Query("name", pattern="^(name|email|department)$")
):
    """Search profiles by name, email, or department"""
    return db.search_profiles(query, field)

@app.get("/api/entities")
async def get_entities(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None, pattern="^(active|recent|inactive|all)$"),
    search: Optional[str] = None
):
    """
    Get entities with enriched data including activity status and last seen
    Supports filtering by status and searching by name/email
    """
    return db.get_entities_enriched(limit=limit, offset=offset, status=status, search=search)

@app.get("/api/entities/{entity_id}")
async def get_entity_details(entity_id: str):
    """
    Get detailed entity information including profile and recent activity summary
    """
    entity = db.get_entity_details(entity_id)
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity

@app.get("/api/entities/{entity_id}/timeline")
async def get_entity_timeline(entity_id: str):
    """
    Get timeline data for a specific entity including all activities and current location
    """
    timeline = db.get_entity_timeline(entity_id)
    if not timeline:
        raise HTTPException(status_code=404, detail="Timeline not found for entity")
    return timeline

@app.get("/api/entities-with-timeline")
async def get_entities_with_timeline(
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    search: Optional[str] = None
):
    """
    Get all entities with their timeline data (current location, last seen)
    """
    return db.get_all_entities_with_timeline(limit=limit, offset=offset, search=search)

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
@app.post("/api/test/populate-activity")
async def populate_test_activity():
    """Populate test activity data for demonstration"""
    return db.populate_test_activity_data()

@app.get("/api/alerts")
async def get_alerts(
    status: Optional[str] = Query(None, pattern="^(active|resolved|investigating)$"),
    limit: int = Query(100, ge=1, le=500)
):
    """Get security alerts based on entity inactivity patterns"""
    return db.generate_security_alerts(status=status, limit=limit)

@app.put("/api/alerts/{entity_id}")
async def update_alert(entity_id: str, status: str = Query(..., pattern="^(active|resolved|investigating)$")):
    """Update alert status"""
    updated_alert = db.update_alert_status(entity_id, status)
    if not updated_alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return updated_alert

@app.get("/api/security/entity-history")
async def get_entity_history(
    entity_id: Optional[str] = None,
    asset_type: str = Query("all", pattern="^(all|swipe|wifi|lab|library|cctv)$"),
    time_range: str = Query("today", pattern="^(today|24h|7d|30d|custom)$"),
    start_time: Optional[str] = None,
    end_time: Optional[str] = None
):
    """
    Get complete history for an entity across all systems
    Supports filtering by asset type and time range
    """
    from datetime import datetime, timedelta
    
    # Calculate time range
    now = datetime.now()
    if time_range == "today":
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif time_range == "24h":
        start = now - timedelta(hours=24)
    elif time_range == "7d":
        start = now - timedelta(days=7)
    elif time_range == "30d":
        start = now - timedelta(days=30)
    elif time_range == "custom" and start_time:
        start = datetime.fromisoformat(start_time.replace('Z', '+00:00'))
    else:
        start = now - timedelta(hours=24)
    
    end = datetime.fromisoformat(end_time.replace('Z', '+00:00')) if end_time else now
    
    history = {
        "entity_id": entity_id,
        "time_range": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "type": time_range
        },
        "activities": []
    }
    
    # Fetch data based on asset type
    if asset_type in ["all", "swipe"]:
        swipes = db.get_recent_swipes(limit=500, entity_id=entity_id)
        for swipe in swipes:
            swipe_time = datetime.fromisoformat(swipe['timestamp'].replace('Z', '+00:00'))
            if start <= swipe_time <= end:
                history["activities"].append({
                    "type": "swipe",
                    "timestamp": swipe['timestamp'],
                    "location": swipe.get('location', 'Unknown'),
                    "details": {
                        "card_id": swipe.get('card_id'),
                        "access_granted": swipe.get('access_granted', True)
                    }
                })
    
    if asset_type in ["all", "wifi"]:
        wifi_logs = db.get_recent_wifi_logs(limit=500, entity_id=entity_id)
        for log in wifi_logs:
            log_time = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
            if start <= log_time <= end:
                history["activities"].append({
                    "type": "wifi",
                    "timestamp": log['timestamp'],
                    "location": log.get('location', 'Unknown'),
                    "details": {
                        "device_hash": log.get('device_hash'),
                        "ssid": log.get('ssid')
                    }
                })
    
    if asset_type in ["all", "lab"]:
        lab_bookings = db.get_lab_bookings(entity_id=entity_id)
        for booking in lab_bookings:
            booking_time = datetime.fromisoformat(booking['booking_time'].replace('Z', '+00:00'))
            if start <= booking_time <= end:
                history["activities"].append({
                    "type": "lab_booking",
                    "timestamp": booking['booking_time'],
                    "location": booking.get('lab_name', 'Unknown Lab'),
                    "details": {
                        "duration": booking.get('duration_hours'),
                        "purpose": booking.get('purpose')
                    }
                })
    
    if asset_type in ["all", "library"]:
        checkouts = db.get_library_checkouts(entity_id=entity_id)
        for checkout in checkouts:
            checkout_time = datetime.fromisoformat(checkout['checkout_time'].replace('Z', '+00:00'))
            if start <= checkout_time <= end:
                history["activities"].append({
                    "type": "library",
                    "timestamp": checkout['checkout_time'],
                    "location": "Library",
                    "details": {
                        "book_title": checkout.get('book_title'),
                        "due_date": checkout.get('due_date')
                    }
                })
    
    # Sort activities by timestamp
    history["activities"].sort(key=lambda x: x["timestamp"], reverse=True)
    history["total_activities"] = len(history["activities"])
    
    return history

@app.get("/api/security/inactive-entities")
async def get_inactive_entities(
    hours: int = Query(12, ge=1, le=168),
    limit: int = Query(50, ge=1, le=500)
):
    """
    Detect entities that have not been observed in any logs for the specified hours
    Generates alerts for entities missing from all systems
    """
    from datetime import datetime, timedelta
    
    cutoff_time = datetime.now() - timedelta(hours=hours)
    
    # Get all profiles
    all_profiles = db.get_all_profiles(limit=1000)
    
    # Get recent activities
    recent_swipes = db.get_recent_swipes(limit=1000)
    recent_wifi = db.get_recent_wifi_logs(limit=1000)
    recent_labs = db.get_lab_bookings()
    recent_library = db.get_library_checkouts()
    
    # Track entities with recent activity
    active_entities = set()
    
    for swipe in recent_swipes:
        swipe_time = datetime.fromisoformat(swipe['timestamp'].replace('Z', '+00:00'))
        if swipe_time >= cutoff_time:
            active_entities.add(swipe.get('identity'))
    
    for log in recent_wifi:
        log_time = datetime.fromisoformat(log['timestamp'].replace('Z', '+00:00'))
        if log_time >= cutoff_time:
            active_entities.add(log.get('identity'))
    
    for booking in recent_labs:
        booking_time = datetime.fromisoformat(booking['booking_time'].replace('Z', '+00:00'))
        if booking_time >= cutoff_time:
            active_entities.add(booking.get('identity'))
    
    for checkout in recent_library:
        checkout_time = datetime.fromisoformat(checkout['checkout_time'].replace('Z', '+00:00'))
        if checkout_time >= cutoff_time:
            active_entities.add(checkout.get('identity'))
    
    # Find inactive entities
    inactive_entities = []
    for profile in all_profiles[:limit]:
        entity_id = profile.get('entity_id')
        if entity_id not in active_entities:
            # Get last known activity
            last_activity = None
            last_location = "Unknown"
            
            # Check all sources for last activity
            entity_swipes = [s for s in recent_swipes if s.get('identity') == entity_id]
            entity_wifi = [w for w in recent_wifi if w.get('identity') == entity_id]
            
            all_activities = []
            if entity_swipes:
                all_activities.extend([(s['timestamp'], s.get('location', 'Unknown')) for s in entity_swipes])
            if entity_wifi:
                all_activities.extend([(w['timestamp'], w.get('location', 'Unknown')) for w in entity_wifi])
            
            if all_activities:
                all_activities.sort(reverse=True)
                last_activity = all_activities[0][0]
                last_location = all_activities[0][1]
            
            inactive_entities.append({
                "entity_id": entity_id,
                "name": profile.get('name', 'Unknown'),
                "email": profile.get('email'),
                "department": profile.get('department'),
                "last_seen": last_activity,
                "last_location": last_location,
                "hours_inactive": hours if not last_activity else int((datetime.now() - datetime.fromisoformat(last_activity.replace('Z', '+00:00'))).total_seconds() / 3600),
                "alert_severity": "high" if hours >= 24 else "medium"
            })
    
    return {
        "cutoff_time": cutoff_time.isoformat(),
        "hours_threshold": hours,
        "total_inactive": len(inactive_entities),
        "inactive_entities": inactive_entities[:limit]
    }

# ============================================
# MAIN
# ============================================
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
