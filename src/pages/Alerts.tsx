import { useState } from 'react';
import { useAlerts, useUpdateAlertStatus } from '@/hooks/useAPI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Mail, 
  Building,
  Activity,
  TrendingUp,
  Shield
} from 'lucide-react';
import { Alert } from '@/lib/api';

const Alerts = () => {
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'resolved' | 'investigating'>('all');
  
  const { data: allAlertsData, isLoading: allLoading } = useAlerts(undefined, 500);
  const { data: activeAlertsData, isLoading: activeLoading } = useAlerts('active', 500);
  const { data: resolvedAlertsData, isLoading: resolvedLoading } = useAlerts('resolved', 500);
  const { data: investigatingAlertsData, isLoading: investigatingLoading } = useAlerts('investigating', 500);
  
  const updateAlertStatus = useUpdateAlertStatus();

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

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
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
