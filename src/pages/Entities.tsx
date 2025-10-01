import { useState } from 'react';
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
  Building2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Entities = () => {
  const [selectedEntity, setSelectedEntity] = useState<any>(null);

  const entities = [
    { 
      id: 1, 
      name: 'Leslie Alexander', 
      role: 'Design Lead', 
      department: 'Engineering',
      status: 'active', 
      confidence: 0.94,
      lastSeen: '5 mins ago',
      location: 'Building A - Lab 2',
      email: 'leslie.alexander@campus.edu',
      phone: '(555) 123-4567'
    },
    { 
      id: 2, 
      name: 'Brooklyn Simmons', 
      role: 'UI/UX Designer', 
      department: 'Design',
      status: 'active', 
      confidence: 0.89,
      lastSeen: '12 mins ago',
      location: 'Library',
      email: 'brooklyn.simmons@campus.edu',
      phone: '(555) 234-5678'
    },
    { 
      id: 3, 
      name: 'Dianne Russell', 
      role: 'Employee', 
      department: 'Administration',
      status: 'inactive', 
      confidence: 0.76,
      lastSeen: '2 hours ago',
      location: 'Main Building',
      email: 'dianne.russell@campus.edu',
      phone: '(555) 345-6789'
    },
    { 
      id: 4, 
      name: 'Jenny Wilson', 
      role: 'UI/UX Designer', 
      department: 'Design',
      status: 'active', 
      confidence: 0.91,
      lastSeen: '8 mins ago',
      location: 'Building C - Office 3',
      email: 'jenny.wilson@campus.edu',
      phone: '(555) 456-7890'
    },
  ];

  const timeline = [
    { time: '09:15 AM', event: 'Card swipe', location: 'Main Entrance', type: 'swipe' },
    { time: '09:18 AM', event: 'Wi-Fi connection', location: 'Building A - Lab 2', type: 'wifi' },
    { time: '10:30 AM', event: 'Room booking', location: 'Meeting Room 3', type: 'booking' },
    { time: '11:45 AM', event: 'CCTV detection', location: 'Cafeteria', type: 'cctv' },
    { time: '02:20 PM', event: 'Card swipe', location: 'Library', type: 'swipe' },
  ];

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
            />
          </div>
          <Tabs defaultValue="all" className="mt-4">
            <TabsList className="w-full">
              <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
              <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
              <TabsTrigger value="new" className="flex-1">New</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="p-2">
          {entities.map((entity) => (
            <Card 
              key={entity.id}
              className={`mb-2 cursor-pointer transition-all hover:shadow-md ${
                selectedEntity?.id === entity.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedEntity(entity)}
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
                      <Badge variant={entity.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {entity.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">{entity.role}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {entity.lastSeen}
                      </span>
                      <span>{(entity.confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
                        <Badge variant={selectedEntity.status === 'active' ? 'default' : 'secondary'}>
                          {selectedEntity.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button>Send Message</Button>
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
                      <span className="font-medium">{selectedEntity.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Phone</span>
                      <span className="font-medium">{selectedEntity.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Department</span>
                      <span className="font-medium">{selectedEntity.department}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="font-medium">{(selectedEntity.confidence * 100).toFixed(0)}%</span>
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
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Location</span>
                      <span className="font-medium">{selectedEntity.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Seen</span>
                      <span className="font-medium">{selectedEntity.lastSeen}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={selectedEntity.status === 'active' ? 'default' : 'secondary'}>
                        {selectedEntity.status}
                      </Badge>
                    </div>
                  </div>
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
                <div className="space-y-4">
                  {timeline.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${
                          item.type === 'swipe' ? 'bg-chart-1' :
                          item.type === 'wifi' ? 'bg-chart-2' :
                          item.type === 'booking' ? 'bg-chart-3' :
                          'bg-chart-4'
                        }`} />
                        {index !== timeline.length - 1 && (
                          <div className="w-px h-full bg-border mt-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{item.event}</p>
                          <span className="text-sm text-muted-foreground">{item.time}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{item.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
