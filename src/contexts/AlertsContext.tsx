import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { alertsAPI } from '@/lib/api';

// Types
interface Alert {
  alert_id: string;
  severity_score: number;
  type: 'overcrowding' | 'missing_entity' | 'access_violation' | 'underutilized';
  affected_zone: string;
  title: string;
  description: string;
  evidence: Evidence[];
  recommended_actions: Action[];
  timestamp: string;
  status: 'active' | 'resolved' | 'pending';
}

interface Evidence {
  source: string;
  id: string;
  weight: number;
  description: string;
}

interface Action {
  action_id: string;
  title: string;
  description: string;
  expected_effect: string;
  impact_score: number;
}

interface AlertsSummary {
  total_alerts: number;
  active_alerts: number;
  resolved_alerts: number;
  pending_alerts: number;
}

interface AlertsContextType {
  alerts: Alert[];
  alertsSummary: AlertsSummary;
  addAlert: (alert: Alert) => void;
  updateAlertStatus: (alertId: string, status: 'active' | 'resolved' | 'pending') => void;
  resolveAlert: (alertId: string) => Promise<void>;
  refreshAlerts: () => void;
}

const AlertsContext = createContext<AlertsContextType | undefined>(undefined);

export const useAlertsContext = () => {
  const context = useContext(AlertsContext);
  if (!context) {
    throw new Error('useAlertsContext must be used within an AlertsProvider');
  }
  return context;
};

interface AlertsProviderProps {
  children: ReactNode;
}

