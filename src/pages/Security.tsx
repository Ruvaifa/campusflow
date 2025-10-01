import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  ArrowUpRight,
  Eye,
  Lock,
  Activity,
  Clock
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Security = () => {
  const stats = [
    { 
      title: 'Active Threats', 
      value: '3', 
      change: '-2 from yesterday', 
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    { 
      title: 'Resolved Today', 
      value: '24', 
      change: '+8 from yesterday', 
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success/10'
    },
    { 
      title: 'Monitored Zones', 
      value: '12', 
      change: 'All active', 
      icon: Eye,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10'
    },
    { 
      title: 'Access Violations', 
      value: '5', 
      change: '+2 this hour', 
      icon: Lock,
      color: 'text-warning',
      bgColor: 'bg-warning/10'
    },
  ];

  const threatData = [
    { time: '00:00', threats: 2, resolved: 8 },
    { time: '04:00', threats: 1, resolved: 5 },
    { time: '08:00', threats: 4, resolved: 12 },
    { time: '12:00', threats: 3, resolved: 15 },
    { time: '16:00', threats: 5, resolved: 18 },
    { time: '20:00', threats: 3, resolved: 24 },
  ];

  const severityData = [
    { name: 'Critical', value: 3, color: 'hsl(var(--destructive))' },
    { name: 'High', value: 8, color: 'hsl(var(--warning))' },
    { name: 'Medium', value: 15, color: 'hsl(var(--chart-3))' },
    { name: 'Low', value: 24, color: 'hsl(var(--chart-4))' },
  ];

  const activeThreats = [
    { 
      id: 1, 
      type: 'Unauthorized Access', 
      location: 'Building A - Lab 3', 
      severity: 'critical',
      time: '2m ago',
      entity: 'Unknown Device #4A2B'
    },
    { 
      id: 2, 
      type: 'Simultaneous Login', 
      location: 'Multiple Locations', 
      severity: 'high',
      time: '8m ago',
      entity: 'Card #1234'
    },
    { 
      id: 3, 
      type: 'Unusual Pattern', 
      location: 'North Gate', 
      severity: 'medium',
      time: '15m ago',
      entity: 'Alex Johnson'
    },
  ];

  const recentActivity = [
    { id: 1, action: 'Access Denied', location: 'Server Room', user: 'Unknown', time: '5m ago', status: 'blocked' },
    { id: 2, action: 'Alert Resolved', location: 'Lab 2', user: 'Security Admin', time: '12m ago', status: 'resolved' },
    { id: 3, action: 'Zone Breach', location: 'Restricted Area B', user: 'Staff #234', time: '18m ago', status: 'investigating' },
    { id: 4, action: 'Access Granted', location: 'Main Building', user: 'Sarah Williams', time: '22m ago', status: 'normal' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Security</h1>
        <p className="text-muted-foreground mt-1">
          Real-time security monitoring and threat detection
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
        {/* Threat Timeline */}
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Threat Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={threatData}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
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
                <Area type="monotone" dataKey="threats" stroke="hsl(var(--destructive))" fillOpacity={1} fill="url(#colorThreats)" />
                <Area type="monotone" dataKey="resolved" stroke="hsl(var(--success))" fillOpacity={1} fill="url(#colorResolved)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Severity Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {severityData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Active Threats */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeThreats.map((threat) => (
                <div key={threat.id} className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className={`mt-0.5 p-2 rounded-lg ${
                    threat.severity === 'critical' ? 'bg-destructive/10 text-destructive' :
                    threat.severity === 'high' ? 'bg-warning/10 text-warning' :
                    threat.severity === 'medium' ? 'bg-chart-3/10 text-chart-3' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm">{threat.type}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {threat.time}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {threat.location}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Entity: {threat.entity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      activity.status === 'blocked' ? 'bg-destructive' :
                      activity.status === 'resolved' ? 'bg-success' :
                      activity.status === 'investigating' ? 'bg-warning' :
                      'bg-chart-2'
                    }`} />
                    <div>
                      <p className="font-medium text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.location} • {activity.user}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      activity.status === 'blocked' ? 'destructive' :
                      activity.status === 'resolved' ? 'default' :
                      'secondary'
                    }>
                      {activity.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
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

export default Security;
