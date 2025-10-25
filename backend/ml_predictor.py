"""
SpaceFlow ML Model Loader
Loads trained models and provides inference API
"""

import os
import pickle
import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("⚠️ PyTorch not available. Using fallback models only.")

try:
    import xgboost as xgb
    XGB_AVAILABLE = True
except ImportError:
    XGB_AVAILABLE = False
    print("⚠️ XGBoost not available.")

try:
    import lightgbm as lgb
    LGB_AVAILABLE = True
except ImportError:
    LGB_AVAILABLE = False
    print("⚠️ LightGBM not available.")


class OccupancyForecastNet(nn.Module):
    """PyTorch Neural Network for occupancy forecasting"""
    
    def __init__(self, input_dim, hidden_dims=[256, 128, 64], dropout=0.3):
        super(OccupancyForecastNet, self).__init__()
        
        layers = []
        prev_dim = input_dim
        
        for hidden_dim in hidden_dims:
            layers.extend([
                nn.Linear(prev_dim, hidden_dim),
                nn.BatchNorm1d(hidden_dim),
                nn.ReLU(),
                nn.Dropout(dropout)
            ])
            prev_dim = hidden_dim
        
        self.encoder = nn.Sequential(*layers)
        self.mean_head = nn.Linear(hidden_dims[-1], 1)
        self.std_head = nn.Linear(hidden_dims[-1], 1)
        
    def forward(self, x):
        features = self.encoder(x)
        mean = self.mean_head(features)
        std = F.softplus(self.std_head(features))
        return mean, std


