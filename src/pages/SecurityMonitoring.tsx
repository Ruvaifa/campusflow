import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Shield, 
  AlertTriangle, 
  Search,
  Clock,
  MapPin,
  Activity,
  TrendingUp,
  Users,
  Eye,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const SecurityMonitoring = () => {
  const [assetType, setAssetType] = useState('all');
  const [timeRange, setTimeRange] = useState('today');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<string | null>(null);
  const [entityHistory, setEntityHistory] = useState<any>(null);
  const [inactiveEntities, setInactiveEntities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [filteredProfiles, setFilteredProfiles] = useState<any[]>([]);
  const [useMockData, setUseMockData] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  // Mock data for demonstration
  const mockProfiles = [
    { entity_id: 'ENT001', name: 'John Smith', email: 'john.smith@iitg.ac.in', department: 'CSE' },
    { entity_id: 'ENT002', name: 'Sarah Johnson', email: 'sarah.johnson@iitg.ac.in', department: 'ECE' },
    { entity_id: 'ENT003', name: 'Michael Chen', email: 'michael.chen@iitg.ac.in', department: 'ME' },
    { entity_id: 'ENT004', name: 'Emily Davis', email: 'emily.davis@iitg.ac.in', department: 'CE' },
    { entity_id: 'ENT005', name: 'David Wilson', email: 'david.wilson@iitg.ac.in', department: 'CSE' },
    { entity_id: 'ENT006', name: 'Lisa Brown', email: 'lisa.brown@iitg.ac.in', department: 'ECE' },
    { entity_id: 'ENT007', name: 'James Taylor', email: 'james.taylor@iitg.ac.in', department: 'ME' },
    { entity_id: 'ENT008', name: 'Anna Garcia', email: 'anna.garcia@iitg.ac.in', department: 'CE' },
  ];

  const mockInactiveEntities = [
    {
      entity_id: 'ENT009',
      name: 'Robert Miller',
      email: 'robert.miller@iitg.ac.in',
      alert_severity: 'high',
      hours_inactive: 15,
      last_seen: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      last_location: 'Library Building'
    },
    {
      entity_id: 'ENT010',
      name: 'Jennifer Lee',
      email: 'jennifer.lee@iitg.ac.in',
      alert_severity: 'medium',
      hours_inactive: 8,
      last_seen: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      last_location: 'Lab Complex'
    }
  ];

  const mockEntityHistory = {
    total_activities: 47,
    activities: [
      {
        type: 'swipe',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        location: 'Main Building Entrance',
        details: { card_id: 'CARD123', access_granted: true }
      },
      {
        type: 'wifi',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        location: 'Library Building',
        details: { device: 'iPhone 14', duration: '2h 15m' }
      },
      {
        type: 'swipe',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        location: 'Cafeteria',
        details: { card_id: 'CARD123', transaction_amount: 45.50 }
      },
      {
        type: 'lab_booking',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        location: 'Computer Lab 3',
        details: { session_duration: '3h', equipment_used: 'Workstation 15' }
      },
      {
        type: 'library',
        timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        location: 'Central Library',
        details: { book_checked_out: 'Data Structures', return_date: '2024-02-15' }
      },
      {
        type: 'wifi',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        location: 'Student Center',
        details: { device: 'MacBook Pro', duration: '1h 30m' }
      },
      {
        type: 'swipe',
        timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000).toISOString(),
        location: 'Gymnasium',
        details: { card_id: 'CARD123', access_granted: true }
      },
      {
        type: 'lab_booking',
        timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
        location: 'Physics Lab',
        details: { session_duration: '2h', equipment_used: 'Oscilloscope 3' }
      },
      {
        type: 'library',
        timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString(),
        location: 'Central Library',
        details: { book_checked_out: 'Machine Learning', return_date: '2024-02-20' }
      },
      {
        type: 'swipe',
        timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        location: 'Dormitory Building A',
        details: { card_id: 'CARD123', access_granted: true }
      }
    ]
  };

  // Mock data for enhanced charts
  const mockActivityTrends = [
    { day: 'Mon', critical: 3, high: 8, medium: 12, low: 5 },
    { day: 'Tue', critical: 2, high: 6, medium: 15, low: 8 },
    { day: 'Wed', critical: 4, high: 10, medium: 18, low: 6 },
    { day: 'Thu', critical: 1, high: 5, medium: 14, low: 9 },
    { day: 'Fri', critical: 5, high: 12, medium: 20, low: 10 },
    { day: 'Sat', critical: 2, high: 4, medium: 8, low: 4 },
    { day: 'Sun', critical: 1, high: 3, medium: 6, low: 3 },
  ];

  const mockActivityCategories = [
    { name: 'Access Control', count: 15 },
    { name: 'WiFi Connections', count: 12 },
    { name: 'Lab Bookings', count: 8 },
    { name: 'Library Activity', count: 7 },
    { name: 'Location Tracking', count: 5 },
  ];

  // Fetch profiles for search
  useEffect(() => {
    const fetchProfiles = async () => {
      if (useMockData) {
        setProfiles(mockProfiles);
        setFilteredProfiles(mockProfiles);
        return;
      }
      
      try {
        const response = await fetch(`${API_URL}/api/profiles?limit=100`);
        const data = await response.json();
        setProfiles(data);
        setFilteredProfiles(data);
      } catch (error) {
        console.error('Error fetching profiles:', error);
        // Fallback to mock data
        setProfiles(mockProfiles);
        setFilteredProfiles(mockProfiles);
      }
    };
    fetchProfiles();
  }, [useMockData]);

  // Filter profiles based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProfiles(profiles);
    } else {
      const filtered = profiles.filter(profile => 
        profile.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.entity_id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProfiles(filtered);
    }
  }, [searchQuery, profiles]);

  // Fetch inactive entities on mount and every 5 minutes
  useEffect(() => {
    fetchInactiveEntities();
    const interval = setInterval(fetchInactiveEntities, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, [useMockData]);

  const fetchInactiveEntities = async () => {
    if (useMockData) {
      setInactiveEntities(mockInactiveEntities);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/security/inactive-entities?hours=12&limit=50`);
      const data = await response.json();
      setInactiveEntities(data.inactive_entities || []);
    } catch (error) {
      console.error('Error fetching inactive entities:', error);
      // Fallback to mock data
      setInactiveEntities(mockInactiveEntities);
    }
  };

  const fetchEntityHistory = async (entityId: string) => {
    setLoading(true);
    
    if (useMockData) {
      // Simulate loading delay
      setTimeout(() => {
        setEntityHistory(mockEntityHistory);
        setSelectedEntity(entityId);
        setLoading(false);
      }, 500);
      return;
    }
    
    try {
      const response = await fetch(
        `${API_URL}/api/security/entity-history?entity_id=${entityId}&asset_type=${assetType}&time_range=${timeRange}`
      );
      const data = await response.json();
      setEntityHistory(data);
      setSelectedEntity(entityId);
    } catch (error) {
      console.error('Error fetching entity history:', error);
      // Fallback to mock data
      setEntityHistory(mockEntityHistory);
      setSelectedEntity(entityId);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (filteredProfiles.length > 0) {
      fetchEntityHistory(filteredProfiles[0].entity_id);
    }
  };

  const handleRefresh = () => {
    if (selectedEntity) {
      fetchEntityHistory(selectedEntity);
    }
    fetchInactiveEntities();
  };

  // Stats for the dashboard
  const stats = [
    {
      title: 'Inactive Alerts',
      value: inactiveEntities.length.toString(),
      change: 'Last 12 hours',
      icon: AlertTriangle,
      color: 'text-destructive',
      bgColor: 'bg-destructive/10'
    },
    {
      title: 'Monitored Entities',
      value: profiles.length.toString(),
      change: 'Total active',
      icon: Users,
      color: 'text-chart-1',
      bgColor: 'bg-chart-1/10'
    },
    {
      title: 'Activities Today',
      value: entityHistory?.total_activities?.toString() || '0',
      change: 'Selected entity',
      icon: Activity,
      color: 'text-chart-2',
      bgColor: 'bg-chart-2/10'
    },
    {
      title: 'System Status',
      value: useMockData ? 'Demo Mode' : 'Active',
      change: useMockData ? 'Using mock data' : 'All systems operational',
      icon: Shield,
      color: useMockData ? 'text-warning' : 'text-success',
      bgColor: useMockData ? 'bg-warning/10' : 'bg-success/10'
    },
  ];

  // Activity type distribution
  const getActivityDistribution = () => {
    if (!entityHistory?.activities) return [];
    
    const distribution: { [key: string]: number } = {};
    entityHistory.activities.forEach((activity: any) => {
      distribution[activity.type] = (distribution[activity.type] || 0) + 1;
    });

    return Object.entries(distribution).map(([type, count]) => ({
      name: type.replace('_', ' ').toUpperCase(),
      value: count,
      color: type === 'swipe' ? 'hsl(var(--chart-1))' :
             type === 'wifi' ? 'hsl(var(--chart-2))' :
             type === 'lab_booking' ? 'hsl(var(--chart-3))' :
             type === 'library' ? 'hsl(var(--chart-4))' :
             'hsl(var(--chart-5))'
    }));
  };

  // Hourly activity chart
  const getHourlyActivity = () => {
    if (!entityHistory?.activities) return [];
    
    const hourly: { [key: number]: number } = {};
    for (let i = 0; i < 24; i++) hourly[i] = 0;

    entityHistory.activities.forEach((activity: any) => {
      const hour = new Date(activity.timestamp).getHours();
      hourly[hour]++;
    });

    return Object.entries(hourly).map(([hour, count]) => ({
      hour: `${hour.padStart(2, '0')}:00`,
      activities: count
    }));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Security & Monitoring</h1>
          <p className="text-muted-foreground mt-1">
            Query entity history and monitor inactive assets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setUseMockData(!useMockData)} 
            variant={useMockData ? "default" : "outline"} 
            size="sm"
          >
            {useMockData ? "Mock Data" : "Real Data"}
          </Button>
          {useMockData && (
            <Button 
              onClick={() => fetchEntityHistory('ENT001')} 
              variant="secondary" 
              size="sm"
            >
              Demo Query
            </Button>
          )}
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-200 hover:scale-105">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold mt-2 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-4 rounded-xl ${stat.bgColor} shadow-sm`}>
                  <stat.icon className={`w-7 h-7 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Analytics Charts */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Activity Trends */}
        <Card className="col-span-2 hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Activity Trends (7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockActivityTrends}>
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
                <Line type="monotone" dataKey="critical" stroke="hsl(var(--destructive))" strokeWidth={3} name="Critical" />
                <Line type="monotone" dataKey="high" stroke="hsl(var(--warning))" strokeWidth={3} name="High" />
                <Line type="monotone" dataKey="medium" stroke="hsl(var(--chart-3))" strokeWidth={3} name="Medium" />
                <Line type="monotone" dataKey="low" stroke="hsl(var(--chart-4))" strokeWidth={3} name="Low" />
              </LineChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive"></div>
                <span>Critical</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-warning"></div>
                <span>High</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-3"></div>
                <span>Medium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-chart-4"></div>
                <span>Low</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity Categories */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Activity Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockActivityCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
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

      {/* Query Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Entity Query Interface
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {/* Asset Type Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Asset Type</label>
              <Select value={assetType} onValueChange={setAssetType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Systems</SelectItem>
                  <SelectItem value="swipe">Card Swipes</SelectItem>
                  <SelectItem value="wifi">WiFi Logs</SelectItem>
                  <SelectItem value="lab">Lab Bookings</SelectItem>
                  <SelectItem value="library">Library Checkouts</SelectItem>
                  <SelectItem value="cctv">CCTV Frames</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time Range Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Range</label>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="24h">Last 24 Hours</SelectItem>
                  <SelectItem value="7d">Last 7 Days</SelectItem>
                  <SelectItem value="30d">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Entity Search */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium">Entity ID / Name</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, or entity ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {searchQuery && filteredProfiles.length > 0 && (
            <div className="mt-4 border rounded-lg p-2 max-h-48 overflow-y-auto">
              {filteredProfiles.slice(0, 10).map((profile) => (
                <div
                  key={profile.entity_id}
                  className="p-2 hover:bg-muted rounded cursor-pointer flex items-center justify-between"
                  onClick={() => {
                    setSearchQuery(profile.name);
                    fetchEntityHistory(profile.entity_id);
                  }}
                >
                  <div>
                    <p className="font-medium text-sm">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {profile.entity_id} • {profile.email}
                    </p>
                  </div>
                  <Badge variant="outline">{profile.department}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entity History Display */}
      {loading && (
        <Card>
          <CardContent className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-muted-foreground mt-4">Loading entity history...</p>
          </CardContent>
        </Card>
      )}

      {entityHistory && !loading && (
        <>
          {/* Enhanced Activity Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Activity Distribution */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Activity Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={getActivityDistribution()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={90}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getActivityDistribution().map((entry, index) => (
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
              </CardContent>
            </Card>

            {/* Hourly Activity */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hourly Activity Pattern
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={getHourlyActivity()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar dataKey="activities" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Complete Activity Timeline */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  Complete Activity History
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({entityHistory.total_activities} activities)
                  </span>
                </CardTitle>
                <Button variant="outline" size="sm" className="hover:bg-muted">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {entityHistory.activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No activities found for the selected time range</p>
                  </div>
                ) : (
                  entityHistory.activities.map((activity: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                    >
                      <div className={`mt-0.5 p-2 rounded-lg ${
                        activity.type === 'swipe' ? 'bg-chart-1/10 text-chart-1' :
                        activity.type === 'wifi' ? 'bg-chart-2/10 text-chart-2' :
                        activity.type === 'lab_booking' ? 'bg-chart-3/10 text-chart-3' :
                        activity.type === 'library' ? 'bg-chart-4/10 text-chart-4' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {activity.type === 'swipe' && <Shield className="w-4 h-4" />}
                        {activity.type === 'wifi' && <Activity className="w-4 h-4" />}
                        {activity.type === 'lab_booking' && <Clock className="w-4 h-4" />}
                        {activity.type === 'library' && <Eye className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {activity.type.replace('_', ' ').toUpperCase()}
                              </Badge>
                              <p className="text-sm font-medium">
                                {new Date(activity.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span>{activity.location}</span>
                            </div>
                          </div>
                        </div>
                        {activity.details && (
                          <div className="mt-2 text-xs text-muted-foreground">
                            {Object.entries(activity.details).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Inactive Entities Alert */}
      <Card className="border-destructive/50 hover:shadow-lg transition-shadow">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Inactive Entity Alerts (12+ Hours)
            <Badge variant="destructive" className="ml-2">
              {inactiveEntities.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {inactiveEntities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No inactive entities detected</p>
              <p className="text-sm mt-1">All monitored entities have recent activity</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {inactiveEntities.map((entity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors"
                >
                  <div className="mt-0.5 p-2 rounded-lg bg-destructive/10 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="text-xs">
                            {entity.alert_severity.toUpperCase()}
                          </Badge>
                          <p className="font-semibold">{entity.name}</p>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {entity.entity_id} • {entity.email}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fetchEntityHistory(entity.entity_id)}
                      >
                        View History
                      </Button>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Inactive: {entity.hours_inactive}h</span>
                      </div>
                      {entity.last_seen && (
                        <>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            <span>Last: {entity.last_location}</span>
                          </div>
                          <span>
                            {new Date(entity.last_seen).toLocaleString()}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityMonitoring;
