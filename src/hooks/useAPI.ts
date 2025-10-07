/**
 * Custom React hooks for API data fetching
 * Uses React Query for caching, loading states, and error handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Profile, EntityResolution, ActivityTimeline, DashboardStats, SecurityStats, Alert, Entity, EntityDetails } from '@/lib/api';

// ============================================
// PROFILE HOOKS
// ============================================
export function useProfiles(limit = 100, offset = 0) {
  return useQuery({
    queryKey: ['profiles', limit, offset],
    queryFn: () => api.profiles.getAll(limit, offset),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useProfile(entityId: string) {
  return useQuery({
    queryKey: ['profile', entityId],
    queryFn: () => api.profiles.getById(entityId),
    enabled: !!entityId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProfileSearch(query: string, field: 'name' | 'email' | 'department' = 'name') {
  return useQuery({
    queryKey: ['profiles', 'search', query, field],
    queryFn: () => api.profiles.search(query, field),
    enabled: query.length > 0,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// ENTITY HOOKS (Enriched with activity data)
// ============================================
export function useEntities(
  limit = 100, 
  offset = 0, 
  status?: 'active' | 'recent' | 'inactive' | 'all',
  search?: string
) {
  return useQuery({
    queryKey: ['entities', limit, offset, status, search],
    queryFn: () => api.entities.getAll(limit, offset, status, search),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for live updates
  });
}

export function useEntityDetails(entityId: string) {
  return useQuery({
    queryKey: ['entity-details', entityId],
    queryFn: () => api.entities.getById(entityId),
    enabled: !!entityId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 15 * 1000, // Refetch every 15 seconds for live activity updates
  });
}

// ============================================
// SWIPE HOOKS
// ============================================
export function useSwipes(limit = 50, entityId?: string) {
  return useQuery({
    queryKey: ['swipes', limit, entityId],
    queryFn: () => api.swipes.getRecent(limit, entityId),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ============================================
// WIFI LOG HOOKS
// ============================================
export function useWiFiLogs(limit = 50, entityId?: string) {
  return useQuery({
    queryKey: ['wifi-logs', limit, entityId],
    queryFn: () => api.wifi.getRecent(limit, entityId),
    staleTime: 1 * 60 * 1000,
  });
}

// ============================================
// LAB BOOKING HOOKS
// ============================================
export function useLabBookings(entityId?: string, upcoming = false) {
  return useQuery({
    queryKey: ['lab-bookings', entityId, upcoming],
    queryFn: () => api.labBookings.getAll(entityId, upcoming),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// LIBRARY CHECKOUT HOOKS
// ============================================
export function useLibraryCheckouts(entityId?: string) {
  return useQuery({
    queryKey: ['library-checkouts', entityId],
    queryFn: () => api.library.getCheckouts(entityId),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// NOTES HOOKS
// ============================================
export function useNotes(entityId?: string, source?: string) {
  return useQuery({
    queryKey: ['notes', entityId, source],
    queryFn: () => api.notes.getAll(entityId, source),
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// CCTV FRAME HOOKS
// ============================================
export function useCCTVFrames(locationId?: string, limit = 50) {
  return useQuery({
    queryKey: ['cctv-frames', locationId, limit],
    queryFn: () => api.cctv.getFrames(locationId, limit),
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ============================================
// ENTITY RESOLUTION HOOKS
// ============================================
export function useEntityResolution(params: {
  card_id?: string;
  device_hash?: string;
  face_id?: string;
}) {
  const hasParams = params.card_id || params.device_hash || params.face_id;
  
  return useQuery({
    queryKey: ['entity-resolution', params],
    queryFn: () => api.entityResolution.resolve(params),
    enabled: !!hasParams,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEntityTimeline(entityId: string, days = 7) {
  return useQuery({
    queryKey: ['entity-timeline', entityId, days],
    queryFn: () => api.entityResolution.getTimeline(entityId, days),
    enabled: !!entityId,
    staleTime: 2 * 60 * 1000,
  });
}

// ============================================
// DASHBOARD HOOKS
// ============================================
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.dashboard.getStats(),
    staleTime: 1 * 60 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useActivityHeatmap(days = 7) {
  return useQuery({
    queryKey: ['activity-heatmap', days],
    queryFn: () => api.dashboard.getActivityHeatmap(days),
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================
// SECURITY HOOKS
// ============================================
export function useSecurityStats() {
  return useQuery({
    queryKey: ['security-stats'],
    queryFn: () => api.security.getStats(),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

// ============================================
// ALERTS HOOKS
// ============================================
export function useAlerts(status?: Alert['status'], severity?: Alert['severity']) {
  return useQuery({
    queryKey: ['alerts', status, severity],
    queryFn: () => api.alerts.getAll(status, severity),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
}

// ============================================
// HEALTH CHECK HOOK
// ============================================
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => api.health.check(),
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000, // Check every minute
  });
}

// ============================================
// MUTATION HOOKS (for future use)
// ============================================
// These can be used for POST/PUT/DELETE operations when needed

export function useResolveAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      // This would call an API endpoint to resolve an alert
      // For now, it's a placeholder
      console.log('Resolving alert:', alertId);
    },
    onSuccess: () => {
      // Invalidate alerts query to refetch
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}

export function useEscalateAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (alertId: string) => {
      // This would call an API endpoint to escalate an alert
      console.log('Escalating alert:', alertId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
  });
}
