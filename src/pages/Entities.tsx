import { useState, useEffect } from 'react';
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
  Mail,
  Building2,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

interface Entity {
  entity_id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  student_id?: string;
  current_location: string;
  last_seen: string;
  activity_count: number;
}

interface TimelineActivity {
  timestamp: string;
  location: string;
  detection_type: string;
  description: string;
}

interface EntityTimeline {
  entity_id: string;
  current_location: string;
  last_seen: string;
  activities: TimelineActivity[];
}

const Entities = () => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityTimeline, setEntityTimeline] = useState<EntityTimeline | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch entities on component mount
  useEffect(() => {
    fetchEntities();
  }, [searchQuery]);

  const fetchEntities = async () => {
    try {
      setLoading(true);
      const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : '';
      const response = await fetch(`http://localhost:8000/api/entities-with-timeline?limit=50${searchParam}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch entities');
      }
      
      const data = await response.json();
      setEntities(data.entities || []);
    } catch (error) {
      console.error('Error fetching entities:', error);
      toast({
        title: 'Error',
        description: 'Failed to load entities. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEntityTimeline = async (entityId: string) => {
    try {
      setTimelineLoading(true);
      const response = await fetch(`http://localhost:8000/api/entities/${entityId}/timeline`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch timeline');
      }
      
      const data = await response.json();
      setEntityTimeline(data);
    } catch (error) {
      console.error('Error fetching timeline:', error);
      toast({
        title: 'Error',
        description: 'Failed to load timeline data.',
        variant: 'destructive',
      });
      setEntityTimeline(null);
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    fetchEntityTimeline(entity.entity_id);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} mins ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatTimelineTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const getDetectionTypeColor = (type: string) => {
    switch (type) {
      case 'swipes':
        return 'bg-chart-1';
      case 'wifi_logs':
        return 'bg-chart-2';
      case 'lab_bookings':
        return 'bg-chart-3';
      case 'library_checkouts':
        return 'bg-chart-4';
      case 'cctv_frame':
        return 'bg-chart-5';
      default:
        return 'bg-muted';
    }
  };

  const getStatusFromLastSeen = (lastSeen: string) => {
    if (!lastSeen) return 'inactive';
    const date = new Date(lastSeen);
    const now = new Date();
    const diffHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffHours < 1) return 'active';
    if (diffHours < 24) return 'recent';
    return 'inactive';
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
          <div className="mt-4 text-sm text-muted-foreground">
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading entities...
              </div>
            ) : (
              <span>{entities.length} entities found</span>
            )}
          </div>
        </div>

        <div className="p-2">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : entities.length === 0 ? (
            <div className="text-center py-8 px-4">
              <AlertCircle className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No entities found</p>
            </div>
          ) : (
            entities.map((entity) => {
              const status = getStatusFromLastSeen(entity.last_seen);
              return (
                <Card 
                  key={entity.entity_id}
                  className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                    selectedEntity?.entity_id === entity.entity_id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => handleEntitySelect(entity)}
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
                            variant={status === 'active' ? 'default' : status === 'recent' ? 'secondary' : 'outline'} 
                            className="text-xs"
                          >
                            {status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">{entity.role}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {entity.last_seen ? formatTimestamp(entity.last_seen) : 'N/A'}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {entity.current_location}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Entity Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedEntity ? (
          <div className="p-6">
            {/* Header */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                        {selectedEntity.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h2 className="text-2xl font-bold">{selectedEntity.name}</h2>
                      <p className="text-muted-foreground mt-1">{selectedEntity.role}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {selectedEntity.department}
                        </Badge>
                        <Badge variant={getStatusFromLastSeen(selectedEntity.last_seen) === 'active' ? 'default' : 'secondary'}>
                          {getStatusFromLastSeen(selectedEntity.last_seen)}
                        </Badge>
                        {selectedEntity.student_id && (
                          <Badge variant="outline">
                            ID: {selectedEntity.student_id}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Entity ID</p>
                    <p className="font-mono text-sm">{selectedEntity.entity_id}</p>
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
                      <span className="font-medium text-sm">{selectedEntity.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{selectedEntity.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Role</span>
                      <span className="font-medium capitalize">{selectedEntity.role}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Activities</span>
                      <span className="font-medium">{selectedEntity.activity_count}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Current Location
                  </h3>
                  {timelineLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : entityTimeline ? (
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Location</span>
                        <span className="font-medium">{entityTimeline.current_location}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last Seen</span>
                        <span className="font-medium">
                          {entityTimeline.last_seen ? formatTimestamp(entityTimeline.last_seen) : 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={getStatusFromLastSeen(entityTimeline.last_seen) === 'active' ? 'default' : 'secondary'}>
                          {getStatusFromLastSeen(entityTimeline.last_seen)}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Timeline Events</span>
                        <span className="font-medium">{entityTimeline.activities.length}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">
                      No location data available
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Timeline */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Activity Timeline
                </h3>
                {timelineLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : entityTimeline && entityTimeline.activities.length > 0 ? (
                  <div className="space-y-4">
                    {entityTimeline.activities.slice(0, 20).map((activity, index) => (
                      <div key={index} className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${getDetectionTypeColor(activity.detection_type)}`} />
                          {index !== Math.min(entityTimeline.activities.length - 1, 19) && (
                            <div className="w-px h-full bg-border mt-1" />
                          )}
                        </div>
                        <div className="flex-1 pb-4">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{activity.description}</p>
                            <span className="text-sm text-muted-foreground">
                              {formatTimelineTime(activity.timestamp)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">{activity.location}</p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatTimestamp(activity.timestamp)} • {activity.detection_type.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                    ))}
                    {entityTimeline.activities.length > 20 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-muted-foreground">
                          Showing 20 of {entityTimeline.activities.length} activities
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No timeline data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
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