export const AlertsProvider: React.FC<AlertsProviderProps> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertsSummary, setAlertsSummary] = useState<AlertsSummary>({
    total_alerts: 0,
    active_alerts: 0,
    resolved_alerts: 0,
    pending_alerts: 0,
  });

  // Initialize with SpaceFlow mock alerts
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        alert_id: 'alert_001',
        severity_score: 0.92,
        type: 'overcrowding',
        affected_zone: 'cse',
        title: 'High Overcrowding Risk Detected',
        description: 'CSE Department predicted to exceed 95% capacity in next hour',
        evidence: [
          { source: 'wifi_logs', id: 'wifi_12345', weight: 0.32, description: '22 new device connections detected' },
          { source: 'lab_bookings', id: 'booking_555', weight: 0.28, description: 'Scheduled class: Data Structures Lab at 2 PM' },
          { source: 'swipes', id: 'swipe_9876', weight: 0.25, description: 'Recent entry spike: +15 entries in 10 min' },
        ],
        recommended_actions: [
          { action_id: 'act_1', title: 'Notify Department HoD', description: 'Send alert to open CS Lab Complex as overflow', expected_effect: 'Reduce load by ~30%', impact_score: 0.85 },
          { action_id: 'act_2', title: 'Delay Class Start', description: 'Request 15min delay for current lab session', expected_effect: 'Smooth arrival distribution', impact_score: 0.65 },
          { action_id: 'act_3', title: 'Enable Overflow Lab', description: 'Activate CS Lab Complex as overflow space', expected_effect: 'Prevent crowding', impact_score: 0.90 },
        ],
        timestamp: new Date().toISOString(),
        status: 'active',
      },
      {
        alert_id: 'alert_002',
        severity_score: 0.85,
        type: 'overcrowding',
        affected_zone: 'library',
        title: 'Central Library Nearing Capacity',
        description: 'Library at 83% capacity, forecast shows 95% in 30 minutes',
        evidence: [
          { source: 'swipes', id: 'swipe_7777', weight: 0.40, description: 'Entry rate: 12 students/min sustained' },
          { source: 'wifi_logs', id: 'wifi_8888', weight: 0.35, description: '285 active WiFi connections' },
          { source: 'timeline', id: 'timeline_999', weight: 0.25, description: 'Historical pattern: peak study hours' },
        ],
        recommended_actions: [
          { action_id: 'act_8', title: 'Open Reading Rooms', description: 'Activate department reading rooms', expected_effect: 'Distribute 50 students', impact_score: 0.82 },
          { action_id: 'act_9', title: 'Display Capacity Warning', description: 'Show realtime capacity on digital boards', expected_effect: 'Inform students before entry', impact_score: 0.70 },
        ],
        timestamp: new Date(Date.now() - 180000).toISOString(),
        status: 'active',
      },
      {
        alert_id: 'alert_003',
        severity_score: 0.78,
        type: 'missing_entity',
        affected_zone: 'bh1',
        title: 'Entity Not Seen for 15 Hours',
        description: 'Student E100234 last detected at Library 15h ago',
        evidence: [
          { source: 'timeline', id: 'timeline_888', weight: 0.45, description: 'Last seen: Central Library (14:30 yesterday)' },
          { source: 'wifi_logs', id: 'wifi_333', weight: 0.30, description: 'No device activity in 15h' },
          { source: 'swipes', id: 'swipe_111', weight: 0.25, description: 'No hostel entry recorded overnight' },
        ],
        recommended_actions: [
          { action_id: 'act_4', title: 'Check CCTV Cameras', description: 'Review cameras near Library and hostel path', expected_effect: 'Locate entity path', impact_score: 0.80 },
          { action_id: 'act_5', title: 'Notify Hostel Warden', description: 'Alert BH1 warden for manual room check', expected_effect: 'Confirm safety', impact_score: 0.95 },
        ],
        timestamp: new Date(Date.now() - 300000).toISOString(),
        status: 'resolved',
      },
      {
        alert_id: 'alert_004',
        severity_score: 0.65,
        type: 'access_violation',
        affected_zone: 'eeelab',
        title: 'Simultaneous Access Detected',
        description: 'Card C45678 used at two locations within 1 minute',
        evidence: [
          { source: 'swipes', id: 'swipe_5555', weight: 0.50, description: 'Swipe at EEE Labs (10:15:23)' },
          { source: 'swipes', id: 'swipe_6666', weight: 0.50, description: 'Swipe at Core 3 (10:15:58) - 350m apart' },
        ],
        recommended_actions: [
          { action_id: 'act_6', title: 'Lock Card', description: 'Temporarily disable card access', expected_effect: 'Prevent unauthorized use', impact_score: 0.75 },
          { action_id: 'act_7', title: 'Manual Verification', description: 'Security check at both locations', expected_effect: 'Verify identity', impact_score: 0.88 },
        ],
        timestamp: new Date(Date.now() - 600000).toISOString(),
        status: 'pending',
      },
    ];

    setAlerts(mockAlerts);
  }, []);

  // Update summary when alerts change
  useEffect(() => {
    const total = alerts.length;
    const active = alerts.filter(alert => alert.status === 'active').length;
    const resolved = alerts.filter(alert => alert.status === 'resolved').length;
    const pending = alerts.filter(alert => alert.status === 'pending').length;

    setAlertsSummary({
      total_alerts: total,
      active_alerts: active,
      resolved_alerts: resolved,
      pending_alerts: pending,
    });
  }, [alerts]);

  const addAlert = (alert: Alert) => {
    setAlerts(prev => [...prev, alert]);
  };

  const updateAlertStatus = (alertId: string, status: 'active' | 'resolved' | 'pending') => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.alert_id === alertId ? { ...alert, status } : alert
      )
    );
  };

  const resolveAlert = async (alertId: string) => {
    try {
      // Update local state immediately for optimistic UI
      updateAlertStatus(alertId, 'resolved');
      
      // Call backend API to persist the change
      await alertsAPI.updateStatus(alertId, 'resolved');
    } catch (error) {
      console.error('Failed to resolve alert:', error);
      // Optionally revert the local state change on error
      // For now, we'll keep the optimistic update
    }
  };

  const refreshAlerts = () => {
    // In a real app, this would fetch from API
    console.log('Refreshing alerts...');
  };

  const value: AlertsContextType = {
    alerts,
    alertsSummary,
    addAlert,
    updateAlertStatus,
    resolveAlert,
    refreshAlerts,
  };

  return (
    <AlertsContext.Provider value={value}>
      {children}
    </AlertsContext.Provider>
  );
};
