/**
 * API Service Layer for Campus Entity Resolution & Security System
 * Connects React frontend to FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ============================================
// TYPES
// ============================================
export interface Profile {
  entity_id: string;
  name: string;
  role: string;
  email: string;
  department: string;
  student_id?: string;
  staff_id?: string;
  card_id?: string;
  device_hash?: string;
  face_id?: string;
  metadata_json?: Record<string, any>;
}

export interface Swipe {
  identity: string;
  card_id: string;
  location_id: string;
  timestamp: string;
  raw_record_json?: Record<string, any>;
}

export interface WiFiLog {
  identity: string;
  device_hash: string;
  ap_id: string;
  timestamp: string;
  raw_record_json?: Record<string, any>;
}

export interface LabBooking {
  identity: string;
  booking_id: string;
  entity_id: string;
  lab_id: string;
  start_time: string;
  end_time: string;
  attended_flag: boolean;
  metadata?: Record<string, any>;
}

export interface LibraryCheckout {
  identity: string;
  checkout_id: string;
  entity_id: string;
  book_id: string;
  timestamp: string;
}

export interface Note {
  identity: string;
  entity_id: string;
  source: string;
  text: string;
  timestamp: string;
}

export interface CCTVFrame {
  identity: string;
  frame_id: string;
  location_id: string;
  timestamp: string;
  face_id?: string;
}

export interface EntityResolution {
  entity_id: string;
  confidence: number;
  matched_sources: string[];
  profile: Profile;
}

export interface ActivityTimeline {
  entity_id: string;
  period_days: number;
  swipes: Swipe[];
  wifi_logs: WiFiLog[];
  lab_bookings: LabBooking[];
  library_checkouts: LibraryCheckout[];
  total_activities: number;
}

export interface DashboardStats {
  total_entities: number;
  active_today: number;
  total_activities: number;
  resolution_accuracy: number;
}

export interface SecurityStats {
  active_threats: number;
  resolved_today: number;
  monitored_zones: number;
  access_violations: number;
  total_swipes_today: number;
  total_cctv_frames_today: number;
}

export interface Alert {
  id: string;
  entity_id?: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location?: string;
  timestamp: string;
  status: 'active' | 'resolved' | 'investigating';
  resolved_at?: string;
  resolved_by?: string;
}

export interface Entity extends Profile {
  last_seen?: string;
  last_location?: string;
  status: 'active' | 'recent' | 'inactive';
  confidence: number;
}

export interface EntityDetails {
  profile: Profile;
  status: 'active' | 'recent' | 'inactive';
  activity_summary: {
    swipes: number;
    wifi_connections: number;
    lab_bookings: number;
    library_checkouts: number;
    total_activities: number;
  };
  recent_activities: Array<{
    timestamp: string;
    type: string;
    location: string;
    details: string;
  }>;
  last_seen?: string;
  last_location?: string;
}

export interface EntitiesResponse {
  entities: Entity[];
  total: number;
  limit: number;
  offset: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  summary: {
    total_entities: number;
    active_entities: number;
    warning_entities: number;
    alert_entities: number;
    total_alerts: number;
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================
async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ============================================
// PROFILE API
// ============================================
export const profileAPI = {
  getAll: async (limit = 100, offset = 0): Promise<Profile[]> => {
    return fetchAPI<Profile[]>(`/api/profiles?limit=${limit}&offset=${offset}`);
  },

  getById: async (entityId: string): Promise<Profile> => {
    return fetchAPI<Profile>(`/api/profiles/${entityId}`);
  },

  search: async (query: string, field: 'name' | 'email' | 'department' = 'name'): Promise<Profile[]> => {
    return fetchAPI<Profile[]>(`/api/profiles/search/${encodeURIComponent(query)}?field=${field}`);
  },
};

// ============================================
// SWIPE API
// ============================================
export const swipeAPI = {
  getRecent: async (limit = 50, entityId?: string): Promise<Swipe[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (entityId) params.append('entity_id', entityId);
    return fetchAPI<Swipe[]>(`/api/swipes?${params}`);
  },
};

// ============================================
// WIFI LOG API
// ============================================
export const wifiAPI = {
  getRecent: async (limit = 50, entityId?: string): Promise<WiFiLog[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (entityId) params.append('entity_id', entityId);
    return fetchAPI<WiFiLog[]>(`/api/wifi_logs?${params}`);
  },
};

// ============================================
// LAB BOOKING API
// ============================================
export const labBookingAPI = {
  getAll: async (entityId?: string, upcoming = false): Promise<LabBooking[]> => {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    if (upcoming) params.append('upcoming', 'true');
    return fetchAPI<LabBooking[]>(`/api/lab_bookings?${params}`);
  },
};

// ============================================
// LIBRARY CHECKOUT API
// ============================================
export const libraryAPI = {
  getCheckouts: async (entityId?: string): Promise<LibraryCheckout[]> => {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    return fetchAPI<LibraryCheckout[]>(`/api/library_checkouts?${params}`);
  },
};

// ============================================
// NOTES API
// ============================================
export const notesAPI = {
  getAll: async (entityId?: string, source?: string): Promise<Note[]> => {
    const params = new URLSearchParams();
    if (entityId) params.append('entity_id', entityId);
    if (source) params.append('source', source);
    return fetchAPI<Note[]>(`/api/notes?${params}`);
  },
};

// ============================================
// CCTV FRAME API
// ============================================
export const cctvAPI = {
  getFrames: async (locationId?: string, limit = 50): Promise<CCTVFrame[]> => {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (locationId) params.append('location_id', locationId);
    return fetchAPI<CCTVFrame[]>(`/api/cctv_frame?${params}`);
  },
};

// ============================================
// ENTITY RESOLUTION API
// ============================================
export const entityResolutionAPI = {
  resolve: async (params: {
    card_id?: string;
    device_hash?: string;
    face_id?: string;
  }): Promise<EntityResolution> => {
    const queryParams = new URLSearchParams();
    if (params.card_id) queryParams.append('card_id', params.card_id);
    if (params.device_hash) queryParams.append('device_hash', params.device_hash);
    if (params.face_id) queryParams.append('face_id', params.face_id);
    return fetchAPI<EntityResolution>(`/api/resolve?${queryParams}`);
  },

  getTimeline: async (entityId: string, days = 7): Promise<ActivityTimeline> => {
    return fetchAPI<ActivityTimeline>(`/api/entity/${entityId}/timeline?days=${days}`);
  },
};

// ============================================
// DASHBOARD API
// ============================================
export const dashboardAPI = {
  getStats: async (targetDate?: string, targetTime?: string): Promise<DashboardStats> => {
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    if (targetTime) params.append('target_time', targetTime);
    const queryString = params.toString();
    return fetchAPI<DashboardStats>(`/api/dashboard/stats${queryString ? `?${queryString}` : ''}`);
  },

  getActivityHeatmap: async (days = 7): Promise<any> => {
    return fetchAPI(`/api/analytics/activity-heatmap?days=${days}`);
  },

  getWeeklyActivity: async (targetDate?: string, targetTime?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    if (targetTime) params.append('target_time', targetTime);
    const queryString = params.toString();
    return fetchAPI(`/api/analytics/weekly-activity${queryString ? `?${queryString}` : ''}`);
  },

  getSourceDistribution: async (targetDate?: string, targetTime?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    if (targetTime) params.append('target_time', targetTime);
    const queryString = params.toString();
    return fetchAPI(`/api/analytics/source-distribution${queryString ? `?${queryString}` : ''}`);
  },
};

// ============================================
// SECURITY API
// ============================================
export const securityAPI = {
  getStats: async (): Promise<SecurityStats> => {
    return fetchAPI<SecurityStats>('/api/security/stats');
  },
};

// ============================================
// ALERTS API
// ============================================
export const alertsAPI = {
  getAll: async (status?: Alert['status'], limit?: number): Promise<AlertsResponse> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (limit) params.append('limit', limit.toString());
    return fetchAPI<AlertsResponse>(`/api/alerts?${params}`);
  },
  updateStatus: async (entityId: string, status: Alert['status']): Promise<Alert> => {
    return fetchAPI<Alert>(`/api/alerts/${entityId}?status=${status}`, {
      method: 'PUT',
    });
  },
};

// ============================================
// HEALTH CHECK
// ============================================
export const healthAPI = {
  check: async (): Promise<{ status: string }> => {
    return fetchAPI('/health');
  },
};

// Export all APIs as a single object
export const api = {
  profiles: profileAPI,
  swipes: swipeAPI,
  wifi: wifiAPI,
  labBookings: labBookingAPI,
  library: libraryAPI,
  notes: notesAPI,
  cctv: cctvAPI,
  entityResolution: entityResolutionAPI,
  dashboard: dashboardAPI,
  security: securityAPI,
  alerts: alertsAPI,
  health: healthAPI,
};

export default api;
