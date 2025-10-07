import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  AlertCircle,
  TrendingUp,
  Link2,
  Database,
  Brain,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

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

interface Provenance {
  entity_id: string;
  name: string;
  data_sources: string[];
  identifier_sources: Record<string, any>;
  activity_sources: Record<string, any>;
}

interface CrossSourceLink {
  type: string;
  identifier: string;
  source_table: string;
  target_table: string;
  record_count: number;
  confidence: number;
}

interface LocationPrediction {
  location: string;
  probability: number;
  confidence: string;
  evidence: string[];
  methods_used: string[];
}

interface Anomaly {
  type: string;
  severity: string;
  description: string;
  evidence: string;
  explanation: string;
}

interface Inference {
  field: string;
  inferred_value: any;
  confidence: number;
  method: string;
  evidence: string;
}

const Entities = () => {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [entityTimeline, setEntityTimeline] = useState<EntityTimeline | null>(null);
  const [provenance, setProvenance] = useState<Provenance | null>(null);
  const [crossSourceLinks, setCrossSourceLinks] = useState<{ linkages: CrossSourceLink[]; overall_confidence: number } | null>(null);
  const [predictions, setPredictions] = useState<{ predicted_next_locations: LocationPrediction[] } | null>(null);
  const [anomalies, setAnomalies] = useState<{ anomalies: Anomaly[]; anomalies_detected: number } | null>(null);
  const [inferences, setInferences] = useState<{ inferences: Inference[] } | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [advancedLoading, setAdvancedLoading] = useState(false);
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

  const fetchAdvancedData = async (entityId: string) => {
    try {
      setAdvancedLoading(true);
      
      // Fetch all advanced features in parallel
      const [provenanceRes, linksRes, predictionsRes, anomaliesRes, inferencesRes] = await Promise.all([
        fetch(`http://localhost:8000/api/entities/${entityId}/provenance`),
        fetch(`http://localhost:8000/api/entities/${entityId}/cross-source-links`),
        fetch(`http://localhost:8000/api/entities/${entityId}/predict-location`),
        fetch(`http://localhost:8000/api/entities/${entityId}/detect-anomalies`),
        fetch(`http://localhost:8000/api/entities/${entityId}/infer-missing-data`)
      ]);
      
      if (provenanceRes.ok) {
        const data = await provenanceRes.json();
        setProvenance(data);
      }
      
      if (linksRes.ok) {
        const data = await linksRes.json();
        setCrossSourceLinks(data);
      }
      
      if (predictionsRes.ok) {
        const data = await predictionsRes.json();
        setPredictions(data);
      }
      
      if (anomaliesRes.ok) {
        const data = await anomaliesRes.json();
        setAnomalies(data);
      }
      
      if (inferencesRes.ok) {
        const data = await inferencesRes.json();
        setInferences(data);
      }
    } catch (error) {
      console.error('Error fetching advanced data:', error);
    } finally {
      setAdvancedLoading(false);
    }
  };

  const handleEntitySelect = (entity: Entity) => {
    setSelectedEntity(entity);
    fetchEntityTimeline(entity.entity_id);
    fetchAdvancedData(entity.entity_id);
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

            {/* Advanced Features Tabs */}
            <Tabs defaultValue="timeline" className="w-full">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="timeline">Timeline</TabsTrigger>
                <TabsTrigger value="provenance">Provenance</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
                <TabsTrigger value="predictions">Predictions</TabsTrigger>
                <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
                <TabsTrigger value="inferences">Inferences</TabsTrigger>
              </TabsList>

              {/* Timeline Tab */}
              <TabsContent value="timeline">
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
          </TabsContent>

              {/* Provenance Tab */}
              <TabsContent value="provenance">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5" />
                      Data Provenance & Sources
                    </CardTitle>
                    <CardDescription>
                      Track which data sources contributed to this entity profile
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {advancedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : provenance ? (
                      <div className="space-y-6">
                        {/* Data Sources */}
                        <div>
                          <h4 className="font-semibold mb-3">Data Sources</h4>
                          <div className="flex flex-wrap gap-2">
                            {provenance.data_sources.map((source, idx) => (
                              <Badge key={idx} variant="outline" className="text-sm">
                                {source}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Identifier Sources */}
                        <div>
                          <h4 className="font-semibold mb-3">Identifier Sources</h4>
                          <div className="space-y-3">
                            {Object.entries(provenance.identifier_sources).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                                <div>
                                  <p className="font-medium capitalize">{key.replace('_', ' ')}</p>
                                  <p className="text-sm text-muted-foreground">{value.value}</p>
                                </div>
                                <div className="text-right">
                                  <Badge variant={value.confidence === 'high' ? 'default' : 'secondary'}>
                                    {value.confidence}
                                  </Badge>
                                  <p className="text-xs text-muted-foreground mt-1">{value.source}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Activity Sources */}
                        <div>
                          <h4 className="font-semibold mb-3">Activity Sources (Last 30 Days)</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {Object.entries(provenance.activity_sources).map(([key, value]: [string, any]) => (
                              <Card key={key}>
                                <CardContent className="p-4">
                                  <p className="text-sm text-muted-foreground capitalize">{key.replace('_', ' ')}</p>
                                  <p className="text-2xl font-bold mt-1">{value.count}</p>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No provenance data available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cross-Source Links Tab */}
              <TabsContent value="links">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Link2 className="w-5 h-5" />
                      Cross-Source Linkages
                    </CardTitle>
                    <CardDescription>
                      How records are connected across different data tables
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {advancedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : crossSourceLinks && crossSourceLinks.linkages.length > 0 ? (
                      <div className="space-y-4">
                        {/* Overall Confidence */}
                        <div className="p-4 bg-primary/10 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold">Overall Link Confidence</span>
                            <span className="text-2xl font-bold">{(crossSourceLinks.overall_confidence * 100).toFixed(0)}%</span>
                          </div>
                          <Progress value={crossSourceLinks.overall_confidence * 100} className="h-2" />
                        </div>

                        {/* Linkages */}
                        {crossSourceLinks.linkages.map((link, idx) => (
                          <Card key={idx} className="border-2">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <Badge variant="outline" className="mb-2">
                                    {link.type.replace('_', ' → ')}
                                  </Badge>
                                  <p className="font-medium">{link.identifier}</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {link.source_table} → {link.target_table}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    <span className="font-bold">{(link.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {link.record_count} records
                                  </p>
                                </div>
                              </div>
                              <Progress value={link.confidence * 100} className="h-1" />
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No cross-source links available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Predictions Tab */}
              <TabsContent value="predictions">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Location Predictions (ML-Based)
                    </CardTitle>
                    <CardDescription>
                      Predicted next locations with evidence and confidence scores
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {advancedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : predictions && predictions.predicted_next_locations.length > 0 ? (
                      <div className="space-y-4">
                        {predictions.predicted_next_locations.map((pred, idx) => (
                          <Card key={idx} className={idx === 0 ? 'border-2 border-primary' : ''}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <MapPin className="w-4 h-4" />
                                    <span className="font-bold text-lg">{pred.location}</span>
                                    {idx === 0 && <Badge>Most Likely</Badge>}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={
                                      pred.confidence === 'high' ? 'default' : 
                                      pred.confidence === 'medium' ? 'secondary' : 'outline'
                                    }>
                                      {pred.confidence} confidence
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      {(pred.probability * 100).toFixed(0)}% probability
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <Progress value={pred.probability * 100} className="h-2 mb-3" />
                              
                              {/* Evidence */}
                              <div className="space-y-2">
                                <p className="text-sm font-semibold">Evidence:</p>
                                {pred.evidence.map((ev, evidx) => (
                                  <div key={evidx} className="flex items-start gap-2 text-sm">
                                    <Info className="w-3 h-3 mt-0.5 text-muted-foreground" />
                                    <span className="text-muted-foreground">{ev}</span>
                                  </div>
                                ))}
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {pred.methods_used.map((method, midx) => (
                                    <Badge key={midx} variant="outline" className="text-xs">
                                      {method.replace('_', ' ')}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Insufficient data for predictions
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Anomalies Tab */}
              <TabsContent value="anomalies">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Anomaly Detection
                    </CardTitle>
                    <CardDescription>
                      Detected unusual patterns with statistical evidence
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {advancedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : anomalies && anomalies.anomalies_detected > 0 ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-orange-500/10 rounded-lg">
                          <p className="font-semibold">
                            {anomalies.anomalies_detected} anomalies detected
                          </p>
                        </div>

                        {anomalies.anomalies.map((anomaly, idx) => (
                          <Card key={idx} className="border-l-4 border-l-orange-500">
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <Badge variant={
                                    anomaly.severity === 'high' ? 'destructive' :
                                    anomaly.severity === 'medium' ? 'default' : 'secondary'
                                  }>
                                    {anomaly.severity} severity
                                  </Badge>
                                  <p className="font-semibold mt-2">{anomaly.description}</p>
                                </div>
                                <AlertTriangle className={`w-5 h-5 ${
                                  anomaly.severity === 'high' ? 'text-red-500' :
                                  anomaly.severity === 'medium' ? 'text-orange-500' : 'text-yellow-500'
                                }`} />
                              </div>
                              
                              <div className="space-y-2 mt-3">
                                <div className="flex items-start gap-2 text-sm">
                                  <Info className="w-3 h-3 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Evidence:</p>
                                    <p className="text-muted-foreground">{anomaly.evidence}</p>
                                  </div>
                                </div>
                                <div className="flex items-start gap-2 text-sm">
                                  <Brain className="w-3 h-3 mt-0.5" />
                                  <div>
                                    <p className="font-medium">Explanation:</p>
                                    <p className="text-muted-foreground">{anomaly.explanation}</p>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-2" />
                        <p className="font-semibold">No anomalies detected</p>
                        <p className="text-sm text-muted-foreground">All patterns appear normal</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Inferences Tab */}
              <TabsContent value="inferences">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Missing Data Inference
                    </CardTitle>
                    <CardDescription>
                      ML-based inference for missing data points with justification
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {advancedLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      </div>
                    ) : inferences && inferences.inferences.length > 0 ? (
                      <div className="space-y-4">
                        {inferences.inferences.map((inference, idx) => (
                          <Card key={idx}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                  <p className="text-sm text-muted-foreground capitalize">
                                    {inference.field.replace('_', ' ')}
                                  </p>
                                  <p className="font-semibold text-lg mt-1">
                                    {Array.isArray(inference.inferred_value) 
                                      ? inference.inferred_value.join(', ')
                                      : inference.inferred_value
                                    }
                                  </p>
                                </div>
                                <div className="text-right">
                                  <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" />
                                    <span className="font-bold">{(inference.confidence * 100).toFixed(0)}%</span>
                                  </div>
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    {inference.method.replace('_', ' ')}
                                  </Badge>
                                </div>
                              </div>
                              
                              <Progress value={inference.confidence * 100} className="h-2 mb-3" />
                              
                              <div className="flex items-start gap-2 text-sm">
                                <Info className="w-3 h-3 mt-0.5 text-muted-foreground" />
                                <p className="text-muted-foreground">{inference.evidence}</p>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        No inferences available
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
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
