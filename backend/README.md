# Campus Entity Resolution & Security API Backend

FastAPI backend for the Campus Entity Resolution and Security Monitoring System.

## 🏗️ Architecture

```
backend/
├── main.py           # FastAPI application with all endpoints
├── models.py         # Pydantic models for data validation
├── database.py       # Supabase database service layer
├── requirements.txt  # Python dependencies
└── creds.env        # Environment variables (not in git)
```

## 📋 Prerequisites

- Python 3.9+
- Supabase account with database set up
- pip or poetry for package management

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `creds.env` file in the backend directory:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project settings:
- Go to Settings → API
- Copy the Project URL and anon/public key

### 3. Run the Server

```bash
python main.py
```

The API will be available at `http://localhost:8000`

### 4. View API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## 📊 Database Schema

The backend expects the following Supabase tables:

### `profiles`
- `entity_id` (text, primary key)
- `name` (text)
- `role` (text)
- `email` (text)
- `department` (text)
- `student_id` (text, nullable)
- `staff_id` (text, nullable)
- `card_id` (text, nullable)
- `device_hash` (text, nullable)
- `face_id` (text, nullable)
- `metadata_json` (jsonb, nullable)

### `swipes`
- `identity` (text, primary key)
- `card_id` (text)
- `location_id` (text)
- `timestamp` (timestamptz)
- `raw_record_json` (jsonb, nullable)

### `wifi_logs`
- `identity` (text, primary key)
- `device_hash` (text)
- `ap_id` (text)
- `timestamp` (timestamptz)
- `raw_record_json` (jsonb, nullable)

### `lab_bookings`
- `identity` (text, primary key)
- `booking_id` (text)
- `entity_id` (text)
- `lab_id` (text)
- `start_time` (timestamptz)
- `end_time` (timestamptz)
- `attended_flag` (boolean)
- `metadata` (jsonb, nullable)

### `library_checkouts`
- `identity` (text, primary key)
- `checkout_id` (text)
- `entity_id` (text)
- `book_id` (text)
- `timestamp` (timestamptz)

### `notes`
- `identity` (text, primary key)
- `entity_id` (text)
- `source` (text)
- `text` (text)
- `timestamp` (timestamptz)

### `cctv_frame`
- `identity` (text, primary key)
- `frame_id` (text)
- `location_id` (text)
- `timestamp` (timestamptz)
- `face_id` (text, nullable)

### `face_embedding`
- `identity` (text, primary key)
- `face_id` (text)
- `embedding` (text)

## 🔌 API Endpoints

### Health & Status
- `GET /` - API information
- `GET /health` - Health check

### Profiles
- `GET /api/profiles` - Get all profiles (with pagination)
- `GET /api/profiles/{entity_id}` - Get specific profile
- `GET /api/profiles/search/{query}` - Search profiles

### Activity Data
- `GET /api/swipes` - Get swipe records
- `GET /api/wifi_logs` - Get WiFi logs
- `GET /api/lab_bookings` - Get lab bookings
- `GET /api/library_checkouts` - Get library checkouts
- `GET /api/notes` - Get notes
- `GET /api/cctv_frame` - Get CCTV frames

### Entity Resolution
- `GET /api/resolve` - Resolve entity across data sources
- `GET /api/entity/{entity_id}/timeline` - Get entity activity timeline

### Dashboard & Analytics
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/security/stats` - Get security statistics
- `GET /api/analytics/activity-heatmap` - Get activity heatmap

### Alerts
- `GET /api/alerts` - Get security alerts

## 🔧 Development

### Running in Development Mode

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Testing Endpoints

You can test endpoints using:
- Swagger UI at `/docs`
- cURL commands
- Postman
- HTTPie

Example cURL:
```bash
curl http://localhost:8000/api/profiles
```

## 🌐 CORS Configuration

The API is configured to allow all origins (`*`) for development. For production, update the CORS settings in `main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-frontend-domain.com"],  # Update this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 🔐 Security Considerations

1. **Environment Variables**: Never commit `creds.env` to version control
2. **API Keys**: Use Supabase Row Level Security (RLS) policies
3. **CORS**: Restrict origins in production
4. **Rate Limiting**: Consider adding rate limiting for production
5. **Authentication**: Implement JWT authentication for sensitive endpoints

## 📦 Deployment

### Using Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Using Railway/Render/Heroku

1. Add a `Procfile`:
```
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

2. Set environment variables in the platform dashboard

## 🐛 Troubleshooting

### "Missing SUPABASE_URL or SUPABASE_KEY"
- Ensure `creds.env` exists in the backend directory
- Check that the file contains valid Supabase credentials

### CORS Errors
- Verify the frontend URL is allowed in CORS settings
- Check that the API is running on the expected port

### Database Connection Issues
- Verify Supabase credentials are correct
- Check that your IP is allowed in Supabase settings
- Ensure tables exist in your Supabase database

## 📝 License

MIT License - See LICENSE file for details
