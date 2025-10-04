import os
from supabase import create_client, Client
from dotenv import load_dotenv
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta

load_dotenv("creds.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


class DatabaseService:
    """Service class for database operations"""
    
    @staticmethod
    def get_all_profiles(limit: int = 100, offset: int = 0):
        """Get all profiles with pagination"""
        response = supabase.table("profiles").select("*").range(offset, offset + limit - 1).execute()
        return response.data
    
    @staticmethod
    def get_profile_by_entity_id(entity_id: str):
        """Get a specific profile by entity_id"""
        response = supabase.table("profiles").select("*").eq("entity_id", entity_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def search_profiles(query: str, field: str = "name"):
        """Search profiles by name, email, or department"""
        response = supabase.table("profiles").select("*").ilike(field, f"%{query}%").execute()
        return response.data
    
    @staticmethod
    def get_recent_swipes(limit: int = 50, entity_id: Optional[str] = None):
        """Get recent swipe records"""
        query = supabase.table("swipes").select("*").order("timestamp", desc=True).limit(limit)
        if entity_id:
            query = query.eq("identity", entity_id)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_recent_wifi_logs(limit: int = 50, entity_id: Optional[str] = None):
        """Get recent WiFi logs"""
        query = supabase.table("wifi_logs").select("*").order("timestamp", desc=True).limit(limit)
        if entity_id:
            query = query.eq("identity", entity_id)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_lab_bookings(entity_id: Optional[str] = None, upcoming: bool = False):
        """Get lab bookings"""
        query = supabase.table("lab_bookings").select("*").order("start_time", desc=True)
        if entity_id:
            query = query.eq("entity_id", entity_id)
        if upcoming:
            now = datetime.now().isoformat()
            query = query.gte("start_time", now)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_library_checkouts(entity_id: Optional[str] = None):
        """Get library checkouts"""
        query = supabase.table("library_checkouts").select("*").order("timestamp", desc=True)
        if entity_id:
            query = query.eq("entity_id", entity_id)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_notes(entity_id: Optional[str] = None, source: Optional[str] = None):
        """Get notes"""
        query = supabase.table("notes").select("*").order("timestamp", desc=True)
        if entity_id:
            query = query.eq("entity_id", entity_id)
        if source:
            query = query.eq("source", source)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_cctv_frames(location_id: Optional[str] = None, limit: int = 50):
        """Get CCTV frames"""
        query = supabase.table("cctv_frame").select("*").order("timestamp", desc=True).limit(limit)
        if location_id:
            query = query.eq("location_id", location_id)
        response = query.execute()
        return response.data
    
    @staticmethod
    def get_face_embedding(face_id: str):
        """Get face embedding by face_id"""
        response = supabase.table("face_embedding").select("*").eq("face_id", face_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def resolve_entity(card_id: Optional[str] = None, 
                      device_hash: Optional[str] = None, 
                      face_id: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Resolve entity across multiple data sources
        Returns the entity profile with confidence score
        """
        matches = []
        
        # Search by card_id
        if card_id:
            profile = supabase.table("profiles").select("*").eq("card_id", card_id).execute()
            if profile.data:
                matches.append({"source": "card", "profile": profile.data[0], "confidence": 0.95})
        
        # Search by device_hash
        if device_hash:
            profile = supabase.table("profiles").select("*").eq("device_hash", device_hash).execute()
            if profile.data:
                matches.append({"source": "device", "profile": profile.data[0], "confidence": 0.85})
        
        # Search by face_id
        if face_id:
            profile = supabase.table("profiles").select("*").eq("face_id", face_id).execute()
            if profile.data:
                matches.append({"source": "face", "profile": profile.data[0], "confidence": 0.90})
        
        if not matches:
            return None
        
        # Check for conflicts: different entities from different sources
        entity_ids = set(m["profile"]["entity_id"] for m in matches)
        if len(entity_ids) > 1:
            return {
                "conflict": True,
                "matched_entities": [m["profile"]["entity_id"] for m in matches],
                "sources": [m["source"] for m in matches],
                "error": "Multiple sources matched different entities"
            }
        
        # Return the match with highest confidence
        best_match = max(matches, key=lambda x: x["confidence"])
        return {
            "entity_id": best_match["profile"]["entity_id"],
            "confidence": best_match["confidence"],
            "matched_sources": [m["source"] for m in matches],
            "profile": best_match["profile"]
        }
    
    @staticmethod
    def get_entity_activity_timeline(entity_id: str, days: int = 7) -> Dict[str, Any]:
        """
        Get comprehensive activity timeline for an entity
        Combines swipes, wifi logs, lab bookings, library checkouts
        """
        cutoff_date = (datetime.now() - timedelta(days=days)).isoformat()
        
        # Get all activities
        swipes = supabase.table("swipes").select("*").eq("identity", entity_id).gte("timestamp", cutoff_date).execute()
        wifi_logs = supabase.table("wifi_logs").select("*").eq("identity", entity_id).gte("timestamp", cutoff_date).execute()
        lab_bookings = supabase.table("lab_bookings").select("*").eq("entity_id", entity_id).gte("start_time", cutoff_date).execute()
        library_checkouts = supabase.table("library_checkouts").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        
        return {
            "entity_id": entity_id,
            "period_days": days,
            "swipes": swipes.data,
            "wifi_logs": wifi_logs.data,
            "lab_bookings": lab_bookings.data,
            "library_checkouts": library_checkouts.data,
            "total_activities": len(swipes.data) + len(wifi_logs.data) + len(lab_bookings.data) + len(library_checkouts.data)
        }
    
    @staticmethod
    def get_security_stats() -> Dict[str, Any]:
        """
        Get security statistics for the Security dashboard
        """
        # Get recent activities
        recent_swipes = supabase.table("swipes").select("*").order("timestamp", desc=True).limit(100).execute()
        recent_cctv = supabase.table("cctv_frame").select("*").order("timestamp", desc=True).limit(100).execute()
        
        # Calculate stats (this is mock data - you'd implement real logic)
        return {
            "active_threats": 3,
            "resolved_today": 12,
            "monitored_zones": 24,
            "access_violations": 5,
            "total_swipes_today": len(recent_swipes.data),
            "total_cctv_frames_today": len(recent_cctv.data)
        }
    
    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """
        Get dashboard statistics
        """
        total_profiles = supabase.table("profiles").select("entity_id", count="exact").execute()
        recent_swipes = supabase.table("swipes").select("*").order("timestamp", desc=True).limit(100).execute()
        
        return {
            "total_entities": total_profiles.count if hasattr(total_profiles, 'count') else 0,
            "active_today": len(set(s.get("identity") for s in recent_swipes.data if s.get("identity"))),
            "total_activities": len(recent_swipes.data),
            "resolution_accuracy": None  # TODO: Implement real calculation
        }
