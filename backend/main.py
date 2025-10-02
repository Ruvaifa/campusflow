import os
from fastapi import FastAPI
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client
import uvicorn

load_dotenv("creds.env")

app = FastAPI()

# Load Supabase credentials from environment variables
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

print("Loaded SUPABASE_URL:", SUPABASE_URL)
print("Loaded SUPABASE_KEY:", SUPABASE_KEY)

if not SUPABASE_URL or not SUPABASE_KEY:
	raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY in environment variables.")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

# GET endpoints for all tables
@app.get("/api/cctv_frame")
async def get_cctv_frame():
	res = supabase.table("cctv_frame").select("*").execute()
	return res.data

@app.get("/api/face_embedding")
async def get_face_embedding():
	res = supabase.table("face_embedding").select("*").execute()
	return res.data

@app.get("/api/lab_bookings")
async def get_lab_bookings():
	res = supabase.table("lab_bookings").select("*").execute()
	return res.data

@app.get("/api/library_checkouts")
async def get_library_checkouts():
	res = supabase.table("library_checkouts").select("*").execute()
	return res.data

@app.get("/api/notes")
async def get_notes():
	res = supabase.table("notes").select("*").execute()
	return res.data

@app.get("/api/profiles")
async def get_profiles():
	res = supabase.table("profiles").select("*").execute()
	return res.data

@app.get("/api/swipes")
async def get_swipes():
	res = supabase.table("swipes").select("*").execute()
	return res.data

@app.get("/api/wifi_logs")
async def get_wifi_logs():
	res = supabase.table("wifi_logs").select("*").execute()
	return res.data

if __name__ == "__main__":
	uvicorn.run(app, host="0.0.0.0", port=8000)
