import { useState, useEffect } from 'react';
import { useAlerts, useUpdateAlertStatus } from '@/hooks/useAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  Building,
  Activity,
  TrendingUp,
  Shield,
  Zap,
  MapPin,
  Users,
  Lock,
  Eye
} from 'lucide-react';
import { Alert } from '@/lib/api';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Priority Alert Types
interface PriorityAlert {
  alert_id: string;
  severity_score: number;
  type: 'overcrowding' | 'missing_entity' | 'access_violation' | 'underutilized';
  affected_zone: string;
  title: string;
  description: string;
  evidence: Evidence[];
  recommended_actions: Action[];
  timestamp: string;
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

const Alerts = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved' | 'investigating'>('all');
  const [priorityAlerts, setPriorityAlerts] = useState<PriorityAlert[]>([]);
  const [expandedAlerts, setExpandedAlerts] = useState<string[]>([]);
  
  const { data: allAlertsData, isLoading: allLoading } = useAlerts(undefined, 500);
  const { data: activeAlertsData, isLoading: activeLoading } = useAlerts('active', 500);
  const { data: resolvedAlertsData, isLoading: resolvedLoading } = useAlerts('resolved', 500);
  const { data: investigatingAlertsData, isLoading: investigatingLoading } = useAlerts('investigating', 500);
  
  const updateAlertStatus = useUpdateAlertStatus();

