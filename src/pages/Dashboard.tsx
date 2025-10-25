import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Users, 
  AlertTriangle, 
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Wifi,
  CreditCard,
  Eye,
  ChevronRight,
  Clock,
  MapPin,
  CheckCircle2,
  XCircle
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
import { useNavigate } from 'react-router-dom';
import { useDashboardStats, useProfiles, useSwipes, useAlerts, useWeeklyActivity, useSourceDistribution } from '@/hooks/useAPI';
import { useState } from 'react';
import { useAlertsContext } from '@/contexts/AlertsContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for hover effects
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredChart, setHoveredChart] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [resolvingAlerts, setResolvingAlerts] = useState<Set<string>>(new Set());
  
  // Fixed date and time for data consistency (hidden from UI)
  const TARGET_DATE = '2025-09-20';
  const TARGET_TIME = '23:00:00';
  
  // Fetch data from API
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats(TARGET_DATE, TARGET_TIME);
  const { data: weeklyActivityData, isLoading: activityLoading } = useWeeklyActivity(TARGET_DATE, TARGET_TIME);
  const { data: sourceDistData, isLoading: sourceLoading } = useSourceDistribution(TARGET_DATE, TARGET_TIME);
  const { data: recentProfiles, isLoading: profilesLoading } = useProfiles(4, 0);
  const { data: recentSwipes } = useSwipes(100);
  
  // Use shared alerts context
  const { alerts, alertsSummary, resolveAlert } = useAlertsContext();

  // Handle alert resolution with loading state and toast
  const handleResolveAlert = async (alertId: string, alertTitle: string) => {
    setResolvingAlerts(prev => new Set(prev).add(alertId));
    
    try {
      await resolveAlert(alertId);
      toast({
        title: "Alert Resolved",
        description: `Successfully resolved: ${alertTitle}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Resolution Failed",
        description: "Failed to resolve alert. Please try again.",
        variant: "destructive",
      });
    } finally {
      setResolvingAlerts(prev => {
        const newSet = new Set(prev);
        newSet.delete(alertId);
        return newSet;
      });
    }
  };

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
      title: 'Active (12hrs)', 
      value: dashboardStats?.active_today?.toString() || '0', 
      change: '+8.2%', 
      trend: 'up', 
      icon: Activity,
      color: 'text-chart-2'
    },
    { 
      title: 'Security Alerts', 
      value: alertsSummary?.total_alerts?.toString() || alerts?.length?.toString() || '0', 
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

  // Use real data from API for graphs
  const activityData = weeklyActivityData?.data || [
    { time: 'Mon', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Tue', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Wed', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Thu', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Fri', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Sat', entities: 0, sessions: 0, alerts: 0 },
    { time: 'Sun', entities: 0, sessions: 0, alerts: 0 },
  ];

  const sourceData = sourceDistData?.data || [
    { name: 'Swipe', value: 0, color: 'hsl(var(--chart-1))' },
    { name: 'Wi-Fi', value: 0, color: 'hsl(var(--chart-2))' },
    { name: 'CCTV', value: 0, color: 'hsl(var(--chart-3))' },
    { name: 'Booking', value: 0, color: 'hsl(var(--chart-4))' },
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

  // Use shared alerts data
  const recentAlerts = alerts?.slice(0, 3)?.map((alert, index) => ({
    id: alert.alert_id,
    type: alert.type,
    entity: alert.affected_zone,
    severity: alert.severity_score >= 0.8 ? 'high' : alert.severity_score >= 0.6 ? 'medium' : 'low',
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
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Real-time campus security monitoring and entity resolution
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card 
            key={index} 
            className={`transition-all duration-300 cursor-pointer ${
              hoveredCard === `stat-${index}` 
                ? 'scale-105 bg-slate-900/80 shadow-2xl border-slate-700' 
                : 'hover:shadow-lg hover:bg-slate-50/50'
            }`}
            onMouseEnter={() => setHoveredCard(`stat-${index}`)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className={`text-xs md:text-sm font-medium transition-colors truncate ${
                    hoveredCard === `stat-${index}` ? 'text-sky-300' : 'text-muted-foreground'
                  }`}>
                    {stat.title}
                  </p>
                  <p className={`text-xl md:text-3xl font-bold mt-1 md:mt-2 transition-colors ${
                    hoveredCard === `stat-${index}` ? 'text-sky-400' : ''
                  }`}>{stat.value}</p>
                  <div className="flex items-center gap-1 mt-1 md:mt-2">
                    {stat.trend === 'up' ? (
                      <ArrowUpRight className="w-3 h-3 md:w-4 md:h-4 text-success" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 md:w-4 md:h-4 text-destructive" />
                    )}
                    <span className={`text-xs md:text-sm ${stat.trend === 'up' ? 'text-success' : 'text-destructive'}`}>
                      {stat.change}
                    </span>
                  </div>
                </div>
                <div className={`p-2 md:p-3 rounded-xl transition-all duration-300 flex-shrink-0 ${
                  hoveredCard === `stat-${index}` 
                    ? 'bg-slate-700 scale-110' 
                    : 'bg-muted'
                } ${stat.color}`}>
                  <stat.icon className="w-4 h-4 md:w-6 md:h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Activity Chart */}
        <Card 
          className={`col-span-1 transition-all duration-300 cursor-pointer ${
            hoveredChart === 'activity' 
              ? 'scale-105 bg-slate-900/80 shadow-2xl border-slate-700' 
              : 'hover:shadow-lg hover:bg-slate-50/50'
          }`}
          onMouseEnter={() => setHoveredChart('activity')}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <CardHeader>
            <CardTitle className={`text-lg transition-colors ${
              hoveredChart === 'activity' ? 'text-sky-400' : ''
            }`}>Entity Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={activityData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <defs>
                  <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
                    <path d="M 0,4 l 4,-4 M -1,1 l 2,-2 M 3,3 l 2,-2" stroke="#ef4444" strokeWidth="1"/>
                  </pattern>
                  <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="tealGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#0d9488" stopOpacity={0.6}/>
                  </linearGradient>
                  <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.6}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tick={{ fill: hoveredChart === 'activity' ? '#e2e8f0' : 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12}
                  tick={{ fill: hoveredChart === 'activity' ? '#e2e8f0' : 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: hoveredChart === 'activity' ? '#1e293b' : 'hsl(var(--popover))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: hoveredChart === 'activity' ? '#f1f5f9' : 'inherit'
                  }} 
                />
                <Legend 
                  wrapperStyle={{ 
                    paddingTop: '10px',
                    fontSize: '12px',
                    color: hoveredChart === 'activity' ? '#e2e8f0' : 'hsl(var(--muted-foreground))'
                  }}
                />
                <Bar 
                  dataKey="entities" 
                  fill="url(#greenGradient)" 
                  radius={[8, 8, 0, 0]}
                  stroke="#059669"
                  strokeWidth={1}
                  name="Active Entities"
                />
                <Bar 
                  dataKey="sessions" 
                  fill="url(#tealGradient)" 
                  radius={[8, 8, 0, 0]}
                  stroke="#0d9488"
                  strokeWidth={1}
                  name="Sessions"
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Color Legend */}
            <div className={`mt-3 flex items-center justify-center gap-4 text-xs ${
              hoveredChart === 'activity' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'url(#greenGradient)' }}></div>
                <span>Entities</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded" style={{ background: 'url(#tealGradient)' }}></div>
                <span>Sessions</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Priority Alerts */}
        <Card 
          className={`col-span-1 transition-all duration-300 ${
            hoveredChart === 'alerts' 
              ? 'scale-[1.02] bg-gradient-to-br from-slate-900/90 to-slate-800/90 shadow-2xl border-red-500/30' 
              : 'hover:shadow-lg hover:bg-slate-50/50 dark:hover:bg-slate-900/50'
          }`}
          onMouseEnter={() => setHoveredChart('alerts')}
          onMouseLeave={() => setHoveredChart(null)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className={`text-lg font-bold transition-colors flex items-center gap-2 ${
                hoveredChart === 'alerts' ? 'text-red-400' : ''
              }`}>
                <AlertTriangle className={`w-5 h-5 ${hoveredChart === 'alerts' ? 'animate-pulse' : ''}`} />
                Priority Alerts
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard/alerts')}
                className={`text-xs transition-colors ${
                  hoveredChart === 'alerts' ? 'text-sky-400 hover:text-sky-300' : ''
                }`}
              >
                View All
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
              <AnimatePresence mode="popLayout">
                {alerts.slice(0, 4).map((alert, index) => {
                  const severity = alert.severity_score >= 0.8 ? 'critical' : alert.severity_score >= 0.6 ? 'high' : 'medium';
                  const isExpanded = expandedAlert === alert.alert_id;
                  
                  return (
                    <motion.div
                      key={alert.alert_id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: index * 0.1 }}
                      layout
                    >
                      <div 
                        className={`group relative p-3 md:p-4 rounded-lg border transition-all duration-300 cursor-pointer ${
                          isExpanded
                            ? 'border-red-500/70 bg-gradient-to-r from-red-950/40 to-slate-900/40 shadow-lg'
                            : 'border-red-400/20 hover:border-red-400/40 hover:bg-slate-900/30'
                        }`}
                        onClick={() => setExpandedAlert(isExpanded ? null : alert.alert_id)}
                      >
                        {/* Alert Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                              <motion.div 
                                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                  severity === 'critical' ? 'bg-red-500' :
                                  severity === 'high' ? 'bg-orange-500' :
                                  'bg-yellow-500'
                                }`}
                                animate={{ 
                                  scale: [1, 1.3, 1],
                                  opacity: [1, 0.6, 1]
                                }}
                                transition={{ 
                                  duration: 2,
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                              />
                              <Badge 
                                variant="outline" 
                                className={`text-xs font-semibold ${
                                  severity === 'critical' ? 'border-red-500/50 text-red-300 bg-red-500/20' :
                                  severity === 'high' ? 'border-orange-500/50 text-orange-300 bg-orange-500/20' :
                                  'border-yellow-500/50 text-yellow-300 bg-yellow-500/20'
                                }`}
                              >
                                {severity === 'critical' ? 'CRITICAL' : 
                                 severity === 'high' ? 'HIGH' : 
                                 'MEDIUM'}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {alert.severity_score ? `${(alert.severity_score * 100).toFixed(0)}%` : ''}
                              </span>
                            </div>
                            <h4 className={`font-semibold text-xs md:text-sm transition-colors ${
                              isExpanded ? 'text-red-300' : 'text-white group-hover:text-red-200'
                            }`}>
                              {alert.title}
                            </h4>
                            <div className="flex items-center gap-1 md:gap-2 mt-1 text-xs text-gray-400">
                              <MapPin className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{alert.affected_zone}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              <span className="hidden sm:inline">
                                {new Date(alert.timestamp).toLocaleTimeString('en-US', { 
                                  hour: 'numeric', 
                                  minute: '2-digit' 
                                })}
                              </span>
                              <span className="sm:hidden">
                                {new Date(alert.timestamp).toLocaleTimeString('en-US', { 
                                  hour: 'numeric'
                                })}
                              </span>
                            </span>
                            <motion.div
                              animate={{ rotate: isExpanded ? 90 : 0 }}
                              transition={{ duration: 0.2 }}
                            >
                              <ChevronRight className="w-4 h-4 text-gray-400" />
                            </motion.div>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-3 pt-3 border-t border-red-500/20 space-y-2">
                                <p className="text-xs md:text-sm text-gray-300">
                                  {alert.description}
                                </p>
                                <div className="flex flex-col sm:flex-row gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 border-green-500/30 text-green-400 hover:bg-green-500/10 disabled:opacity-50 flex-1 sm:flex-initial"
                                    disabled={resolvingAlerts.has(alert.alert_id)}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResolveAlert(alert.alert_id, alert.title);
                                    }}
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    {resolvingAlerts.has(alert.alert_id) ? 'Resolving...' : 'Resolve'}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs h-7 border-sky-500/30 text-sky-400 hover:bg-sky-500/10 flex-1 sm:flex-initial"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate('/dashboard/alerts');
                                    }}
                                  >
                                    View Details
                                    <ChevronRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Hover Glow Effect */}
                        <div className={`absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none ${
                          severity === 'critical' ? 'bg-red-500/5' :
                          severity === 'high' ? 'bg-orange-500/5' :
                          'bg-yellow-500/5'
                        }`} />
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              
              {alerts.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-gray-400"
                >
                  <CheckCircle2 className="w-10 h-10 mx-auto mb-3 text-green-500/50" />
                  <p className="text-sm font-medium">All Clear!</p>
                  <p className="text-xs mt-1">No active priority alerts</p>
                </motion.div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
 
      

      {/* Bottom Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Entities */}
        <Card 
          className={`transition-all duration-300 cursor-pointer ${
            hoveredCard === 'recent-entities' 
              ? 'scale-105 bg-slate-900/80 shadow-2xl border-slate-700' 
              : 'hover:shadow-lg hover:bg-slate-50/50'
          }`}
          onMouseEnter={() => setHoveredCard('recent-entities')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className={`text-lg transition-colors ${
              hoveredCard === 'recent-entities' ? 'text-sky-400' : ''
            }`}>Recent Entities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEntities.map((entity) => (
                <div 
                  key={entity.id} 
                  className={`flex items-center justify-between p-3 rounded-lg border border-border transition-all duration-300 cursor-pointer ${
                    hoveredCard === 'recent-entities' 
                      ? 'hover:bg-slate-800/50 hover:scale-105 hover:shadow-lg' 
                      : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      hoveredCard === 'recent-entities' 
                        ? 'bg-sky-500/20 scale-110' 
                        : 'bg-primary/10'
                    }`}>
                      <Users className={`w-5 h-5 transition-colors ${
                        hoveredCard === 'recent-entities' ? 'text-sky-400' : 'text-primary'
                      }`} />
                    </div>
                    <div>
                      <p className={`font-medium transition-colors ${
                        hoveredCard === 'recent-entities' ? 'text-sky-300' : ''
                      }`}>{entity.name}</p>
                      <p className={`text-sm transition-colors ${
                        hoveredCard === 'recent-entities' ? 'text-sky-400/80' : 'text-muted-foreground'
                      }`}>{entity.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={entity.status === 'active' ? 'default' : 'secondary'}
                      className={`transition-all duration-300 ${
                        hoveredCard === 'recent-entities' ? 'scale-105' : ''
                      }`}
                    >
                      {entity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts Progress Tracker */}
        <Card 
          className={`transition-all duration-300 cursor-pointer ${
            hoveredCard === 'security-alerts' 
              ? 'scale-105 bg-slate-900/80 shadow-2xl border-slate-700' 
              : 'hover:shadow-lg hover:bg-slate-50/50'
          }`}
          onMouseEnter={() => setHoveredCard('security-alerts')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <CardHeader>
            <CardTitle className={`text-lg transition-colors ${
              hoveredCard === 'security-alerts' ? 'text-sky-400' : ''
            }`}>Security Alerts Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center space-y-4">
              {/* Semi-circular Progress Gauge */}
              <div className="relative w-48 h-32">
                <svg className="w-full h-full" viewBox="0 0 200 120" preserveAspectRatio="xMidYMid meet">
                  {/* Background Arc */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="hsl(var(--muted))"
                    strokeWidth="12"
                    strokeLinecap="round"
                  />
                  
                  {/* Completed Alerts Arc - Green */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(alertsSummary?.resolved_alerts || 0) / (alertsSummary?.total_alerts || 1) * 251.2} 251.2`}
                    strokeDashoffset="0"
                    className="transition-all duration-1000"
                    style={{
                      strokeDasharray: `${(alertsSummary?.resolved_alerts || 0) / (alertsSummary?.total_alerts || 1) * 251.2} 251.2`,
                      strokeDashoffset: '0'
                    }}
                  />
                  
                  {/* In Progress Alerts Arc - Teal */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#059669"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                    style={{
                      strokeDasharray: `${(alertsSummary?.active_alerts || 0) / (alertsSummary?.total_alerts || 1) * 251.2} 251.2`,
                      strokeDashoffset: `-${(alertsSummary?.resolved_alerts || 0) / (alertsSummary?.total_alerts || 1) * 251.2}`
                    }}
                  />
                  
                  {/* Pending Alerts Arc - Gray with pattern */}
                  <path
                    d="M 20 100 A 80 80 0 0 1 180 100"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="8,4"
                    className="transition-all duration-1000"
                    style={{
                      strokeDashoffset: `-${((alertsSummary?.resolved_alerts || 0) + (alertsSummary?.active_alerts || 0)) / (alertsSummary?.total_alerts || 1) * 251.2}`
                    }}
                  />
                </svg>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className={`text-3xl font-bold transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-400' : 'text-foreground'
                  }`}>
                    {(() => {
                      const total = alertsSummary?.total_alerts || 0;
                      const resolved = alertsSummary?.resolved_alerts || 0;
                      return total > 0 ? Math.round((resolved / total) * 100) : 0;
                    })()}%
                  </div>
                  <div className={`text-sm transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'
                  }`}>
                    Resolved
                  </div>
                </div>
              </div>
              
              {/* Legend */}
              <div className="flex items-center justify-center gap-4 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-600"></div>
                  <span className={hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'}>
                    Completed ({alertsSummary?.resolved_alerts || 0})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span className={hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'}>
                    In Progress ({alertsSummary?.active_alerts || 0})
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded" style={{ background: 'repeating-linear-gradient(45deg, #64748b, #64748b 2px, transparent 2px, transparent 4px)' }}></div>
                  <span className={hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'}>
                    Pending ({alertsSummary?.pending_alerts || 0})
                  </span>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-3 gap-4 w-full text-center">
                <div className={`p-2 rounded-lg transition-colors ${
                  hoveredCard === 'security-alerts' ? 'bg-slate-800/50' : 'bg-muted/50'
                }`}>
                  <div className={`text-lg font-bold transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-400' : 'text-foreground'
                  }`}>
                    {alertsSummary?.total_alerts || 0}
                  </div>
                  <div className={`text-xs transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'
                  }`}>
                    Total
                  </div>
                </div>
                <div className={`p-2 rounded-lg transition-colors ${
                  hoveredCard === 'security-alerts' ? 'bg-slate-800/50' : 'bg-muted/50'
                }`}>
                  <div className={`text-lg font-bold transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {alertsSummary?.resolved_alerts || 0}
                  </div>
                  <div className={`text-xs transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'
                  }`}>
                    Resolved
                  </div>
                </div>
                <div className={`p-2 rounded-lg transition-colors ${
                  hoveredCard === 'security-alerts' ? 'bg-slate-800/50' : 'bg-muted/50'
                }`}>
                  <div className={`text-lg font-bold transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-orange-400' : 'text-orange-600'
                  }`}>
                    {alertsSummary?.active_alerts || 0}
                  </div>
                  <div className={`text-xs transition-colors ${
                    hoveredCard === 'security-alerts' ? 'text-sky-300' : 'text-muted-foreground'
                  }`}>
                    Active
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
