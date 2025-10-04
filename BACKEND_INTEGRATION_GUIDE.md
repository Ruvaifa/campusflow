# Backend Integration Guide

This guide explains how to integrate the FastAPI backend with your React frontend for the Campus Entity Resolution & Security Monitoring System.

## 🎯 Overview

The backend is now structured with:
- **FastAPI** for the REST API
- **Supabase** for database operations
- **Pydantic** for data validation
- **React Query** integration for the frontend

## 📁 File Structure

```
campus-entity-resolver/
├── backend/
│   ├── main.py              # FastAPI app with all endpoints
│   ├── models.py            # Pydantic data models
│   ├── database.py          # Supabase service layer
│   ├── requirements.txt     # Python dependencies
│   ├── creds.env           # Environment variables (create this)
│   └── README.md           # Backend documentation
├── src/
│   ├── lib/
│   │   └── api.ts          # Frontend API service layer
│   ├── hooks/
│   │   └── useAPI.ts       # React Query hooks
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Security.tsx
│       ├── Alerts.tsx
│       └── ...
└── .env.example            # Example environment variables
```

## 🚀 Setup Instructions

### Step 1: Backend Setup

1. **Install Python dependencies:**
```bash
cd backend
pip install -r requirements.txt
```

2. **Create `creds.env` file:**
```bash
cd backend
touch creds.env
```

3. **Add your Supabase credentials to `creds.env`:**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key-here
```

4. **Start the backend server:**
```bash
python main.py
```

The API will run at `http://localhost:8000`

### Step 2: Frontend Setup

1. **Create `.env` file in the root directory:**
```bash
touch .env
```

2. **Add the API URL:**
```env
VITE_API_URL=http://localhost:8000
```

3. **The frontend is already configured to use the API service!**

## 🔌 Using the API in Your Components

### Method 1: Using React Query Hooks (Recommended)

The easiest way to fetch data is using the custom hooks in `src/hooks/useAPI.ts`:

```typescript
import { useDashboardStats, useProfiles, useAlerts } from '@/hooks/useAPI';

function Dashboard() {
  const { data: stats, isLoading, error } = useDashboardStats();
  const { data: profiles } = useProfiles(10);
  const { data: alerts } = useAlerts('active', 'critical');

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Total Entities: {stats?.total_entities}</h1>
      <h2>Active Today: {stats?.active_today}</h2>
    </div>
  );
}
```

### Method 2: Using the API Service Directly

For more control, use the API service from `src/lib/api.ts`:

```typescript
import { api } from '@/lib/api';

async function fetchData() {
  try {
    const profiles = await api.profiles.getAll(100, 0);
    const stats = await api.dashboard.getStats();
    console.log(profiles, stats);
  } catch (error) {
    console.error('API Error:', error);
  }
}
```

## 📊 Available Hooks

### Dashboard & Analytics
```typescript
useDashboardStats()           // Dashboard statistics
useSecurityStats()            // Security page statistics
useActivityHeatmap(days)      // Activity heatmap data
```

### Profiles
```typescript
useProfiles(limit, offset)              // All profiles
useProfile(entityId)                    // Single profile
useProfileSearch(query, field)          // Search profiles
```

### Activity Data
```typescript
useSwipes(limit, entityId)              // Swipe records
useWiFiLogs(limit, entityId)            // WiFi logs
useLabBookings(entityId, upcoming)      // Lab bookings
useLibraryCheckouts(entityId)           // Library checkouts
useNotes(entityId, source)              // Notes
useCCTVFrames(locationId, limit)        // CCTV frames
```

### Entity Resolution
```typescript
useEntityResolution({ card_id, device_hash, face_id })
useEntityTimeline(entityId, days)
```

### Alerts
```typescript
useAlerts(status, severity)             // Security alerts
```

## 🎨 Example: Updating the Security Page

Here's how to integrate real data into your Security page:

```typescript
import { useSecurityStats, useAlerts } from '@/hooks/useAPI';

export default function Security() {
  const { data: stats, isLoading: statsLoading } = useSecurityStats();
  const { data: alerts, isLoading: alertsLoading } = useAlerts('active');

  if (statsLoading || alertsLoading) {
    return <div>Loading security data...</div>;
  }

  return (
    <div className="p-6">
      <h1>Security Dashboard</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.active_threats}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Resolved Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.resolved_today}</div>
          </CardContent>
        </Card>
        
        {/* More cards... */}
      </div>

      {/* Active Alerts */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts?.map(alert => (
            <div key={alert.id} className="border-b py-2">
              <div className="font-semibold">{alert.alert_type}</div>
              <div className="text-sm text-gray-600">{alert.description}</div>
              <Badge variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                {alert.severity}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🎨 Example: Updating the Dashboard Page

```typescript
import { useDashboardStats, useProfiles } from '@/hooks/useAPI';

