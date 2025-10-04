import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Bell, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  TrendingDown,
  TrendingUp,
  Shield,
  XCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { useAlerts } from '@/hooks/useAPI';

const Alerts = () => {
  // Fetch real alerts data from API
  const { data: allAlerts, isLoading } = useAlerts();
  const { data: criticalAlerts } = useAlerts(undefined, 'critical');
  const { data: resolvedAlertsData } = useAlerts('resolved');

  const stats = [
    { 
      title: 'Total Alerts', 
      value: allAlerts?.length?.toString() || '0', 
      change: '+12 today', 
      icon: Bell,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10'
    },
    { 
      title: 'Critical', 
      value: criticalAlerts?.length?.toString() || '0', 
      change: '+2 from yesterday', 
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    { 
      title: 'Resolved', 
      value: resolvedAlertsData?.length?.toString() || '0', 
      change: '+18 today', 
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      title: 'Avg Response Time', 
      value: '8m', 
      change: '-2m improvement', 
      icon: Clock,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10'
    },
  ];

  const alertTrends = [
    { day: 'Mon', critical: 3, high: 8, medium: 12, low: 5 },
    { day: 'Tue', critical: 2, high: 6, medium: 15, low: 8 },
    { day: 'Wed', critical: 4, high: 10, medium: 18, low: 6 },
    { day: 'Thu', critical: 1, high: 5, medium: 14, low: 9 },
    { day: 'Fri', critical: 5, high: 12, medium: 20, low: 10 },
    { day: 'Sat', critical: 2, high: 4, medium: 8, low: 4 },
    { day: 'Sun', critical: 1, high: 3, medium: 6, low: 3 },
  ];

  const categoryData = [
    { name: 'Access', count: 15 },
    { name: 'Identity', count: 12 },
    { name: 'Pattern', count: 8 },
    { name: 'Device', count: 7 },
    { name: 'Location', count: 5 },
  ];

  // Use real active alerts from API
  const activeAlerts = allAlerts?.filter(alert => alert.status === 'active').map((alert, index) => ({
    id: index + 1,
    type: alert.alert_type,
    entity: alert.entity_id || 'Unknown Entity',
    severity: alert.severity,
    time: new Date(alert.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }),
    location: alert.location || 'Unknown Location',
    evidence: alert.description
  })) || [];

  // Use real resolved alerts from API
  const resolvedAlerts = resolvedAlertsData?.map((alert, index) => ({
    id: index + 1,
    type: alert.alert_type,
    entity: alert.entity_id || 'Unknown Entity',
    resolvedBy: alert.resolved_by || 'System',
    time: alert.resolved_at ? new Date(alert.resolved_at).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    }) : 'N/A',
    resolution: alert.description
  })) || [
    {
      id: 1,
      type: 'Access Anomaly',
      entity: 'Michael Chen',
      resolvedBy: 'Security Admin',
      time: '1h ago',
      resolution: 'Verified with staff, authorized maintenance'
    },
    {
      id: 2,
      type: 'Identity Mismatch',
      entity: 'Card #1234',
      resolvedBy: 'System Auto',
      time: '2h ago',
      resolution: 'Entity merged, confidence updated to 0.94'
    },
    {
      id: 3,
      type: 'Zone Breach',
      entity: 'Unknown Device',
      resolvedBy: 'Security Team',
      time: '3h ago',
      resolution: 'Device removed, area secured'
    },
  ];

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Loading alerts data...
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage security alerts across campus
          </p>
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-xl ${stat.bgColor} ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Alert Trends */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Alert Trends (7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={alertTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Line type="monotone" dataKey="critical" stroke="hsl(var(--destructive))" strokeWidth={2} />
                <Line type="monotone" dataKey="high" stroke="hsl(var(--warning))" strokeWidth={2} />
                <Line type="monotone" dataKey="medium" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                <Line type="monotone" dataKey="low" stroke="hsl(var(--chart-4))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Alert Categories */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alert Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={80} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="count" fill="hsl(var(--chart-1))" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Alerts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className={`mt-0.5 p-2 rounded-lg ${
                  alert.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                  alert.severity === 'high' ? 'bg-warning/10 text-warning' :
                  alert.severity === 'medium' ? 'bg-chart-3/10 text-chart-3' :
                  'bg-chart-4/10 text-chart-4'
                }`}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          alert.severity === 'critical' ? 'destructive' :
                          alert.severity === 'high' ? 'default' :
                          'secondary'
                        } className="text-xs">
                          {alert.severity.toUpperCase()}
                        </Badge>
                        <p className="font-semibold">{alert.type}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        <span className="font-medium">Entity:</span> {alert.entity}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {alert.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                    <span>📍 {alert.location}</span>
                    <span>• {alert.evidence}</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      View Details
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Resolve
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Escalate
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recently Resolved */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recently Resolved</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {resolvedAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10 text-success">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{alert.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.entity} • Resolved by {alert.resolvedBy}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {alert.resolution}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {alert.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alerts;