class SpaceFlowPredictor:
    """Main predictor class for SpaceFlow forecasting"""
    
    def __init__(self, model_dir='backend/models'):
        self.model_dir = model_dir
        self.device = torch.device('cuda' if torch.cuda.is_available() and TORCH_AVAILABLE else 'cpu')
        
        # Load models and artifacts
        self.nn_model = None
        self.xgb_model = None
        self.lgb_model = None
        self.scaler = None
        self.encoders = None
        self.feature_cols = None
        
        self._load_models()
    
    def _load_models(self):
        """Load all trained models and preprocessing artifacts"""
        
        print(f"📥 Loading models from {self.model_dir}...")
        
        # Load artifacts (scaler, encoders, feature columns)
        artifacts_path = os.path.join(self.model_dir, 'spaceflow_artifacts.pkl')
        if os.path.exists(artifacts_path):
            with open(artifacts_path, 'rb') as f:
                artifacts = pickle.load(f)
                self.scaler = artifacts.get('scaler')
                self.encoders = artifacts.get('encoders')
                self.feature_cols = artifacts.get('feature_cols')
            print("   ✅ Artifacts loaded")
        else:
            print("   ⚠️ Artifacts not found. Using fallback preprocessing.")
        
        # Load Neural Network
        if TORCH_AVAILABLE:
            nn_path = os.path.join(self.model_dir, 'spaceflow_nn_model.pt')
            if os.path.exists(nn_path):
                checkpoint = torch.load(nn_path, map_location=self.device)
                input_dim = checkpoint.get('input_dim', 14)
                self.nn_model = OccupancyForecastNet(input_dim).to(self.device)
                self.nn_model.load_state_dict(checkpoint['model_state_dict'])
                self.nn_model.eval()
                print("   ✅ Neural Network loaded")
        
        # Load XGBoost
        if XGB_AVAILABLE:
            xgb_path = os.path.join(self.model_dir, 'spaceflow_xgboost.json')
            if os.path.exists(xgb_path):
                self.xgb_model = xgb.XGBRegressor()
                self.xgb_model.load_model(xgb_path)
                print("   ✅ XGBoost loaded")
        
        # Load LightGBM
        if LGB_AVAILABLE:
            lgb_path = os.path.join(self.model_dir, 'spaceflow_lightgbm.txt')
            if os.path.exists(lgb_path):
                self.lgb_model = lgb.Booster(model_file=lgb_path)
                print("   ✅ LightGBM loaded")
        
        print(f"✅ Model loading complete! Using device: {self.device}")
    
    def preprocess_input(self, features: Dict) -> np.ndarray:
        """Preprocess input features for prediction"""
        
        # Extract and encode features
        feature_vector = []
        
        # Temporal features
        timestamp = features.get('timestamp', datetime.now())
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
        
        hour = timestamp.hour
        day_of_week = timestamp.weekday()
        day_of_month = timestamp.day
        month = timestamp.month
        is_weekend = 1 if day_of_week >= 5 else 0
        is_peak_hour = 1 if 8 <= hour <= 17 else 0
        
        # Get time of day
        if 6 <= hour < 12:
            time_of_day = 'morning'
        elif 12 <= hour < 17:
            time_of_day = 'afternoon'
        elif 17 <= hour < 21:
            time_of_day = 'evening'
        else:
            time_of_day = 'night'
        
        # Entity and location features
        location = features.get('location', 'unknown')
        entity_id = features.get('entity_id', 'unknown')
        source = features.get('source', 'timeline')
        
        # Get encoded values
        if self.encoders:
            location_encoded = self._safe_encode(self.encoders['location'], location)
            time_of_day_encoded = self._safe_encode(self.encoders['time_of_day'], time_of_day)
            source_encoded = self._safe_encode(self.encoders['source'], source)
            entity_encoded = self._safe_encode(self.encoders['entity'], entity_id)
        else:
            # Fallback to hash-based encoding
            location_encoded = hash(location) % 100
            time_of_day_encoded = hash(time_of_day) % 4
            source_encoded = hash(source) % 3
            entity_encoded = hash(entity_id) % 1000
        
        # Behavioral features (use defaults if not provided)
        visit_count = features.get('visit_count', 10)
        unique_locations = features.get('unique_locations', 5)
        location_hour_count = features.get('location_hour_count', 15)
        current_occupancy = features.get('current_occupancy', 20)
        
        # Build feature vector in correct order
        feature_vector = [
            hour, day_of_week, day_of_month, month,
            is_weekend, is_peak_hour,
            visit_count, unique_locations,
            location_hour_count, current_occupancy,
            location_encoded, time_of_day_encoded,
            source_encoded, entity_encoded
        ]
        
        # Convert to numpy array
        X = np.array(feature_vector).reshape(1, -1)
        
        # Scale features
        if self.scaler:
            X = self.scaler.transform(X)
        
        return X
    
    def _safe_encode(self, encoder, value):
        """Safely encode value, return default if unseen"""
        try:
            return encoder.transform([value])[0]
        except:
            # Return a default value for unseen categories
            return 0
    
    def predict(self, features: Dict, return_uncertainty: bool = True) -> Dict:
        """
        Make ensemble prediction with uncertainty quantification
        
        Args:
            features: Dictionary with keys:
                - location: str
                - timestamp: datetime or str
                - entity_id: str (optional)
                - current_occupancy: int (optional)
                - visit_count: int (optional)
            return_uncertainty: Whether to return uncertainty estimates
        
        Returns:
            Dictionary with prediction, confidence, and optional uncertainty
        """
        
        # Preprocess input
        X = self.preprocess_input(features)
        
        predictions = {}
        weights = []
        
        # Neural Network prediction
        if self.nn_model and TORCH_AVAILABLE:
            self.nn_model.eval()
            with torch.no_grad():
                X_tensor = torch.FloatTensor(X).to(self.device)
                mean, std = self.nn_model(X_tensor)
                nn_pred = mean.cpu().numpy().flatten()[0]
                nn_std = std.cpu().numpy().flatten()[0]
                predictions['neural_net'] = nn_pred
                if return_uncertainty:
                    predictions['uncertainty'] = nn_std
                weights.append(0.4)
        
        # XGBoost prediction
        if self.xgb_model and XGB_AVAILABLE:
            xgb_pred = self.xgb_model.predict(X)[0]
            predictions['xgboost'] = xgb_pred
            weights.append(0.3)
        
        # LightGBM prediction
        if self.lgb_model and LGB_AVAILABLE:
            lgb_pred = self.lgb_model.predict(X)[0]
            predictions['lightgbm'] = lgb_pred
            weights.append(0.3)
        
        # Ensemble prediction (weighted average)
        if predictions:
            model_preds = [predictions.get('neural_net', 0), 
                          predictions.get('xgboost', 0), 
                          predictions.get('lightgbm', 0)]
            
            # Normalize weights
            if sum(weights) > 0:
                weights = [w / sum(weights) for w in weights]
            else:
                weights = [1/3, 1/3, 1/3]
            
            ensemble_pred = sum(p * w for p, w in zip(model_preds, weights) if p > 0)
            
            # Calculate confidence (inverse of uncertainty)
            confidence = 0.85  # Default high confidence
            if return_uncertainty and 'uncertainty' in predictions:
                # Normalize uncertainty to confidence score (0-1)
                uncertainty = predictions['uncertainty']
                confidence = max(0.5, min(0.99, 1.0 / (1.0 + uncertainty / 10)))
            
            return {
                'forecast_count': max(0, int(round(ensemble_pred))),
                'confidence': round(confidence, 3),
                'individual_predictions': predictions,
                'model_version': 'SpaceFlow-v1.0-Ensemble',
                'timestamp': datetime.now().isoformat()
            }
        else:
            # Fallback to simple heuristic
            current_occ = features.get('current_occupancy', 20)
            return {
                'forecast_count': current_occ,
                'confidence': 0.60,
                'individual_predictions': {'fallback': current_occ},
                'model_version': 'Fallback-Heuristic',
                'timestamp': datetime.now().isoformat()
            }
    
    def batch_predict(self, features_list: List[Dict]) -> List[Dict]:
        """Make predictions for multiple inputs"""
        return [self.predict(features) for features in features_list]


# Global predictor instance (lazy loaded)
_predictor_instance = None

def get_predictor() -> SpaceFlowPredictor:
    """Get or create global predictor instance"""
    global _predictor_instance
    if _predictor_instance is None:
        _predictor_instance = SpaceFlowPredictor()
    return _predictor_instance


# Example usage
if __name__ == "__main__":
    predictor = SpaceFlowPredictor()
    
    # Test prediction
    test_features = {
        'location': 'cse',
        'timestamp': datetime.now(),
        'entity_id': 'E123456',
        'current_occupancy': 85,
        'visit_count': 150,
        'unique_locations': 8
    }
    
    result = predictor.predict(test_features)
    print("\n🎯 Prediction Result:")
    print(f"   Forecast: {result['forecast_count']} people")
    print(f"   Confidence: {result['confidence']:.1%}")
    print(f"   Model: {result['model_version']}")
