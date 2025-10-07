"""
Advanced Entity Resolution Module
Implements multi-identifier matching, fuzzy name matching, and confidence scoring
"""

from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from difflib import SequenceMatcher
import re
from database import supabase, DatabaseService


class EntityResolver:
    """Advanced entity resolution with confidence scoring"""
    
    @staticmethod
    def calculate_name_similarity(name1: str, name2: str) -> float:
        """
        Calculate similarity between two names using multiple algorithms
        Returns a score between 0 and 1
        """
        if not name1 or not name2:
            return 0.0
        
        name1 = name1.lower().strip()
        name2 = name2.lower().strip()
        
        # Exact match
        if name1 == name2:
            return 1.0
        
        # Sequence matcher for overall similarity
        seq_sim = SequenceMatcher(None, name1, name2).ratio()
        
        # Token-based matching (handles name order variations)
        tokens1 = set(name1.split())
        tokens2 = set(name2.split())
        if tokens1 and tokens2:
            token_sim = len(tokens1 & tokens2) / len(tokens1 | tokens2)
        else:
            token_sim = 0.0
        
        # Combine scores with weights
        return (seq_sim * 0.6 + token_sim * 0.4)
    
    @staticmethod
    def resolve_entity(
        name: Optional[str] = None,
        email: Optional[str] = None,
        card_id: Optional[str] = None,
        device_hash: Optional[str] = None,
        face_id: Optional[str] = None,
        student_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Advanced entity resolution with confidence scoring and multi-identifier matching
        
        Scoring weights:
        - card_id exact match: 0.25
        - device_hash exact match: 0.20
        - face_id exact match: 0.20
        - student_id exact match: 0.15
        - email exact match: 0.15
        - name fuzzy match: up to 0.20 (based on similarity)
        """
        try:
            candidates = []
            
            # Get all profiles for matching
            all_profiles = supabase.table("profiles").select("*").execute()
            
            for profile in all_profiles.data:
                match_score = 0.0
                matched_fields = []
                evidence = []
                
                # Exact matches (high confidence)
                if card_id and profile.get("card_id") == card_id:
                    match_score += 0.25
                    matched_fields.append("card_id")
                    evidence.append(f"Card ID exact match: {card_id}")
                
                if device_hash and profile.get("device_hash") == device_hash:
                    match_score += 0.20
                    matched_fields.append("device_hash")
                    evidence.append(f"Device hash exact match: {device_hash[:10]}...")
                
                if face_id and profile.get("face_id") == face_id:
                    match_score += 0.20
                    matched_fields.append("face_id")
                    evidence.append(f"Face ID exact match: {face_id}")
                
                if student_id and profile.get("student_id") == student_id:
                    match_score += 0.15
                    matched_fields.append("student_id")
                    evidence.append(f"Student ID exact match: {student_id}")
                
                if email and profile.get("email") == email:
                    match_score += 0.15
                    matched_fields.append("email")
                    evidence.append(f"Email exact match: {email}")
                
                # Fuzzy name matching
                if name and profile.get("name"):
                    name_sim = EntityResolver.calculate_name_similarity(name, profile.get("name"))
                    if name_sim >= 0.7:  # Only consider if similarity is high enough
                        name_match_score = name_sim * 0.20
                        match_score += name_match_score
                        matched_fields.append("name_fuzzy")
                        evidence.append(f"Name similarity: {name_sim:.2%} - '{name}' ≈ '{profile.get('name')}'")
                
                # Only add if we have some match
                if match_score > 0:
                    # Normalize to 0-1 range (max possible score is 1.15)
                    confidence = min(match_score / 1.15, 1.0)
                    
                    candidates.append({
                        "entity_id": profile.get("entity_id"),
                        "profile": profile,
                        "confidence": confidence,
                        "matched_fields": matched_fields,
                        "evidence": evidence,
                        "match_score": match_score
                    })
            
            # Sort by confidence score
            candidates.sort(key=lambda x: x["confidence"], reverse=True)
            
            if not candidates:
                return {
                    "success": False,
                    "message": "No matching entities found",
                    "candidates": []
                }
            
            # Return top candidate and alternatives
            return {
                "success": True,
                "best_match": candidates[0],
                "alternatives": candidates[1:5] if len(candidates) > 1 else [],
                "total_candidates": len(candidates),
                "resolution_method": "multi_identifier_fuzzy"
            }
            
        except Exception as e:
            print(f"Error in entity resolution: {e}")
            return {
                "success": False,
                "error": str(e),
                "candidates": []
            }
    
    @staticmethod
    def get_provenance(entity_id: str) -> Dict[str, Any]:
        """
        Get provenance information showing which data sources contributed to entity profile
        """
        try:
            profile = DatabaseService.get_profile_by_entity_id(entity_id)
            if not profile:
                return {"error": "Entity not found"}
            
            provenance = {
                "entity_id": entity_id,
                "name": profile.get("name"),
                "data_sources": [],
                "identifier_sources": {},
                "activity_sources": {},
                "last_updated": datetime.now().isoformat()
            }
            
            # Check which identifiers are present
            if profile.get("card_id"):
                provenance["identifier_sources"]["card_id"] = {
                    "value": profile.get("card_id"),
                    "source": "swipes",
                    "confidence": "high"
                }
                provenance["data_sources"].append("swipes")
            
            if profile.get("device_hash"):
                provenance["identifier_sources"]["device_hash"] = {
                    "value": profile.get("device_hash"),
                    "source": "wifi_logs",
                    "confidence": "high"
                }
                provenance["data_sources"].append("wifi_logs")
            
            if profile.get("face_id"):
                provenance["identifier_sources"]["face_id"] = {
                    "value": profile.get("face_id"),
                    "source": "cctv_frame",
                    "confidence": "medium"
                }
                provenance["data_sources"].append("cctv_frame")
            
            if profile.get("student_id"):
                provenance["identifier_sources"]["student_id"] = {
                    "value": profile.get("student_id"),
                    "source": "profiles",
                    "confidence": "high"
                }
            
            # Get activity counts from different sources
            cutoff = (datetime.now() - timedelta(days=30)).isoformat()
            
            try:
                swipes = supabase.table("swipes").select("identity", count="exact").eq("entity_id", entity_id).gte("timestamp", cutoff).execute()
                provenance["activity_sources"]["swipes"] = {
                    "count": swipes.count if hasattr(swipes, 'count') else 0,
                    "period": "last_30_days"
                }
            except:
                provenance["activity_sources"]["swipes"] = {"count": 0, "period": "last_30_days"}
            
            try:
                wifi = supabase.table("wifi_logs").select("identity", count="exact").eq("entity_id", entity_id).gte("timestamp", cutoff).execute()
                provenance["activity_sources"]["wifi_logs"] = {
                    "count": wifi.count if hasattr(wifi, 'count') else 0,
                    "period": "last_30_days"
                }
            except:
                provenance["activity_sources"]["wifi_logs"] = {"count": 0, "period": "last_30_days"}
            
            # Remove duplicates
            provenance["data_sources"] = list(set(provenance["data_sources"]))
            
            return provenance
            
        except Exception as e:
            print(f"Error getting provenance: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def get_cross_source_links(entity_id: str) -> Dict[str, Any]:
        """
        Get all cross-source linkages for an entity showing how records are connected
        """
        try:
            profile = DatabaseService.get_profile_by_entity_id(entity_id)
            if not profile:
                return {"error": "Entity not found"}
            
            links = {
                "entity_id": entity_id,
                "name": profile.get("name"),
                "linkages": []
            }
            
            # Card -> Swipes linkage
            if profile.get("card_id"):
                try:
                    swipes = supabase.table("swipes").select("*").eq("card_id", profile.get("card_id")).limit(5).order("timestamp", desc=True).execute()
                    if swipes.data:
                        links["linkages"].append({
                            "type": "card_to_swipes",
                            "identifier": profile.get("card_id"),
                            "source_table": "profiles",
                            "target_table": "swipes",
                            "record_count": len(swipes.data),
                            "confidence": 0.95,
                            "sample_records": swipes.data[:3]
                        })
                except Exception as e:
                    print(f"Error linking card to swipes: {e}")
            
            # Device -> WiFi linkage
            if profile.get("device_hash"):
                try:
                    wifi = supabase.table("wifi_logs").select("*").eq("device_hash", profile.get("device_hash")).limit(5).order("timestamp", desc=True).execute()
                    if wifi.data:
                        links["linkages"].append({
                            "type": "device_to_wifi",
                            "identifier": profile.get("device_hash"),
                            "source_table": "profiles",
                            "target_table": "wifi_logs",
                            "record_count": len(wifi.data),
                            "confidence": 0.90,
                            "sample_records": wifi.data[:3]
                        })
                except Exception as e:
                    print(f"Error linking device to wifi: {e}")
            
            # Face -> CCTV linkage
            if profile.get("face_id"):
                try:
                    cctv = supabase.table("cctv_frame").select("*").eq("face_id", profile.get("face_id")).limit(5).order("timestamp", desc=True).execute()
                    if cctv.data:
                        links["linkages"].append({
                            "type": "face_to_cctv",
                            "identifier": profile.get("face_id"),
                            "source_table": "profiles",
                            "target_table": "cctv_frame",
                            "record_count": len(cctv.data),
                            "confidence": 0.85,
                            "sample_records": cctv.data[:3]
                        })
                except Exception as e:
                    print(f"Error linking face to cctv: {e}")
            
            links["total_linkages"] = len(links["linkages"])
            links["overall_confidence"] = sum(l["confidence"] for l in links["linkages"]) / len(links["linkages"]) if links["linkages"] else 0
            
            return links
            
        except Exception as e:
            print(f"Error getting cross-source links: {e}")
            return {"error": str(e)}
