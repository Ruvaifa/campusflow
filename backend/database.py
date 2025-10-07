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
        try:
            query = supabase.table("lab_bookings").select("*").order("start_time", desc=True)
            if entity_id:
                query = query.eq("entity_id", entity_id)
            if upcoming:
                now = datetime.now().isoformat()
                query = query.gte("start_time", now)
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting lab bookings for entity {entity_id}: {e}")
            return []
    
    @staticmethod
    def get_library_checkouts(entity_id: Optional[str] = None):
        """Get library checkouts"""
        try:
            query = supabase.table("library_checkouts").select("*").order("timestamp", desc=True)
            if entity_id:
                query = query.eq("entity_id", entity_id)
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting library checkouts for entity {entity_id}: {e}")
            return []
    
    @staticmethod
    def get_notes(entity_id: Optional[str] = None, source: Optional[str] = None):
        """Get notes"""
        try:
            query = supabase.table("notes").select("*").order("timestamp", desc=True)
            if entity_id:
                query = query.eq("entity_id", entity_id)
            if source:
                query = query.eq("source", source)
            response = query.execute()
            return response.data
        except Exception as e:
            print(f"Error getting notes for entity {entity_id}: {e}")
            return []
    
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
        swipes = supabase.table("swipes").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        wifi_logs = supabase.table("wifi_logs").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        
        # Get lab bookings and library checkouts
        try:
            lab_bookings = supabase.table("lab_bookings").select("*").eq("entity_id", entity_id).gte("start_time", cutoff_date).execute()
        except Exception as e:
            print(f"Error getting lab bookings in timeline: {e}")
            lab_bookings = type('obj', (object,), {'data': []})()
        
        try:
            library_checkouts = supabase.table("library_checkouts").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        except Exception as e:
            print(f"Error getting library checkouts in timeline: {e}")
            library_checkouts = type('obj', (object,), {'data': []})() 
        
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
        Get security statistics for the Security dashboard - OPTIMIZED
        """
        try:
            from datetime import datetime, timedelta
            today_cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
            
            # Get recent activities count only
            recent_swipes = supabase.table("swipes").select("entity_id", count="exact").gte("timestamp", today_cutoff).execute()
            recent_cctv = supabase.table("cctv_frame").select("frame_id", count="exact").gte("timestamp", today_cutoff).execute()
            
            # Return stats quickly
            return {
                "active_threats": 3,
                "resolved_today": 12,
                "monitored_zones": 24,
                "access_violations": 5,
                "total_swipes_today": recent_swipes.count if hasattr(recent_swipes, 'count') else len(recent_swipes.data),
                "total_cctv_frames_today": recent_cctv.count if hasattr(recent_cctv, 'count') else len(recent_cctv.data)
            }
        except Exception as e:
            print(f"Error getting security stats: {e}")
            return {
                "active_threats": 0,
                "resolved_today": 0,
                "monitored_zones": 0,
                "access_violations": 0,
                "total_swipes_today": 0,
                "total_cctv_frames_today": 0
            }
    
    @staticmethod
    def get_dashboard_stats() -> Dict[str, Any]:
        """
        Get dashboard statistics - OPTIMIZED for speed
        """
        try:
            # Count total profiles
            total_profiles = supabase.table("profiles").select("entity_id", count="exact").execute()
            total_count = total_profiles.count if hasattr(total_profiles, 'count') else len(total_profiles.data)
            
            # Get recent activity (last 24 hours)
            from datetime import datetime, timedelta
            today_cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
            
            recent_swipes = supabase.table("swipes").select("entity_id").gte("timestamp", today_cutoff).execute()
            recent_wifi = supabase.table("wifi_logs").select("entity_id").gte("timestamp", today_cutoff).execute()
            
            # Count unique active entities
            active_entities = set()
            for swipe in recent_swipes.data:
                if swipe.get("entity_id"):
                    active_entities.add(swipe.get("entity_id"))
            for wifi in recent_wifi.data:
                if wifi.get("entity_id"):
                    active_entities.add(wifi.get("entity_id"))
            
            return {
                "total_entities": total_count,
                "active_today": len(active_entities),
                "total_activities": len(recent_swipes.data) + len(recent_wifi.data),
                "resolution_accuracy": 0.95  # Static value for demo
            }
        except Exception as e:
            print(f"Error getting dashboard stats: {e}")
            return {
                "total_entities": 0,
                "active_today": 0,
                "total_activities": 0,
                "resolution_accuracy": 0.0
            }
    
    @staticmethod
    def get_entities_enriched(limit: int = 100, offset: int = 0, status: Optional[str] = None, search: Optional[str] = None) -> Dict[str, Any]:
        """
        Get entities with enriched data including activity status and last seen
        Supports filtering by status and searching by name/email
        
        OPTIMIZED: Returns basic profile data quickly without per-entity activity queries
        """
        try:
            # Get profiles with optional search
            query = supabase.table("profiles").select("*")
            
            if search:
                # Search in name, email, or department
                query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%,department.ilike.%{search}%")
            
            profiles_response = query.range(offset, offset + limit - 1).execute()
            profiles = profiles_response.data
            
            # If no profiles, return empty result
            if not profiles:
                return {
                    "entities": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset
                }
            
            # Get recent activity for all entities at once (much faster)
            recent_cutoff = (datetime.now() - timedelta(hours=24)).isoformat()
            entity_ids = [p.get("entity_id") for p in profiles if p.get("entity_id")]
            
            # Fetch recent swipes and wifi logs for these entities in bulk
            recent_swipes = {}
            recent_wifi = {}
            
            try:
                swipes_data = supabase.table("swipes").select("entity_id, timestamp, location_id").in_("entity_id", entity_ids).gte("timestamp", recent_cutoff).order("timestamp", desc=True).execute()
                for swipe in swipes_data.data:
                    eid = swipe.get("entity_id")
                    if eid and eid not in recent_swipes:
                        recent_swipes[eid] = swipe
            except Exception as e:
                print(f"Error fetching bulk swipes: {e}")
            
            try:
                wifi_data = supabase.table("wifi_logs").select("entity_id, timestamp, ap_id").in_("entity_id", entity_ids).gte("timestamp", recent_cutoff).order("timestamp", desc=True).execute()
                for wifi in wifi_data.data:
                    eid = wifi.get("entity_id")
                    if eid and eid not in recent_wifi:
                        recent_wifi[eid] = wifi
            except Exception as e:
                print(f"Error fetching bulk wifi: {e}")
            
            # Enrich each profile with activity data
            enriched_entities = []
            cutoff_active = datetime.now() - timedelta(hours=1)
            cutoff_recent = datetime.now() - timedelta(hours=24)
            
            for profile in profiles:
                entity_id = profile.get("entity_id")
                
                # Check for recent activity
                last_seen = None
                last_location = "Unknown"
                entity_status = "inactive"
                
                # Get most recent activity from bulk data
                swipe = recent_swipes.get(entity_id)
                wifi = recent_wifi.get(entity_id)
                
                if swipe or wifi:
                    swipe_time = swipe.get("timestamp") if swipe else None
                    wifi_time = wifi.get("timestamp") if wifi else None
                    
                    # Find most recent
                    if swipe_time and wifi_time:
                        if swipe_time > wifi_time:
                            last_seen = swipe_time
                            last_location = swipe.get("location_id", "Unknown")
                        else:
                            last_seen = wifi_time
                            last_location = wifi.get("ap_id", "Unknown")
                    elif swipe_time:
                        last_seen = swipe_time
                        last_location = swipe.get("location_id", "Unknown")
                    elif wifi_time:
                        last_seen = wifi_time
                        last_location = wifi.get("ap_id", "Unknown")
                    
                    # Determine status
                    if last_seen:
                        try:
                            last_seen_dt = datetime.fromisoformat(last_seen.replace('Z', '+00:00')).replace(tzinfo=None)
                            if last_seen_dt >= cutoff_active:
                                entity_status = "active"
                            elif last_seen_dt >= cutoff_recent:
                                entity_status = "recent"
                        except:
                            pass
                
                # Calculate confidence score (based on data completeness)
                confidence = 0.5
                if profile.get("card_id"):
                    confidence += 0.15
                if profile.get("device_hash"):
                    confidence += 0.15
                if profile.get("face_id"):
                    confidence += 0.20
                
                # Filter by status if specified
                if status and status != "all" and entity_status != status:
                    continue
                
                enriched_entities.append({
                    **profile,
                    "last_seen": last_seen,
                    "last_location": last_location,
                    "status": entity_status,
                    "confidence": round(confidence, 2)
                })
            
            return {
                "entities": enriched_entities,
                "total": len(enriched_entities),
                "limit": limit,
                "offset": offset
            }
        except Exception as e:
            print(f"Error in get_entities_enriched: {e}")
            return {
                "entities": [],
                "total": 0,
                "limit": limit,
                "offset": offset,
                "error": str(e)
            }
    
    @staticmethod
    def get_entity_details(entity_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed entity information including profile and recent activity summary
        """
        # Get profile
        profile = DatabaseService.get_profile_by_entity_id(entity_id)
        if not profile:
            return None
        
        # Get activity counts (last 7 days)
        cutoff_date = (datetime.now() - timedelta(days=7)).isoformat()
        
        swipes = supabase.table("swipes").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        wifi_logs = supabase.table("wifi_logs").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        
        # Get lab bookings and library checkouts
        try:
            lab_bookings = supabase.table("lab_bookings").select("*").eq("entity_id", entity_id).gte("start_time", cutoff_date).execute()
        except Exception as e:
            print(f"Error getting lab bookings in details: {e}")
            lab_bookings = type('obj', (object,), {'data': []})()
        
        try:
            library_checkouts = supabase.table("library_checkouts").select("*").eq("entity_id", entity_id).gte("timestamp", cutoff_date).execute()
        except Exception as e:
            print(f"Error getting library checkouts in details: {e}")
            library_checkouts = type('obj', (object,), {'data': []})() 
        
        # Get latest activity
        all_activities = []
        for swipe in swipes.data:
            all_activities.append({
                "timestamp": swipe.get("timestamp"),
                "type": "swipe",
                "location": swipe.get("location_id", "Unknown Location"),
                "details": f"Card swipe at {swipe.get('location_id', 'Unknown Location')}"
            })
        
        for wifi in wifi_logs.data:
            all_activities.append({
                "timestamp": wifi.get("timestamp"),
                "type": "wifi",
                "location": wifi.get("ap_id", "Unknown AP"),
                "details": f"WiFi connection at {wifi.get('ap_id', 'Unknown AP')}"
            })
        
        for booking in lab_bookings.data:
            all_activities.append({
                "timestamp": booking.get("start_time"),
                "type": "booking",
                "location": booking.get("room_id", "Unknown Room"),
                "details": f"Lab booking: {booking.get('room_id', 'Unknown Room')}"
            })
        
        for checkout in library_checkouts.data:
            all_activities.append({
                "timestamp": checkout.get("timestamp"),
                "type": "checkout",
                "location": "Library",
                "details": f"Checked out: {checkout.get('book_id', 'Unknown Book')}"
            })
        
        # Sort activities by timestamp
        all_activities.sort(key=lambda x: x["timestamp"] if x["timestamp"] else "", reverse=True)
        
        # Calculate status
        if all_activities:
            latest_time = all_activities[0]["timestamp"]
            cutoff_active = (datetime.now() - timedelta(hours=1)).isoformat()
            cutoff_recent = (datetime.now() - timedelta(hours=24)).isoformat()
            
            if latest_time >= cutoff_active:
                status = "active"
            elif latest_time >= cutoff_recent:
                status = "recent"
            else:
                status = "inactive"
        else:
            status = "inactive"
        
        return {
            "profile": profile,
            "status": status,
            "activity_summary": {
                "swipes": len(swipes.data),
                "wifi_connections": len(wifi_logs.data),
                "lab_bookings": len(lab_bookings.data),
                "library_checkouts": len(library_checkouts.data),
                "total_activities": len(all_activities)
            },
            "recent_activities": all_activities[:20],  # Return last 20 activities
            "last_seen": all_activities[0]["timestamp"] if all_activities else None,
            "last_location": all_activities[0]["location"] if all_activities else "Unknown"
        }

    @staticmethod
    def generate_security_alerts(status: Optional[str] = None, limit: int = 100) -> Dict[str, Any]:
        """
        Generate security alerts based on entity inactivity patterns
        
        Alert Logic:
        - Active: Last seen within 6 hours
        - Warning: Last seen 6-12 hours ago  
        - Alert: Last seen more than 12 hours ago
        
        OPTIMIZED: Only fetch recent activity data, not all profiles
        """
        from datetime import datetime, timedelta
        
        now = datetime.now()
        warning_cutoff = (now - timedelta(hours=6)).isoformat()
        alert_cutoff = (now - timedelta(hours=12)).isoformat()
        
        alerts = []
        active_count = 0
        warning_count = 0
        alert_count = 0
        
        try:
            # Get all recent swipes and wifi logs (last 24 hours) - much faster than querying per entity
            recent_cutoff = (now - timedelta(hours=24)).isoformat()
            
            recent_swipes = supabase.table("swipes").select("entity_id, timestamp").gte("timestamp", recent_cutoff).order("timestamp", desc=True).execute()
            recent_wifi = supabase.table("wifi_logs").select("entity_id, timestamp").gte("timestamp", recent_cutoff).order("timestamp", desc=True).execute()
            
            # Build a map of entity_id -> latest activity time
            entity_last_activity = {}
            
            for swipe in recent_swipes.data:
                entity_id = swipe.get("entity_id")
                timestamp = swipe.get("timestamp")
                if entity_id and timestamp:
                    if entity_id not in entity_last_activity or timestamp > entity_last_activity[entity_id]:
                        entity_last_activity[entity_id] = timestamp
            
            for wifi in recent_wifi.data:
                entity_id = wifi.get("entity_id")
                timestamp = wifi.get("timestamp")
                if entity_id and timestamp:
                    if entity_id not in entity_last_activity or timestamp > entity_last_activity[entity_id]:
                        entity_last_activity[entity_id] = timestamp
            
            # Get a sample of profiles for alert generation
            all_profiles = DatabaseService.get_all_profiles(limit=min(limit * 10, 1000))
            
            for profile in all_profiles:
                entity_id = profile.get("entity_id")
                
                # Check if entity has recent activity from our cached map
                last_activity_time = entity_last_activity.get(entity_id)
                
                if last_activity_time:
                    try:
                        last_activity_dt = datetime.fromisoformat(last_activity_time.replace('Z', '+00:00')).replace(tzinfo=None)
                    except:
                        last_activity_dt = None
                else:
                    last_activity_dt = None
                
                # Determine alert level based on last activity
                if last_activity_dt is None:
                    # No activity in last 24 hours - check if entity is truly inactive
                    # For demo purposes, only count as critical if no activity at all
                    alert_level = "critical"
                    hours_inactive = "24+"
                    alert_count += 1
                elif last_activity_dt >= datetime.fromisoformat(warning_cutoff):
                    # Active within 6 hours
                    alert_level = "active"
                    hours_inactive = int((now - last_activity_dt).total_seconds() / 3600)
                    active_count += 1
                    continue  # Don't create alert for active entities
                elif last_activity_dt >= datetime.fromisoformat(alert_cutoff):
                    # Warning: 6-12 hours inactive
                    alert_level = "warning"
                    hours_inactive = int((now - last_activity_dt).total_seconds() / 3600)
                    warning_count += 1
                else:
                    # Alert: More than 12 hours inactive
                    alert_level = "critical"
                    hours_inactive = int((now - last_activity_dt).total_seconds() / 3600)
                    alert_count += 1
                
                # Create alert entry
                alert = {
                    "id": f"alert-{entity_id}",
                    "entity_id": entity_id,
                    "alert_type": "Inactivity Alert",
                    "severity": alert_level,
                    "description": f"Entity inactive for {hours_inactive} hours" if isinstance(hours_inactive, int) else "No recent activity",
                    "location": "Unknown",
                    "timestamp": now.isoformat(),
                    "status": "active",
                    "profile": profile,
                    "hours_inactive": hours_inactive,
                    "last_seen": last_activity_time
                }
                
                # Filter by status if provided
                if status and alert_level != status and status != "active":
                    continue
                
                alerts.append(alert)
                
                # Limit number of alerts returned
                if len(alerts) >= limit:
                    break
                    
        except Exception as e:
            print(f"Error in generate_security_alerts: {e}")
            import traceback
            traceback.print_exc()
        
        # Sort by severity (critical first, then warning)
        alerts.sort(key=lambda x: (0 if x["severity"] == "critical" else 1, x["entity_id"]))
        
        # Add summary statistics
        summary = {
            "total_entities": len(all_profiles),
            "active_entities": active_count,
            "warning_entities": warning_count,
            "alert_entities": alert_count,
            "total_alerts": len(alerts)
        }
        
        return {
            "alerts": alerts[:limit],
            "summary": summary
        }

    @staticmethod
    def populate_test_activity_data():
        """Populate test activity data for demonstration"""
        from datetime import datetime, timedelta
        import random
        
        try:
            # Get some entity IDs
            profiles = DatabaseService.get_all_profiles(limit=100)
            if not profiles:
                return {"error": "No profiles found"}
            
            now = datetime.now()
            activities_created = 0
            
            for i, profile in enumerate(profiles[:50]):  # Create data for first 50 entities
                entity_id = profile.get("entity_id")
                
                # Create different activity patterns
                if i < 10:
                    # Recent activity (within 6 hours) - should be "active"
                    activity_time = now - timedelta(hours=random.randint(1, 5))
                elif i < 25:
                    # Warning level (6-12 hours ago)
                    activity_time = now - timedelta(hours=random.randint(6, 12))
                else:
                    # Alert level (more than 12 hours ago)
                    activity_time = now - timedelta(hours=random.randint(13, 48))
                
                # Create swipe record
                swipe_data = {
                    "identity": entity_id,
                    "card_id": profile.get("card_id", f"CARD_{i}"),
                    "location_id": f"LOC_{random.randint(1, 10)}",
                    "timestamp": activity_time.isoformat()
                }
                
                response = supabase.table("swipes").insert(swipe_data).execute()
                if response.data:
                    activities_created += 1
                
                # Sometimes add WiFi activity too
                if random.random() > 0.5:
                    wifi_data = {
                        "identity": entity_id,
                        "device_hash": profile.get("device_hash", f"DH_{i}"),
                        "ap_id": f"AP_{random.randint(1, 5)}",
                        "timestamp": (activity_time + timedelta(minutes=random.randint(1, 30))).isoformat()
                    }
                    wifi_response = supabase.table("wifi_logs").insert(wifi_data).execute()
                    if wifi_response.data:
                        activities_created += 1
            
            return {
                "success": True,
                "message": f"Created {activities_created} activity records for testing",
                "entities_processed": min(50, len(profiles))
            }
            
        except Exception as e:
            return {"error": f"Failed to populate test data: {str(e)}"}
    
    @staticmethod
    def get_alerts(status: Optional[str] = None, limit: int = 100):
        """
        Get alerts from the public.alerts table
        """
        query = supabase.table("alerts").select("*")
        if status:
            query = query.eq("status", status)
        response = query.limit(limit).execute()
        return response.data
    
    @staticmethod
    def get_alert_by_entity_id(entity_id: str):
        """
        Get alert for a specific entity
        """
        response = supabase.table("alerts").select("*").eq("entity_id", entity_id).execute()
        return response.data[0] if response.data else None
    
    @staticmethod
    def update_alert_status(entity_id: str, status: str):
        """
        Update alert status
        """
        response = supabase.table("alerts").update({"status": status}).eq("entity_id", entity_id).execute()
        return response.data[0] if response.data else None
        total_profiles = supabase.table("profiles").select("entity_id", count="exact").execute()
        recent_swipes = supabase.table("swipes").select("*").order("timestamp", desc=True).limit(100).execute()
        
        return {
            "total_entities": total_profiles.count if hasattr(total_profiles, 'count') else 0,
            "active_today": len(set(s.get("identity") for s in recent_swipes.data if s.get("identity"))),
            "total_activities": len(recent_swipes.data),
            "resolution_accuracy": None  # TODO: Implement real calculation
        }

