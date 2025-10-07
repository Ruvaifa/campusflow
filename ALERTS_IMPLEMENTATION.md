# Alerts Page Implementation - Live Data Integration

## Overview
Enhanced the Alerts system to use **live data** from the `public.alerts` table in Supabase, replacing the previous mock data implementation.

## Changes Made

### 1. Backend Updates

#### `backend/database.py`
Added three new methods to the `DatabaseService` class:

- **`get_alerts(status, limit)`** - Fetches alerts from the database with optional status filtering
- **`get_alert_by_entity_id(entity_id)`** - Retrieves a specific alert for an entity
- **`update_alert_status(entity_id, status)`** - Updates the status of an alert

```python
@staticmethod
def get_alerts(status: Optional[str] = None, limit: int = 100):
    """Get alerts from the public.alerts table"""
    query = supabase.table("alerts").select("*")
    if status:
        query = query.eq("status", status)
    response = query.limit(limit).execute()
    return response.data
```

#### `backend/main.py`
Updated the alerts API endpoints:

- **`GET /api/alerts`** - Now fetches real data from the database and enriches alerts with profile information
  - Parameters: `status` (optional), `limit` (optional)
  - Returns: Array of enriched alert objects with entity profiles
  
- **`PUT /api/alerts/{entity_id}`** - New endpoint to update alert status
  - Parameters: `entity_id` (path), `status` (query)
  - Returns: Updated alert object

```python
@app.get("/api/alerts")
async def get_alerts(
    status: Optional[str] = Query(None, regex="^(active|resolved|investigating)$"),
    limit: int = Query(100, ge=1, le=500)
):
    """Get security alerts from the database"""
    alerts = db.get_alerts(status=status, limit=limit)
    # Enriches with profile information
    ...
```

### 2. Frontend Updates

#### `src/lib/api.ts`
Updated the alerts API client:

- Removed `severity` parameter (not in database schema)
- Added `limit` parameter
- Added `updateStatus` method for updating alert status

```typescript
export const alertsAPI = {
  getAll: async (status?: Alert['status'], limit?: number): Promise<Alert[]> => {...},
  updateStatus: async (entityId: string, status: Alert['status']): Promise<Alert> => {...},
};
```

#### `src/hooks/useAPI.ts`
Updated React Query hooks:

- **`useAlerts(status, limit)`** - Updated to match new API signature
- **`useUpdateAlertStatus()`** - New mutation hook for updating alert status with automatic cache invalidation

```typescript
export function useAlerts(status?: Alert['status'], limit?: number) {
  return useQuery({
    queryKey: ['alerts', status, limit],
    queryFn: () => api.alerts.getAll(status, limit),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  });
}
```

#### `src/pages/Alerts.tsx` (NEW)
Created a comprehensive Alerts management page with:

**Features:**
- **Statistics Cards**: Total Alerts, Active Alerts, Investigating, Resolved
- **Tabbed Interface**: Filter by All, Active, Investigating, Resolved
- **Real-time Data**: Auto-refreshes every 30 seconds
- **Alert Cards**: Display entity information with profile enrichment
- **Action Buttons**: 
  - Active alerts: "Investigate" or "Resolve"
  - Investigating alerts: "Escalate" or "Resolve"
  - Resolved alerts: "Reopen"
- **Status Badges**: Color-coded (Red=Active, Amber=Investigating, Green=Resolved)
- **Entity Details**: Shows name, email, department, role from profile
- **Timestamp Display**: Relative time (e.g., "2h ago", "3d ago")
- **Dark/Light Mode**: Full theme support
- **Loading States**: Spinner while fetching data
- **Empty States**: Friendly messages when no alerts exist

**Design:**
- Matches Dashboard design pattern exactly
- PRD-compliant color schema (destructive=red, warning=amber, success=green)
- Responsive layout
- Border-left color coding for quick status identification
- Hover effects and transitions

#### `src/App.tsx`
Added Alerts route:
```typescript
<Route path="alerts" element={<Alerts />} />
```

#### `src/components/layout/DashboardLayout.tsx`
Added Alerts navigation item to sidebar:
```typescript
{ icon: Bell, label: 'Alerts', path: '/dashboard/alerts' }
```

#### `src/pages/Dashboard.tsx`
Added "View All" button to Security Alerts card that navigates to `/dashboard/alerts`

## Database Schema Reference

The `public.alerts` table structure:
```sql
CREATE TABLE public.alerts (
  entity_id text NOT NULL,
  status text,
  CONSTRAINT alerts_pkey PRIMARY KEY (entity_id)
);
```

**Note**: The alerts are enriched with profile data from the `public.profiles` table using the `entity_id` foreign key relationship.

## API Endpoints

### Get Alerts
```
GET /api/alerts?status={status}&limit={limit}
```
**Query Parameters:**
- `status` (optional): `active`, `resolved`, or `investigating`
- `limit` (optional): Number of alerts to return (default: 100, max: 500)

**Response:**
```json
[
  {
    "entity_id": "E001",
    "status": "active",
    "timestamp": "2025-10-07T15:30:00Z",
    "profile": {
      "entity_id": "E001",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Computer Science",
      "role": "Student"
    }
  }
]
```

### Update Alert Status
```
PUT /api/alerts/{entity_id}?status={status}
```
**Path Parameters:**
- `entity_id`: The entity ID of the alert

**Query Parameters:**
- `status`: New status (`active`, `resolved`, or `investigating`)

## Usage

### Accessing the Alerts Page
1. Navigate to `/dashboard/alerts` in the application
2. Or click "Alerts" in the sidebar navigation
3. Or click "View All" on the Dashboard's Security Alerts card

### Managing Alerts
1. **View alerts** by status using the tabs (All, Active, Investigating, Resolved)
2. **Take action** on alerts using the action buttons:
   - Click "Investigate" to mark an alert as under investigation
   - Click "Resolve" to mark an alert as resolved
   - Click "Escalate" to re-activate an investigating alert
   - Click "Reopen" to re-activate a resolved alert
3. **Monitor statistics** in the top cards showing counts by status
4. **Auto-refresh** - Data automatically refreshes every 30 seconds

## Testing

To test with live data:
1. Ensure backend is running (`python backend/main.py`)
2. Ensure Supabase credentials are configured in `backend/creds.env`
3. Add test data to the `public.alerts` table:
```sql
INSERT INTO public.alerts (entity_id, status) VALUES
('E001', 'active'),
('E002', 'investigating'),
('E003', 'resolved');
```
4. Navigate to `/dashboard/alerts` in the application
5. Verify alerts appear with enriched profile data
6. Test status updates using the action buttons

## Benefits

✅ **Real-time monitoring** - Auto-refresh every 30 seconds  
✅ **Live data** - Directly from Supabase database  
✅ **Profile enrichment** - Shows full entity details  
✅ **Status management** - Update alerts with one click  
✅ **Filtering** - Quickly filter by status  
✅ **Statistics** - Overview of alert counts  
✅ **Responsive** - Works on all screen sizes  
✅ **Theme support** - Full dark/light mode  
✅ **Production-ready** - Error handling, loading states, empty states  

## Future Enhancements

Potential improvements for the alerts system:
- Add severity levels (critical, high, medium, low)
- Add alert types/categories
- Add timestamp tracking (created_at, updated_at, resolved_at)
- Add alert descriptions and details
- Add location information
- Add alert history/audit log
- Add bulk actions (resolve multiple alerts)
- Add alert notifications (email, push)
- Add alert filtering by date range
- Add alert search functionality
- Add alert export (CSV, PDF)
- Add alert analytics and trends
