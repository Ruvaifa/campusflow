import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Search, 
  Users, 
  MapPin, 
  Clock, 
  TrendingUp,
  Mail,
  Phone,
  Building2,
  Loader2,
  AlertCircle,
  Activity,
  Wifi,
  Calendar,
  BookOpen
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEntities, useEntityDetails } from '@/hooks/useAPI';
import { formatDistanceToNow } from 'date-fns';

const Entities = () => {
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'recent' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useMemo(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch entities with filters
  const { data: entitiesData, isLoading, error } = useEntities(
    100, 
    0, 
    statusFilter === 'all' ? undefined : statusFilter,
    debouncedSearch || undefined
  );

  // Fetch selected entity details
  const { data: entityDetails, isLoading: isLoadingDetails } = useEntityDetails(
    selectedEntityId || ''
  );

  const entities = entitiesData?.entities || [];

  // Helper function to format timestamp
  const formatTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown';
    try {
      return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // Helper function to get activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'swipe':
        return <Activity className="w-4 h-4" />;
      case 'wifi':
        return <Wifi className="w-4 h-4" />;
      case 'booking':
        return <Calendar className="w-4 h-4" />;
      case 'checkout':
        return <BookOpen className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Entity List Sidebar */}
      <div className="w-80 border-r border-border bg-card/50 overflow-y-auto">
        <div className="p-4 border-b border-border sticky top-0 bg-card/95 backdrop-blur z-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search entities..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)} className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="inactive" className="flex-1">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8 text-center">
              <div>
                <AlertCircle className="w-8 h-8 mx-auto text-destructive mb-2" />
                <p className="text-sm text-muted-foreground">Failed to load entities</p>
              </div>
            </div>
          ) : entities.length === 0 ? (
            <div className="flex items-center justify-center p-8 text-center">
              <p className="text-sm text-muted-foreground">No entities found</p>
            </div>
          ) : (
            entities.map((entity) => (
              <Card 
                key={entity.entity_id}
                className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                  selectedEntityId === entity.entity_id ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedEntityId(entity.entity_id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {entity.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{entity.name}</p>
                        <Badge 
                          variant={entity.status === 'active' ? 'default' : entity.status === 'recent' ? 'secondary' : 'outline'} 
                          className="text-xs"
                        >
                          {entity.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{entity.role}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(entity.last_seen)}
                        </span>
                        <span>{(entity.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Entity Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedEntityId && entityDetails ? (
          <div className="p-6">
            {isLoadingDetails ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Header */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-20 h-20">
                          <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                            {entityDetails.profile.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-2xl font-bold">{entityDetails.profile.name}</h2>
                          <p className="text-muted-foreground mt-1">{entityDetails.profile.role}</p>
                          <div className="flex items-center gap-4 mt-3">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building2 className="w-3 h-3" />
                              {entityDetails.profile.department}
                            </Badge>
                            <Badge variant={entityDetails.status === 'active' ? 'default' : entityDetails.status === 'recent' ? 'secondary' : 'outline'}>
                              {entityDetails.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Cards */}
                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        General Details
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Email</span>
                          <span className="font-medium text-sm">{entityDetails.profile.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Entity ID</span>
                          <span className="font-medium text-sm font-mono">{entityDetails.profile.entity_id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Department</span>
                          <span className="font-medium">{entityDetails.profile.department}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Role</span>
                          <span className="font-medium">{entityDetails.profile.role}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Activity Summary (7 days)
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Activity className="w-3 h-3" />
                            Swipes
                          </span>
                          <span className="font-medium">{entityDetails.activity_summary.swipes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Wifi className="w-3 h-3" />
                            WiFi Connections
                          </span>
                          <span className="font-medium">{entityDetails.activity_summary.wifi_connections}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <Calendar className="w-3 h-3" />
                            Lab Bookings
                          </span>
                          <span className="font-medium">{entityDetails.activity_summary.lab_bookings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground flex items-center gap-2">
                            <BookOpen className="w-3 h-3" />
                            Library Checkouts
                          </span>
                          <span className="font-medium">{entityDetails.activity_summary.library_checkouts}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Location Card */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Current Location
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Location</span>
                        <span className="font-medium">{entityDetails.last_location || 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen</span>
                        <span className="font-medium">{formatTime(entityDetails.last_seen)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={entityDetails.status === 'active' ? 'default' : entityDetails.status === 'recent' ? 'secondary' : 'outline'}>
                          {entityDetails.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Activity Timeline
                    </h3>
                    {entityDetails.recent_activities.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">No recent activities</p>
                    ) : (
                      <div className="space-y-4">
                        {entityDetails.recent_activities.map((activity, index) => (
                          <div key={index} className="flex gap-4">
                            <div className="flex flex-col items-center">
                              <div className={`w-2 h-2 rounded-full ${
                                activity.type === 'swipe' ? 'bg-chart-1' :
                                activity.type === 'wifi' ? 'bg-chart-2' :
                                activity.type === 'booking' ? 'bg-chart-3' :
                                'bg-chart-4'
                              }`} />
                              {index !== entityDetails.recent_activities.length - 1 && (
                                <div className="w-px h-full bg-border mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-4">
                              <div className="flex items-center justify-between">
                                <p className="font-medium flex items-center gap-2">
                                  {getActivityIcon(activity.type)}
                                  {activity.details}
                                </p>
                                <span className="text-sm text-muted-foreground">
                                  {formatTime(activity.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {activity.location}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Entity Selected</h3>
              <p className="text-muted-foreground">
                Select an entity from the list to view details
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Entities;