  // Load priority alerts from SpaceFlow
  useEffect(() => {
    const mockAlerts: PriorityAlert[] = [
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
      },
    ];
    setPriorityAlerts(mockAlerts.sort((a, b) => b.severity_score - a.severity_score));
  }, []);

  const toggleAlertExpansion = (alertId: string) => {
    setExpandedAlerts(prev => 
      prev.includes(alertId) 
        ? prev.filter(id => id !== alertId)
        : [...prev, alertId]
    );
  };

  const getSeverityColor = (score: number) => {
    if (score >= 0.8) return 'red';
    if (score >= 0.6) return 'orange';
    if (score >= 0.4) return 'yellow';
    return 'green';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'overcrowding': return <Users className="h-4 w-4" />;
      case 'missing_entity': return <Eye className="h-4 w-4" />;
      case 'access_violation': return <Lock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  // Extract alerts from the new response format
  const allAlerts = allAlertsData?.alerts || [];
  const activeAlerts = activeAlertsData?.alerts || [];
  const resolvedAlerts = resolvedAlertsData?.alerts || [];
  const investigatingAlerts = investigatingAlertsData?.alerts || [];
  
  // Get summary data
  const summary = allAlertsData?.summary;

  const alerts = activeTab === 'all' ? allAlerts : 
                 activeTab === 'active' ? activeAlerts :
                 activeTab === 'resolved' ? resolvedAlerts :
                 investigatingAlerts;

  const isLoading = activeTab === 'all' ? allLoading :
                    activeTab === 'active' ? activeLoading :
                    activeTab === 'resolved' ? resolvedLoading :
                    investigatingLoading;

  const handleStatusChange = (entityId: string, newStatus: Alert['status']) => {
    updateAlertStatus.mutate({ entityId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Active
        </Badge>;
      case 'resolved':
        return <Badge variant="default" className="flex items-center gap-1 bg-green-600 hover:bg-green-700">
          <CheckCircle className="h-3 w-3" />
          Resolved
        </Badge>;
      case 'investigating':
        return <Badge variant="secondary" className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700">
          <Clock className="h-3 w-3" />
          Investigating
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate statistics from summary or fallback to counting
  const stats = {
    total: summary?.total_alerts || allAlerts.length || 0,
    active: summary?.alert_entities || activeAlerts.length || 0,
    resolved: resolvedAlerts.length || 0,
    investigating: summary?.warning_entities || investigatingAlerts.length || 0,
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security Alerts</h1>
        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
          Monitor and manage security alerts across the campus
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All time alerts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Investigating</CardTitle>
            <Activity className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.investigating}</div>
            <p className="text-xs text-muted-foreground">Under review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
            <p className="text-xs text-muted-foreground">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Priority Alerts from SpaceFlow */}
      {priorityAlerts.length > 0 && (
        <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-purple-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-400" />
              <span>Priority Alerts</span>
              <Badge variant="destructive" className="ml-2">
                {priorityAlerts.filter(a => a.severity_score >= 0.8).length} Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {priorityAlerts.map((alert, idx) => {
              const isExpanded = expandedAlerts.includes(alert.alert_id);
              const severityColor = getSeverityColor(alert.severity_score);
              
              return (
                <motion.div
                  key={alert.alert_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Collapsible open={isExpanded} onOpenChange={() => toggleAlertExpansion(alert.alert_id)}>
                    <Card className={`border-l-4 border-l-${severityColor}-500 hover:shadow-lg transition-all`}>
                      <CollapsibleTrigger className="w-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {/* Alert Icon */}
                              <div className={`p-2 rounded-lg bg-${severityColor}-500/20 text-${severityColor}-400`}>
                                {getAlertIcon(alert.type)}
                              </div>
                              
                              {/* Alert Info */}
                              <div className="flex-1 text-left">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge 
                                    variant="outline" 
                                    className={`bg-${severityColor}-500/20 text-${severityColor}-400 border-${severityColor}-500/50 text-xs font-bold`}
                                  >
                                    {getSeverityLabel(alert.severity_score)}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    <MapPin className="h-3 w-3 mr-1" />
                                    {alert.affected_zone.toUpperCase()}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {formatTimestamp(alert.timestamp)}
                                  </span>
                                </div>
                                <h4 className="font-semibold">{alert.title}</h4>
                                <p className="text-sm text-muted-foreground">{alert.description}</p>
                              </div>

                              {/* Severity Score */}
                              <div className="text-right">
                                <div className={`text-2xl font-bold text-${severityColor}-400`}>
                                  {Math.round(alert.severity_score * 100)}
                                </div>
                                <div className="text-xs text-muted-foreground">Severity</div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <CardContent className="pt-0 pb-4 space-y-4">
                          {/* Evidence Section */}
                          <div>
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Evidence Sources
                            </h5>
                            <div className="space-y-2">
                              {alert.evidence.map((ev) => (
                                <div 
                                  key={ev.id}
                                  className="flex items-start gap-2 text-sm bg-muted/50 p-2 rounded"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">
                                        {ev.source}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Weight: {Math.round(ev.weight * 100)}%
                                      </span>
                                    </div>
                                    <p className="mt-1 text-muted-foreground">{ev.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Recommended Actions */}
                          <div>
                            <h5 className="text-sm font-semibold mb-2 flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              Recommended Actions
                            </h5>
                            <div className="space-y-2">
                              {alert.recommended_actions
                                .sort((a, b) => b.impact_score - a.impact_score)
                                .map((action) => (
                                  <div
                                    key={action.action_id}
                                    className="flex items-start justify-between gap-3 bg-blue-950/20 border border-blue-500/20 p-3 rounded-lg"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h6 className="font-semibold text-sm">{action.title}</h6>
                                        <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/50">
                                          Impact: {Math.round(action.impact_score * 100)}%
                                        </Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground mb-1">{action.description}</p>
                                      <p className="text-xs text-blue-400">→ {action.expected_effect}</p>
                                    </div>
                                    <Button size="sm" variant="outline" className="border-blue-500/50 hover:bg-blue-500/20">
                                      Execute
                                    </Button>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Alert Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
              <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
              <TabsTrigger value="investigating">Investigating ({stats.investigating})</TabsTrigger>
              <TabsTrigger value="resolved">Resolved ({stats.resolved})</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : alerts && alerts.length > 0 ? (
                <div className="space-y-4">
                  {alerts.map((alert: any) => (
                    <Card 
                      key={alert.entity_id}
                      className={`transition-all hover:shadow-md ${
                        alert.status === 'active' 
                          ? 'border-l-4 border-l-red-600' 
                          : alert.status === 'investigating'
                          ? 'border-l-4 border-l-amber-600'
                          : 'border-l-4 border-l-green-600'
                      }`}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 space-y-3">
                            {/* Header */}
                            <div className="flex items-center gap-3">
                              {getStatusBadge(alert.status)}
                              <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                {formatTimestamp(alert.timestamp)}
                              </span>
                            </div>

                            {/* Entity Information */}
                            {alert.profile ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-semibold">{alert.profile.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {alert.entity_id}
                                  </Badge>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                  {alert.profile.email && (
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-3 w-3 text-muted-foreground" />
                                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        {alert.profile.email}
                                      </span>
                                    </div>
                                  )}
                                  {alert.profile.department && (
                                    <div className="flex items-center gap-2">
                                      <Building className="h-3 w-3 text-muted-foreground" />
                                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        {alert.profile.department}
                                      </span>
                                    </div>
                                  )}
                                  {alert.profile.role && (
                                    <div className="flex items-center gap-2">
                                      <Shield className="h-3 w-3 text-muted-foreground" />
                                      <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                        {alert.profile.role}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="font-semibold">Entity ID: {alert.entity_id}</span>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 ml-4">
                            {alert.status === 'active' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(alert.entity_id, 'investigating')}
                                  disabled={updateAlertStatus.isPending}
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  Investigate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusChange(alert.entity_id, 'resolved')}
                                  disabled={updateAlertStatus.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              </>
                            )}
                            {alert.status === 'investigating' && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleStatusChange(alert.entity_id, 'active')}
                                  disabled={updateAlertStatus.isPending}
                                >
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Escalate
                                </Button>
                                <Button
                                  size="sm"
                                  variant="default"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => handleStatusChange(alert.entity_id, 'resolved')}
                                  disabled={updateAlertStatus.isPending}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolve
                                </Button>
                              </>
                            )}
                            {alert.status === 'resolved' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(alert.entity_id, 'active')}
                                disabled={updateAlertStatus.isPending}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Reopen
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No alerts found</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {activeTab === 'all' 
                      ? 'There are no alerts in the system.'
                      : `There are no ${activeTab} alerts at the moment.`}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
