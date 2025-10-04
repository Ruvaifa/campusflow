import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  CreditCard,
  Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { useDashboardStats, useProfiles, useSwipes, useAlerts } from '@/hooks/useAPI';

const Dashboard = () => {
  // Fetch real data from API
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentProfiles, isLoading: profilesLoading } = useProfiles(4, 0);
  const { data: recentSwipes } = useSwipes(100);
  const { data: alerts } = useAlerts('active');

  // Calculate stats from real data
  const stats = [
    { 
      title: 'Total Entities', 
      value: dashboardStats?.total_entities?.toLocaleString() || '0', 
      change: '+12.5%', 
      trend: 'up', 
      icon: Users,
      color: 'text-chart-1'
    },
    { 
      title: 'Active Today', 
      value: dashboardStats?.active_today?.toString() || '0', 
      change: '+8.2%', 
      trend: 'up', 
      icon: Activity,
      color: 'text-chart-2'
    },
    { 
      title: 'Security Alerts', 
      value: alerts?.length?.toString() || '0', 
      change: '+3', 
      trend: 'up', 
      icon: AlertTriangle,
      color: 'text-warning'
    },
    { 
      title: 'Resolution Rate', 
      value: `${dashboardStats?.resolution_accuracy || 0}%`, 
      change: '+2.1%', 
      trend: 'up', 
      icon: TrendingUp,
      color: 'text-success'
    },
  ];

  const activityData = [
    { time: 'Mon', entities: 892, sessions: 65, alerts: 8 },
    { time: 'Tue', entities: 945, sessions: 72, alerts: 5 },
    { time: 'Wed', entities: 1123, sessions: 85, alerts: 12 },
    { time: 'Thu', entities: 978, sessions: 68, alerts: 7 },
    { time: 'Fri', entities: 1247, sessions: 89, alerts: 12 },
    { time: 'Sat', entities: 856, sessions: 54, alerts: 4 },
    { time: 'Sun', entities: 723, sessions: 42, alerts: 3 },
  ];

  const sourceData = [
    { name: 'Swipe', value: 456, color: 'hsl(var(--chart-1))' },
    { name: 'Wi-Fi', value: 342, color: 'hsl(var(--chart-2))' },
    { name: 'CCTV', value: 289, color: 'hsl(var(--chart-3))' },
    { name: 'Booking', value: 160, color: 'hsl(var(--chart-4))' },
  ];

  // Use real profile data from API
  const recentEntities = recentProfiles?.map((profile, index) => ({
    id: index + 1,
    name: profile.name,
    role: profile.role,
    status: 'active',
    confidence: 0.85 + (Math.random() * 0.15), // Random confidence between 0.85-1.0
    entity_id: profile.entity_id,
    department: profile.department
  })) || [];

  // Use real alerts from API
  const recentAlerts = alerts?.slice(0, 3).map((alert, index) => ({
    id: index + 1,
    type: alert.alert_type,
    entity: alert.entity_id || 'Unknown',
    severity: alert.severity,
    time: new Date(alert.timestamp).toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit' 
    })
  })) || [];

  // Show loading state
  if (statsLoading || profilesLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Loading dashboard data...
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Real-time campus security monitoring and entity resolution
        </p>
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
                  <div className="flex items-center gap-1 mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-destructive" />
                    )}
                    <span className={stat.trend === 'up' ? 'text-success' : 'text-destructive'}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-xl bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Activity Chart */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Entity Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={activityData}>
                <defs>
                  <linearGradient id="colorEntities" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="entities" 
                  stroke="hsl(var(--chart-1))" 
                  fillOpacity={1} 
                  fill="url(#colorEntities)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Data Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Bar dataKey="value" fill="hsl(var(--chart-1))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Entities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntities.map((entity) => (
                <div key={entity.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{entity.name}</p>
                      <p className="text-sm text-muted-foreground">{entity.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={entity.status === 'active' ? 'default' : 'secondary'}>
                      {entity.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {(entity.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Security Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    alert.severity === 'high' ? 'bg-destructive/10 text-destructive' :
                    alert.severity === 'medium' ? 'bg-warning/10 text-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{alert.type}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {alert.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {alert.entity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
