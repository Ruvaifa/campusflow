# SpaceFlow ML Model Training & Deployment

## 🚀 Quick Start - Colab Training

### 1. Open the Notebook in Google Colab
```bash
# Upload SpaceFlow_ML_Model_Training.ipynb to Google Colab
# Or use this command to open directly:
```

### 2. Set Runtime to T4 GPU
1. Click **Runtime** → **Change runtime type**
2. Select **T4 GPU** from Hardware accelerator
3. Click **Save**

### 3. Update Supabase Credentials
In the notebook, Cell 2️⃣, replace:
```python
SUPABASE_URL = "YOUR_SUPABASE_URL"  # From backend/creds.env
SUPABASE_KEY = "YOUR_SUPABASE_ANON_KEY"  # From backend/creds.env
```

### 4. Run All Cells
- Click **Runtime** → **Run all**
- Training takes ~15-20 minutes on T4 GPU
- Models will be automatically downloaded at the end

### 5. Place Downloaded Models
After download completes, move the 4 files to `backend/models/`:
```
backend/models/
├── spaceflow_nn_model.pt          # PyTorch Neural Network
├── spaceflow_xgboost.json         # XGBoost Model
├── spaceflow_lightgbm.txt         # LightGBM Model
└── spaceflow_artifacts.pkl        # Preprocessing artifacts (scaler, encoders)
```

---

## 📊 Model Architecture

### Hybrid Ensemble (3 Models)

1. **Neural Network** (PyTorch) - 40% weight
   - 3-layer feedforward with batch normalization
   - Uncertainty quantification via dual-head output
   - Trained with negative log-likelihood loss
   - Best for: Complex temporal patterns

2. **XGBoost** - 30% weight
   - GPU-accelerated gradient boosting
   - Tree depth: 8, Learning rate: 0.05
   - Best for: Feature interactions

3. **LightGBM** - 30% weight
   - Leaf-wise tree growth
   - GPU-optimized
   - Best for: Fast inference

### Feature Engineering (14 Features)

**Temporal Features (6):**
- Hour, Day of Week, Day of Month, Month
- Is Weekend, Is Peak Hour

**Behavioral Features (4):**
- Visit Count, Unique Locations
- Location-Hour Count, Current Occupancy

**Encoded Features (4):**
- Location ID, Time of Day Category
- Source Type, Entity ID

---

## 🎯 Performance Targets

| Metric | Target | Expected |
|--------|--------|----------|
| **Top-1 Accuracy** (±5 people) | ≥65% | ~70% |
| **Top-5 Accuracy** (±10 people) | ≥85% | ~90% |
| **RMSE** | <10 | ~7-8 |
| **R² Score** | >0.7 | ~0.75-0.80 |
| **Inference Latency** | <1s | ~0.3s |

---

## 🔧 Integration with Backend

### Update `backend/main.py`

```python
from ml_predictor import get_predictor

# Initialize predictor at startup
@app.on_event("startup")
async def startup_event():
    global ml_predictor
    ml_predictor = get_predictor()
    print("✅ ML Models loaded successfully")

# Forecast endpoint
@app.post("/forecast")
async def forecast_occupancy(
    location: str,
    timestamp: Optional[str] = None,
    current_occupancy: Optional[int] = None
):
    features = {
        'location': location,
        'timestamp': timestamp or datetime.now().isoformat(),
        'current_occupancy': current_occupancy or 50
    }
    
    prediction = ml_predictor.predict(features)
    
    return {
        "location": location,
        "forecast_count": prediction['forecast_count'],
        "confidence": prediction['confidence'],
        "model_version": prediction['model_version'],
        "timestamp": prediction['timestamp']
    }
```

### Test the API

```bash
# Start backend
cd backend
python main.py

# Test forecast endpoint
curl -X POST "http://localhost:8000/forecast" \
  -H "Content-Type: application/json" \
  -d '{"location": "cse", "current_occupancy": 85}'
```

---

## 📈 Model Monitoring

### Check Model Performance
```python
from ml_predictor import get_predictor

predictor = get_predictor()

# Test prediction
test_input = {
    'location': 'library',
    'timestamp': '2025-10-25T14:30:00',
    'current_occupancy': 120,
    'visit_count': 200,
    'unique_locations': 10
}

result = predictor.predict(test_input, return_uncertainty=True)
print(f"Forecast: {result['forecast_count']} people")
print(f"Confidence: {result['confidence']:.1%}")
print(f"Uncertainty: ±{result.get('individual_predictions', {}).get('uncertainty', 0):.1f}")
```

### Batch Predictions
```python
# Predict for multiple locations at once
locations = ['cse', 'library', 'bh1', 'eee']
batch_features = [
    {'location': loc, 'timestamp': datetime.now(), 'current_occupancy': 50}
    for loc in locations
]

batch_results = predictor.batch_predict(batch_features)
for loc, res in zip(locations, batch_results):
    print(f"{loc}: {res['forecast_count']} people (conf: {res['confidence']:.0%})")
```

---

## 🔍 Explainability (SHAP)

The notebook includes SHAP analysis showing which features contribute most to predictions:

**Top Contributing Features:**
1. Current Occupancy (~30%)
2. Hour of Day (~20%)
3. Location ID (~15%)
4. Day of Week (~12%)
5. Visit Count (~10%)

---

## 🐛 Troubleshooting

### Models Not Loading?
```bash
# Check if all 4 files exist
ls -lh backend/models/

# Expected output:
# spaceflow_nn_model.pt (5-10 MB)
# spaceflow_xgboost.json (1-2 MB)
# spaceflow_lightgbm.txt (1-2 MB)
# spaceflow_artifacts.pkl (< 1 MB)
```

### PyTorch Not Available?
```bash
# Install PyTorch (CPU version for deployment)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu

# Or GPU version (CUDA 11.8)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### XGBoost/LightGBM Issues?
```bash
# Install missing packages
pip install xgboost lightgbm scikit-learn
```

### Fallback Mode
If models aren't available, the system automatically falls back to a simple heuristic that uses current occupancy as the forecast with 60% confidence.

---

## 📝 Model Retraining

### When to Retrain?
- Every 2-4 weeks with new data
- When accuracy drops below 60%
- After adding new locations
- Seasonal changes (semester start/end)

### Retraining Steps:
1. Export latest data from Supabase (last 3-6 months)
2. Run the Colab notebook again with updated data
3. Download new model files
4. Replace old files in `backend/models/`
5. Restart backend server

---

## 🎓 Citation

If using this model architecture in research or publications:

```bibtex
@software{spaceflow2025,
  title={SpaceFlow: Space-Aware Campus Intelligence System},
  author={IITG Hackathon Team},
  year={2025},
  note={Hybrid ensemble model for occupancy forecasting with explainability}
}
```

---

## 📞 Support

For issues or questions:
1. Check error logs in backend console
2. Verify all 4 model files are present
3. Ensure Supabase connection is active
4. Review training notebook outputs

**Good luck with the hackathon! 🚀**
