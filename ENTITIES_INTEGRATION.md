# Entities Page - Live Data Integration

## Overview
The Entities page has been fully integrated with live data from the Supabase database. It now supports real-time entity monitoring, search functionality, and comprehensive activity timelines.

## Features Implemented

### 1. **Live Entity List**
- Fetches entities from the database with enriched activity data
- Shows entity status (active/recent/inactive) based on last activity
- Displays confidence scores based on data completeness
- Auto-refreshes every 30 seconds for live updates

### 2. **Search Functionality**
- Real-time search across name, email, and department fields
- Debounced search (300ms delay) to reduce API calls
- Search query is sent to backend for efficient filtering

### 3. **Status Filtering**
- Filter entities by status: All, Active, Inactive
- Active: Last seen within 1 hour
- Recent: Last seen within 24 hours
- Inactive: Last seen more than 24 hours ago

### 4. **Entity Details View**
- **General Details**: Email, Entity ID, Department, Role
- **Activity Summary (7 days)**:
  - Card swipes count
  - WiFi connections count
  - Lab bookings count
  - Library checkouts count
- **Current Location**: Last known location and timestamp
- **Activity Timeline**: Chronological list of recent activities with:
  - Activity type icons (swipe, wifi, booking, checkout)
  - Detailed descriptions
  - Location information
  - Relative timestamps (e.g., "5 minutes ago")

### 5. **Real-time Updates**
- Entity list refreshes every 30 seconds
- Entity details refresh every 15 seconds
- Automatic loading states and error handling

## Backend Endpoints

### New Endpoints Added

#### `GET /api/entities`
Get enriched entity list with activity data.

**Query Parameters:**
- `limit` (default: 100): Number of entities to return
- `offset` (default: 0): Pagination offset
- `status`: Filter by status (active/recent/inactive/all)
- `search`: Search query for name/email/department

**Response:**
```json
{
  "entities": [
    {
      "entity_id": "string",
      "name": "string",
      "role": "string",
      "email": "string",
      "department": "string",
      "last_seen": "2025-10-05T15:30:00Z",
      "last_location": "Building A - Lab 2",
      "status": "active",
      "confidence": 0.95
    }
  ],
  "total": 100,
  "limit": 100,
  "offset": 0
}
```

#### `GET /api/entities/{entity_id}`
Get detailed entity information with activity summary.

**Response:**
```json
{
  "profile": {
    "entity_id": "string",
    "name": "string",
    "role": "string",
    "email": "string",
    "department": "string"
  },
  "status": "active",
  "activity_summary": {
    "swipes": 45,
    "wifi_connections": 120,
    "lab_bookings": 8,
    "library_checkouts": 3,
    "total_activities": 176
  },
  "recent_activities": [
    {
      "timestamp": "2025-10-05T15:30:00Z",
      "type": "swipe",
      "location": "Main Entrance",
      "details": "Card swipe at Main Entrance"
    }
  ],
  "last_seen": "2025-10-05T15:30:00Z",
  "last_location": "Main Entrance"
}
```

## Database Schema

### SQL Migration Script
Location: `backend/migrations/001_entity_relations.sql`

The migration script includes:
- Table definitions with proper indexes
- Foreign key constraints (optional, commented out)
- Views for entity activity summaries
- Functions for status calculation
- Triggers for automatic timestamp updates

**Key Tables:**
- `profiles`: Entity profile information
- `swipes`: Card swipe records
- `wifi_logs`: WiFi connection logs
- `lab_bookings`: Lab booking records
- `library_checkouts`: Library checkout records
- `notes`: Entity notes
- `cctv_frame`: CCTV frame detections
- `face_embedding`: Face recognition data

**Indexes Created:**
- Name, email, department search indexes
- Timestamp indexes for activity queries
- Foreign key indexes for joins
- Full-text search index on profiles

## Frontend Implementation

### API Service Layer
**File:** `src/lib/api.ts`

New interfaces:
- `Entity`: Enriched entity with activity data
- `EntityDetails`: Detailed entity information
- `EntitiesResponse`: Paginated entity list response

New API methods:
- `entityAPI.getAll()`: Get entity list with filters
- `entityAPI.getById()`: Get entity details

### React Query Hooks
**File:** `src/hooks/useAPI.ts`

New hooks:
- `useEntities()`: Fetch entity list with auto-refresh
- `useEntityDetails()`: Fetch entity details with auto-refresh

### Entities Page
**File:** `src/pages/Entities.tsx`

Features:
- Debounced search input
- Status filter tabs
- Loading and error states
- Entity list with status badges
- Detailed entity view with activity timeline
- Responsive design

## Setup Instructions

### 1. Run Database Migration
```bash
# In Supabase SQL Editor, run:
backend/migrations/001_entity_relations.sql
```

### 2. Install Frontend Dependencies
```bash
npm install date-fns
```

### 3. Start Backend Server
```bash
cd backend
python main.py
```

### 4. Start Frontend
```bash
npm run dev
```

## Usage

1. **Search Entities**: Type in the search box to filter by name, email, or department
2. **Filter by Status**: Click tabs to filter active/inactive entities
3. **View Details**: Click on any entity card to view detailed information
4. **Monitor Activity**: Activity timeline updates automatically every 15 seconds

## Status Calculation

Entity status is determined by last activity timestamp:
- **Active**: Last activity within 1 hour
- **Recent**: Last activity within 24 hours
- **Inactive**: Last activity more than 24 hours ago

## Confidence Score

Confidence score is calculated based on data completeness:
- Base score: 0.5
- +0.15 if card_id exists
- +0.15 if device_hash exists
- +0.20 if face_id exists
- Maximum: 1.0

## Performance Optimizations

1. **Debounced Search**: Reduces API calls during typing
2. **Indexed Queries**: Database indexes for fast lookups
3. **Pagination**: Limits data transfer
4. **Caching**: React Query caches responses
5. **Selective Fetching**: Only fetch details when entity is selected

## Future Enhancements

- [ ] Export entity data to CSV
- [ ] Bulk actions on entities
- [ ] Advanced filters (department, role, date range)
- [ ] Entity comparison view
- [ ] Activity heatmap visualization
- [ ] Real-time notifications for entity activities
- [ ] Entity groups and tags
