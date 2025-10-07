"""
Predictive Monitoring & Explainability Module
Implements ML-based inference for missing data points with evidence-based reasoning
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict, Counter
import statistics
from database import supabase, DatabaseService


class PredictiveMonitor:
    """ML-based predictive monitoring with explainability"""
    
    @staticmethod
    def predict_next_location(entity_id: str) -> Dict[str, Any]:
        """
        Predict next likely location based on historical patterns
        """
        try:
            timeline = DatabaseService.get_entity_timeline(entity_id)
            if not timeline or not timeline.get("activities"):
                return {"error": "Insufficient data for prediction"}
            
            activities = timeline["activities"]
            
            # Extract patterns from recent activities
            location_frequency = Counter()
            time_location_patterns = defaultdict(list)
            location_transitions = defaultdict(Counter)
            
            for i, activity in enumerate(activities):
                location = activity["location"]
                timestamp = datetime.fromisoformat(activity["timestamp"].replace('Z', '+00:00'))
                hour = timestamp.hour
                day_of_week = timestamp.weekday()
                
                location_frequency[location] += 1
                time_location_patterns[hour].append(location)
                
                # Track location transitions
                if i > 0:
                    prev_location = activities[i-1]["location"]
                    location_transitions[prev_location][location] += 1
            
            # Get current time context
            now = datetime.now()
            current_hour = now.hour
            current_day = now.weekday()
            
            # Calculate prediction scores
            predictions = []
            current_location = timeline["current_location"]
            
            # Based on time patterns
            if current_hour in time_location_patterns:
                time_based_locations = Counter(time_location_patterns[current_hour])
                for loc, count in time_based_locations.most_common(5):
                    prob = count / len(time_location_patterns[current_hour])
                    predictions.append({
                        "location": loc,
                        "probability": prob,
                        "method": "time_pattern",
                        "evidence": f"Visited {count} times at hour {current_hour}"
                    })
            
            # Based on location transitions
            if current_location in location_transitions:
                for loc, count in location_transitions[current_location].most_common(3):
                    total_transitions = sum(location_transitions[current_location].values())
                    prob = count / total_transitions
                    predictions.append({
                        "location": loc,
                        "probability": prob,
                        "method": "transition_pattern",
                        "evidence": f"{count}/{total_transitions} times moved from {current_location} to {loc}"
                    })
            
            # Based on overall frequency
            for loc, count in location_frequency.most_common(5):
                prob = count / len(activities)
                predictions.append({
                    "location": loc,
                    "probability": prob * 0.5,  # Lower weight for general frequency
                    "method": "frequency",
                    "evidence": f"Most frequent location ({count}/{len(activities)} visits)"
                })
            
            # Aggregate predictions for same location
            location_scores = defaultdict(lambda: {"probability": 0, "evidence": [], "methods": []})
            for pred in predictions:
                loc = pred["location"]
                location_scores[loc]["probability"] += pred["probability"]
                location_scores[loc]["evidence"].append(pred["evidence"])
                location_scores[loc]["methods"].append(pred["method"])
            
            # Normalize and sort
            final_predictions = []
            for loc, data in location_scores.items():
                final_predictions.append({
                    "location": loc,
                    "probability": min(data["probability"], 1.0),
                    "confidence": "high" if data["probability"] > 0.7 else "medium" if data["probability"] > 0.4 else "low",
                    "evidence": data["evidence"],
                    "methods_used": list(set(data["methods"]))
                })
            
            final_predictions.sort(key=lambda x: x["probability"], reverse=True)
            
            return {
                "entity_id": entity_id,
                "current_location": current_location,
                "predicted_next_locations": final_predictions[:5],
                "prediction_time": now.isoformat(),
                "data_points_analyzed": len(activities),
                "explainability": {
                    "model_type": "pattern_based_ml",
                    "features_used": ["time_patterns", "location_transitions", "frequency_analysis"],
                    "confidence_method": "probability_aggregation"
                }
            }
            
        except Exception as e:
            print(f"Error predicting next location: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def detect_anomalies(entity_id: str) -> Dict[str, Any]:
        """
        Detect anomalous behavior patterns with explanations
        """
        try:
            timeline = DatabaseService.get_entity_timeline(entity_id)
            if not timeline or not timeline.get("activities"):
                return {"error": "Insufficient data for anomaly detection"}
            
            activities = timeline["activities"]
            anomalies = []
            
            # Build baseline patterns
            hour_activity = defaultdict(int)
            location_frequency = Counter()
            detection_type_frequency = Counter()
            
            for activity in activities:
                timestamp = datetime.fromisoformat(activity["timestamp"].replace('Z', '+00:00'))
                hour = timestamp.hour
                hour_activity[hour] += 1
                location_frequency[activity["location"]] += 1
                detection_type_frequency[activity["detection_type"]] += 1
            
            # Calculate statistics
            avg_hourly_activity = statistics.mean(hour_activity.values()) if hour_activity else 0
            std_hourly_activity = statistics.stdev(hour_activity.values()) if len(hour_activity) > 1 else 0
            
            # Detect unusual time patterns
            for hour, count in hour_activity.items():
                if std_hourly_activity > 0:
                    z_score = (count - avg_hourly_activity) / std_hourly_activity
                    if abs(z_score) > 2:  # More than 2 standard deviations
                        anomalies.append({
                            "type": "unusual_time_pattern",
                            "severity": "medium" if abs(z_score) < 3 else "high",
                            "description": f"Unusual activity at hour {hour}:00",
                            "evidence": f"Activity count: {count}, Expected: {avg_hourly_activity:.1f} ± {std_hourly_activity:.1f}",
                            "z_score": z_score,
                            "explanation": f"This activity level is {abs(z_score):.1f} standard deviations from normal"
                        })
            
            # Detect rare locations
            total_activities = len(activities)
            for location, count in location_frequency.items():
                frequency = count / total_activities
                if frequency < 0.05 and count > 1:  # Less than 5% but more than once
                    anomalies.append({
                        "type": "rare_location",
                        "severity": "low",
                        "description": f"Infrequent visits to {location}",
                        "evidence": f"Only {count}/{total_activities} visits ({frequency:.1%})",
                        "explanation": "This location is rarely visited compared to usual patterns"
                    })
            
            # Detect missing expected patterns (gap detection)
            if len(activities) > 1:
                timestamps = [datetime.fromisoformat(a["timestamp"].replace('Z', '+00:00')) for a in activities]
                timestamps.sort()
                
                gaps = []
                for i in range(len(timestamps) - 1):
                    gap = (timestamps[i] - timestamps[i + 1]).total_seconds() / 3600  # hours
                    gaps.append(abs(gap))
                
                if gaps:
                    avg_gap = statistics.mean(gaps)
                    for i, gap in enumerate(gaps):
                        if gap > avg_gap * 3:  # More than 3x average gap
                            anomalies.append({
                                "type": "unusual_gap",
                                "severity": "medium",
                                "description": f"Unusually long gap in activity",
                                "evidence": f"Gap of {gap:.1f} hours, expected ~{avg_gap:.1f} hours",
                                "explanation": "Extended period without any recorded activity"
                            })
            
            return {
                "entity_id": entity_id,
                "anomalies_detected": len(anomalies),
                "anomalies": anomalies,
                "analysis_period": {
                    "start": activities[-1]["timestamp"] if activities else None,
                    "end": activities[0]["timestamp"] if activities else None,
                    "total_activities": len(activities)
                },
                "baseline_stats": {
                    "avg_hourly_activity": avg_hourly_activity,
                    "most_common_locations": [loc for loc, _ in location_frequency.most_common(3)],
                    "most_common_detection_types": [dt for dt, _ in detection_type_frequency.most_common(3)]
                }
            }
            
        except Exception as e:
            print(f"Error detecting anomalies: {e}")
            return {"error": str(e)}
    
    @staticmethod
    def infer_missing_data(entity_id: str) -> Dict[str, Any]:
        """
        Infer missing data points based on available information and patterns
        """
        try:
            profile = DatabaseService.get_profile_by_entity_id(entity_id)
            timeline = DatabaseService.get_entity_timeline(entity_id)
            
            if not profile:
                return {"error": "Entity not found"}
            
            inferences = []
            
            # Infer department from email domain if missing
            if not profile.get("department") and profile.get("email"):
                email = profile.get("email", "")
                if "eng" in email.lower():
                    inferences.append({
                        "field": "department",
                        "inferred_value": "Engineering",
                        "confidence": 0.7,
                        "method": "email_pattern_matching",
                        "evidence": f"Email domain contains 'eng': {email}"
                    })
                elif "sci" in email.lower():
                    inferences.append({
                        "field": "department",
                        "inferred_value": "Science",
                        "confidence": 0.7,
                        "method": "email_pattern_matching",
                        "evidence": f"Email domain contains 'sci': {email}"
                    })
            
            # Infer typical schedule from timeline
            if timeline and timeline.get("activities"):
                activities = timeline["activities"]
                hour_counts = defaultdict(int)
                
                for activity in activities:
                    timestamp = datetime.fromisoformat(activity["timestamp"].replace('Z', '+00:00'))
                    hour = timestamp.hour
                    hour_counts[hour] += 1
                
                peak_hours = sorted(hour_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                if peak_hours:
                    inferences.append({
                        "field": "typical_active_hours",
                        "inferred_value": [f"{h:02d}:00-{(h+1)%24:02d}:00" for h, _ in peak_hours],
                        "confidence": 0.85,
                        "method": "activity_pattern_analysis",
                        "evidence": f"Peak activity hours based on {len(activities)} data points"
                    })
                
                # Infer primary locations
                location_counts = Counter([a["location"] for a in activities])
                primary_locations = location_counts.most_common(2)
                if primary_locations:
                    inferences.append({
                        "field": "primary_locations",
                        "inferred_value": [loc for loc, _ in primary_locations],
                        "confidence": 0.9,
                        "method": "location_frequency_analysis",
                        "evidence": f"Based on {sum(count for _, count in primary_locations)} visits"
                    })
            
            # Infer role from activity patterns
            if timeline and timeline.get("activities"):
                detection_types = Counter([a["detection_type"] for a in timeline["activities"]])
                
                if detection_types.get("lab_bookings", 0) > len(timeline["activities"]) * 0.3:
                    inferences.append({
                        "field": "likely_role_activity",
                        "inferred_value": "Research/Lab-based",
                        "confidence": 0.75,
                        "method": "activity_type_analysis",
                        "evidence": f"{detection_types['lab_bookings']} lab bookings out of {len(timeline['activities'])} activities"
                    })
            
            return {
                "entity_id": entity_id,
                "inferences_count": len(inferences),
                "inferences": inferences,
                "model_info": {
                    "type": "rule_based_ml_hybrid",
                    "confidence_threshold": 0.6,
                    "explanation_method": "evidence_based_reasoning"
                }
            }
            
        except Exception as e:
            print(f"Error inferring missing data: {e}")
            return {"error": str(e)}