export default function Dashboard() {
  const { data: stats } = useDashboardStats();
  const { data: recentProfiles } = useProfiles(5, 0);

  return (
    <div className="p-6">
      <div className="grid grid-cols-4 gap-4">
        <StatsCard 
          title="Total Entities" 
          value={stats?.total_entities || 0}
          icon={<Users />}
        />
        <StatsCard 
          title="Active Today" 
          value={stats?.active_today || 0}
          icon={<Activity />}
        />
        <StatsCard 
          title="Total Activities" 
          value={stats?.total_activities || 0}
          icon={<TrendingUp />}
        />
        <StatsCard 
          title="Resolution Accuracy" 
          value={`${stats?.resolution_accuracy || 0}%`}
          icon={<Target />}
        />
      </div>

      {/* Recent Profiles */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Recent Profiles</CardTitle>
        </CardHeader>
        <CardContent>
          {recentProfiles?.map(profile => (
            <div key={profile.entity_id}>
              {profile.name} - {profile.department}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
```

## 🔄 Data Refresh & Caching

React Query automatically handles:
- **Caching**: Data is cached for the specified `staleTime`
- **Auto-refetch**: Data refetches when the window regains focus
- **Background updates**: Some queries auto-refresh (e.g., every 30 seconds for security stats)

You can manually refetch data:

```typescript
const { data, refetch } = useDashboardStats();

// Later...
refetch(); // Manually refresh the data
```

## 🎯 Entity Resolution Example

The core feature - resolving entities across multiple data sources:

```typescript
import { useEntityResolution, useEntityTimeline } from '@/hooks/useAPI';

function EntityResolver() {
  const [cardId, setCardId] = useState('');
  
  const { data: resolution } = useEntityResolution({ card_id: cardId });
  const { data: timeline } = useEntityTimeline(
    resolution?.entity_id || '', 
    7
  );

  return (
    <div>
      <input 
        value={cardId}
        onChange={(e) => setCardId(e.target.value)}
        placeholder="Enter card ID"
      />
      
      {resolution && (
        <div>
          <h2>Resolved Entity: {resolution.profile.name}</h2>
          <p>Confidence: {resolution.confidence * 100}%</p>
          <p>Matched Sources: {resolution.matched_sources.join(', ')}</p>
          
          <h3>Activity Timeline (Last 7 days)</h3>
          <p>Total Activities: {timeline?.total_activities}</p>
          <p>Swipes: {timeline?.swipes.length}</p>
          <p>WiFi Logs: {timeline?.wifi_logs.length}</p>
        </div>
      )}
    </div>
  );
}
```

## 🐛 Error Handling

All hooks return error states:

```typescript
const { data, isLoading, error, isError } = useDashboardStats();

if (isError) {
  return <div>Error: {error.message}</div>;
}
```

## 🔒 Security Best Practices

1. **Never commit `creds.env`** - It's in `.gitignore`
2. **Use environment variables** for API URLs
3. **Implement authentication** when deploying to production
4. **Enable Supabase RLS** (Row Level Security) policies
5. **Validate all user inputs** on the backend

## 📈 Next Steps

1. **Replace mock data** in your existing pages with real API calls
2. **Add authentication** using Supabase Auth
3. **Implement real-time updates** using Supabase Realtime
4. **Add error boundaries** for better error handling
5. **Create loading skeletons** for better UX

## 🎓 Learning Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase Documentation](https://supabase.com/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)

## 💡 Tips

1. **Start small**: Begin by integrating one page at a time
2. **Use the browser console**: Check for API errors in the Network tab
3. **Test endpoints**: Use the Swagger UI at `http://localhost:8000/docs`
4. **Check data types**: Ensure your backend data matches frontend expectations
5. **Use TypeScript**: It will catch type mismatches early

## 🆘 Common Issues

### API not connecting
- Check that backend is running on port 8000
- Verify `VITE_API_URL` in `.env`
- Check CORS settings in `main.py`

### Data not loading
- Check browser console for errors
- Verify Supabase credentials in `creds.env`
- Ensure tables exist in Supabase

### Type errors
- Check that API response matches TypeScript interfaces
- Update types in `src/lib/api.ts` if needed

---

Happy coding! 🚀
