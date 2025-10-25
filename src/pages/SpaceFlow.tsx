import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertsContext } from '@/contexts/AlertsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  AlertTriangle, 
  TrendingUp, 
  Users, 
  MapPin, 
  Activity,
  Zap,
  Play,
  BarChart3,
  Brain,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Navigation,
  Layers,
  Shield,
  Target,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw
} from 'lucide-react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Types
interface LocationMarker {
  id: string;
  name: string;
  type: 'lab' | 'hostel' | 'library' | 'canteen' | 'sports' | 'academic' | 'admin';
  x: number; // percentage position on map
  y: number; // percentage position on map
  current_occupancy: number;
  capacity: number;
  forecast_count: number;
  confidence: number;
  status: 'normal' | 'crowded' | 'warning' | 'critical';
}

interface Alert {
  alert_id: string;
  severity_score: number;
  type: 'overcrowding' | 'missing_entity' | 'access_violation' | 'underutilized';
  affected_zone: string;
  title: string;
  description: string;
  evidence: Evidence[];
  recommended_actions: Action[];
  timestamp: string;
}

interface Evidence {
  source: string;
  id: string;
  weight: number;
  description: string;
}

interface Action {
  action_id: string;
  title: string;
  description: string;
  expected_effect: string;
  impact_score: number;
}

interface Forecast {
  zone: string;
  forecast_count: number;
  confidence: number;
  model_version: string;
  provenance: Evidence[];
  explanation: {
    feature_weights: Record<string, number>;
  };
}

const SpaceFlow = () => {
  const { theme } = useTheme();
  const { alerts, resolveAlert } = useAlertsContext();
  const [selectedLocation, setSelectedLocation] = useState<LocationMarker | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Map controls
  const [zoom, setZoom] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // IITG Campus locations based on the map - spread across full map area
  const [locations, setLocations] = useState<LocationMarker[]>([
    // Academic Buildings - center diagonal spread
    { id: 'core1', name: 'Core 1 (Maths)', type: 'academic', x: 43, y: 55, current_occupancy: 85, capacity: 120, forecast_count: 95, confidence: 0.82, status: 'warning' },
    { id: 'core2', name: 'Core 2 (Physics)', type: 'academic', x: 47, y: 50, current_occupancy: 72, capacity: 100, forecast_count: 88, confidence: 0.79, status: 'normal' },
    { id: 'core3', name: 'Core 3 (Chemistry)', type: 'academic', x: 51, y: 45, current_occupancy: 65, capacity: 100, forecast_count: 70, confidence: 0.85, status: 'normal' },
    { id: 'core4', name: 'Core 4 (HSS)', type: 'academic', x: 55, y: 40, current_occupancy: 45, capacity: 80, forecast_count: 52, confidence: 0.76, status: 'normal' },
    { id: 'core5', name: 'Core 5 (Admin)', type: 'admin', x: 59, y: 35, current_occupancy: 30, capacity: 60, forecast_count: 35, confidence: 0.72, status: 'normal' },
    
    // Department Buildings - right side spread
    { id: 'cse', name: 'CSE Department', type: 'academic', x: 68, y: 48, current_occupancy: 120, capacity: 150, forecast_count: 142, confidence: 0.88, status: 'crowded' },
    { id: 'eee', name: 'EEE Department', type: 'academic', x: 72, y: 55, current_occupancy: 95, capacity: 120, forecast_count: 108, confidence: 0.84, status: 'warning' },
    { id: 'mech', name: 'Mechanical Dept', type: 'academic', x: 63, y: 62, current_occupancy: 78, capacity: 100, forecast_count: 82, confidence: 0.80, status: 'normal' },
    
    // Labs - right area
    { id: 'cselab', name: 'CS Lab Complex', type: 'lab', x: 70, y: 42, current_occupancy: 65, capacity: 80, forecast_count: 76, confidence: 0.91, status: 'warning' },
    { id: 'eeelab', name: 'EEE Labs', type: 'lab', x: 76, y: 50, current_occupancy: 42, capacity: 60, forecast_count: 48, confidence: 0.78, status: 'normal' },
    
    // Hostels - left side and top right
    { id: 'bh1', name: 'Boys Hostel 1', type: 'hostel', x: 18, y: 38, current_occupancy: 180, capacity: 200, forecast_count: 195, confidence: 0.94, status: 'crowded' },
    { id: 'bh2', name: 'Boys Hostel 2', type: 'hostel', x: 16, y: 48, current_occupancy: 175, capacity: 200, forecast_count: 188, confidence: 0.92, status: 'warning' },
    { id: 'bh3', name: 'Boys Hostel 3', type: 'hostel', x: 14, y: 58, current_occupancy: 165, capacity: 200, forecast_count: 178, confidence: 0.90, status: 'normal' },
    { id: 'gh1', name: 'Girls Hostel 1', type: 'hostel', x: 78, y: 22, current_occupancy: 145, capacity: 180, forecast_count: 160, confidence: 0.89, status: 'warning' },
    { id: 'gh2', name: 'Girls Hostel 2', type: 'hostel', x: 83, y: 28, current_occupancy: 138, capacity: 180, forecast_count: 152, confidence: 0.87, status: 'normal' },
    
    // Libraries - center
    { id: 'library', name: 'Central Library', type: 'library', x: 52, y: 58, current_occupancy: 250, capacity: 300, forecast_count: 285, confidence: 0.86, status: 'crowded' },
    
    // Canteens & Mess - center-bottom
    { id: 'kc', name: 'Khokha Complex', type: 'canteen', x: 46, y: 65, current_occupancy: 85, capacity: 150, forecast_count: 128, confidence: 0.75, status: 'normal' },
    { id: 'fc', name: 'Food Court', type: 'canteen', x: 56, y: 68, current_occupancy: 92, capacity: 120, forecast_count: 105, confidence: 0.77, status: 'warning' },
    
    // Sports - bottom left
    { id: 'stadium', name: 'Sports Stadium', type: 'sports', x: 28, y: 68, current_occupancy: 45, capacity: 200, forecast_count: 38, confidence: 0.68, status: 'normal' },
    { id: 'gym', name: 'Gymnasium', type: 'sports', x: 36, y: 64, current_occupancy: 35, capacity: 80, forecast_count: 42, confidence: 0.71, status: 'normal' },
  ])

  // Fetch ML predictions for locations
  useEffect(() => {
    const fetchPredictions = async () => {
      try {
        const currentHour = new Date().getHours();
        const currentDay = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        // Fetch predictions for all locations
        const updatedLocations = await Promise.all(
          locations.map(async (location) => {
            try {
              const response = await fetch('http://localhost:8000/api/spaceflow/forecast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  location_id: location.id,
                  hour_of_day: currentHour,
                  day_of_week: currentDay,
                  is_weekend: currentDay === 0 || currentDay === 6 ? 1 : 0,
                  swipe_count: location.current_occupancy,
                  wifi_count: Math.floor(location.current_occupancy * 0.8),
                  booking_count: Math.floor(location.current_occupancy * 0.3),
                }),
              });
              
              if (response.ok) {
                const data = await response.json();
                // Update forecast with ML prediction
                return {
                  ...location,
                  forecast_count: Math.round(data.predicted_occupancy),
                  confidence: data.confidence,
                  status: (data.predicted_occupancy > location.capacity * 0.9 ? 'critical' :
                          data.predicted_occupancy > location.capacity * 0.75 ? 'crowded' :
                          data.predicted_occupancy > location.capacity * 0.6 ? 'warning' : 'normal') as 'normal' | 'crowded' | 'warning' | 'critical'
                };
              }
            } catch (err) {
              console.error(`Failed to fetch prediction for ${location.name}:`, err);
            }
            return location;
          })
        );
        
        setLocations(updatedLocations);
      } catch (error) {
        console.error('Error fetching ML predictions:', error);
      }
    };

    // Fetch predictions on mount and every 30 seconds if autoRefresh is on
    fetchPredictions();
    if (autoRefresh) {
      const interval = setInterval(fetchPredictions, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Map control functions
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5));
  const handleResetView = () => {
    setZoom(1);
    setPanX(0);
    setPanY(0);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panX, y: e.clientY - panY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const newPanX = e.clientX - dragStart.x;
      const newPanY = e.clientY - dragStart.y;
      
      // Calculate boundaries based on zoom level
      const maxPan = 200 * (zoom - 1); // Allow more panning when zoomed in
      
      // Constrain pan within boundaries
      setPanX(Math.max(-maxPan, Math.min(maxPan, newPanX)));
      setPanY(Math.max(-maxPan, Math.min(maxPan, newPanY)));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const getLocationIcon = (type: string) => {
    switch (type) {
      case 'lab': return '🔬';
      case 'hostel': return '🏠';
      case 'library': return '📚';
      case 'canteen': return '🍽️';
      case 'sports': return '⚽';
      case 'academic': return '🎓';
      case 'admin': return '🏛️';
      default: return '📍';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical': return 'rgb(239, 68, 68)';
      case 'crowded': return 'rgb(245, 158, 11)';
      case 'warning': return 'rgb(234, 179, 8)';
      default: return 'rgb(34, 197, 94)';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'critical': return 'bg-red-500';
      case 'crowded': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };


  const getSeverityColor = (score: number) => {
    if (score >= 0.8) return 'bg-red-500';
    if (score >= 0.6) return 'bg-orange-500';
    if (score >= 0.4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityLabel = (score: number) => {
    if (score >= 0.8) return 'CRITICAL';
    if (score >= 0.6) return 'HIGH';
    if (score >= 0.4) return 'MEDIUM';
    return 'LOW';
  };

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 text-slate-900'
    }`}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute w-96 h-96 rounded-full blur-3xl animate-pulse ${
          theme === 'dark' ? 'bg-blue-500/10' : 'bg-blue-400/30'
        }`} style={{ top: '10%', left: '20%' }} />
        <div className={`absolute w-96 h-96 rounded-full blur-3xl animate-pulse delay-1000 ${
          theme === 'dark' ? 'bg-purple-500/10' : 'bg-purple-400/30'
        }`} style={{ bottom: '10%', right: '20%' }} />
      </div>

      {/* Header */}
      <motion.header 
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`relative z-10 backdrop-blur-xl ${
          theme === 'dark' 
            ? 'border-b border-white/10 bg-black/20' 
            : 'border-b border-blue-200/50 bg-white/60 shadow-lg shadow-blue-100/50'
        }`}
      >
        <div className="px-4 md:px-6 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-4">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0"
            >
              <Sparkles className="w-4 h-4 md:w-6 md:h-6 text-white" />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                SpaceFlow
              </h1>
              <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-blue-700/80'} hidden sm:block`}>
                Space-Aware Campus Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Badge variant="outline" className="border-green-500/50 text-green-400 px-2 md:px-4 py-1 md:py-2 text-xs">
              <div className="w-2 h-2 bg-green-400 rounded-full mr-1 md:mr-2 animate-pulse" />
              <span className="hidden sm:inline">Live System</span>
              <span className="sm:hidden">Live</span>
            </Badge>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row gap-3 md:gap-4 p-3 md:p-6 relative z-10 overflow-hidden">
        {/* Left: Campus Map - Full Width on Mobile */}
        <motion.div 
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex-[2] flex flex-col gap-3 md:gap-4 min-h-0"
        >
          <Card className={`flex-1 backdrop-blur-xl overflow-hidden ${
            theme === 'dark' 
              ? 'bg-black/40 border-white/10' 
              : 'bg-white/80 border-blue-200/50 shadow-xl shadow-blue-100/50'
          }`}>
            <CardHeader className={`pb-3 ${
              theme === 'dark' 
                ? 'border-b border-white/10 bg-slate-900/50' 
                : 'border-b border-slate-200 bg-gradient-to-r from-slate-800 to-slate-900'
            }`}>
              <div className="flex items-center justify-between">
                <CardTitle className={`text-lg flex items-center gap-2 ${
                  theme === 'dark' ? 'text-white' : 'text-white'
                }`}>
                  <MapPin className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-300'}`} />
                  IITG Campus Live Map
                </CardTitle>
                <div className="flex items-center gap-2">
                  {/* Map Controls */}
                  <div className={`flex items-center gap-1 rounded-lg p-1 border ${
                    theme === 'dark' 
                      ? 'bg-black/40 border-white/10' 
                      : 'bg-slate-950/90 border-slate-700'
                  }`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleZoomIn}
                      className={`h-8 w-8 p-0 ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Zoom In"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleZoomOut}
                      className={`h-8 w-8 p-0 ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleResetView}
                      className={`h-8 w-8 p-0 ${
                        theme === 'dark' ? 'hover:bg-white/10 text-white' : 'hover:bg-slate-700 text-slate-200'
                      }`}
                      title="Reset View"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                  <Badge variant="outline" className={`text-xs font-semibold ${
                    theme === 'dark' 
                      ? 'border-blue-400/50 text-blue-400' 
                      : 'border-blue-400 text-blue-300 bg-slate-800/80'
                  }`}>
                    Zoom: {(zoom * 100).toFixed(0)}%
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 relative overflow-hidden" style={{ height: 'calc(100vh - 280px)', minHeight: '300px' }}>
              {/* Interactive Map Container */}
              <div 
                ref={mapContainerRef}
                className="w-full h-full relative cursor-grab active:cursor-grabbing touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
                onTouchStart={(e) => {
                  const touch = e.touches[0];
                  handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY } as any);
                }}
                onTouchMove={(e) => {
                  const touch = e.touches[0];
                  handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY } as any);
                }}
                onTouchEnd={handleMouseUp}
                style={{
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: theme === 'dark' ? '#0f172a' : '#f0f9ff',
                }}
              >
                <motion.div
                  style={{
                    transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                    width: '100%',
                    height: '100%',
                    position: 'relative',
                  }}
                >
                  {/* Campus Map Background */}
                  <img 
                    src="/campus-map.png" 
                    alt="IITG Campus Map"
                    className="w-full h-full pointer-events-none select-none"
                    draggable={false}
                    style={{
                      objectFit: 'cover',
                      objectPosition: 'center',
                      display: 'block',
                    }}
                  />

                  {/* Location Markers */}
                  {locations.map((location, idx) => {
                    const isSelected = selectedLocation?.id === location.id;
                    const hasAlert = alerts.some(alert => alert.affected_zone === location.id);
                    // Inverse scale for Google Maps-like behavior
                    const markerScale = 1 / zoom;
                    
                    return (
                      <motion.div
                        key={location.id}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: markerScale }}
                        transition={{ delay: idx * 0.05 }}
                        className="absolute"
                        style={{
                          left: `${location.x}%`,
                          top: `${location.y}%`,
                          transform: 'translate(-50%, -50%)',
                          zIndex: isSelected ? 100 : 50,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLocation(location);
                        }}
                      >
                        {/* Pulsing Ring for Alerts */}
                        {hasAlert && (
                          <motion.div
                            className="absolute inset-0 rounded-full"
                            style={{
                              border: `3px solid ${getStatusColor(location.status)}`,
                              width: '48px',
                              height: '48px',
                              left: '-12px',
                              top: '-12px',
                            }}
                            animate={{
                              scale: [1, 1.5, 1],
                              opacity: [0.8, 0.3, 0.8],
                            }}
                            transition={{
                              duration: 2,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        )}

                        {/* Location Marker */}
                        <motion.div
                          className="relative cursor-pointer"
                          whileHover={{ scale: 1.2 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          {/* Marker Circle */}
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-lg border-2 transition-all ${
                              isSelected ? 'ring-4 ring-blue-500/50 border-blue-400' : 'border-white/30'
                            }`}
                            style={{
                              backgroundColor: getStatusColor(location.status),
                              boxShadow: `0 0 20px ${getStatusColor(location.status)}`,
                            }}
                          >
                            {getLocationIcon(location.type)}
                          </div>

                          {/* Location Name Label */}
                          <div className="absolute top-12 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                            <div className={`px-2 py-1 rounded text-xs font-semibold backdrop-blur-sm border ${
                              isSelected 
                                ? 'bg-blue-500/90 border-blue-400 text-white' 
                                : theme === 'dark'
                                  ? 'bg-black/80 border-white/20 text-white/90'
                                  : 'bg-white/95 border-blue-300 text-slate-900 shadow-md shadow-blue-200/50'
                            }`}>
                              {location.name}
                              <div className="text-[10px] opacity-80">
                                {location.current_occupancy}/{location.capacity}
                              </div>
                            </div>
                          </div>

                          {/* Status Indicator */}
                          {location.forecast_count > location.capacity * 0.9 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                          )}
                        </motion.div>

                        {/* Heatmap Effect */}
                        {isSelected && (
                          <motion.div
                            className="absolute inset-0 rounded-full pointer-events-none"
                            style={{
                              background: `radial-gradient(circle, ${getStatusColor(location.status)}40 0%, transparent 70%)`,
                              width: '120px',
                              height: '120px',
                              left: '-60px',
                              top: '-60px',
                            }}
                            animate={{
                              scale: [1, 1.3, 1],
                              opacity: [0.6, 0.3, 0.6],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              ease: 'easeInOut',
                            }}
                          />
                        )}
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>

              {/* Map Legend */}
              <div className={`absolute bottom-4 left-4 backdrop-blur-md rounded-lg p-2 md:p-3 border shadow-lg text-xs md:text-sm ${
                theme === 'dark' 
                  ? 'bg-black/80 border-white/20' 
                  : 'bg-white/95 border-blue-200 shadow-blue-200/50'
              }`}>
                <h4 className={`text-xs font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white/90' : 'text-slate-800'
                }`}>Status</h4>
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-500 flex-shrink-0" />
                    <span className={`${theme === 'dark' ? 'text-white/80' : 'text-slate-600'} truncate`}>Normal</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-500 flex-shrink-0" />
                    <span className={`${theme === 'dark' ? 'text-white/80' : 'text-slate-600'} truncate`}>Warning</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-orange-500 flex-shrink-0" />
                    <span className={`${theme === 'dark' ? 'text-white/80' : 'text-slate-600'} truncate`}>Crowded</span>
                  </div>
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-500 flex-shrink-0" />
                    <span className={`${theme === 'dark' ? 'text-white/80' : 'text-slate-600'} truncate`}>Critical</span>
                  </div>
                </div>
              </div>

            </CardContent>
          </Card>

          {/* Location Details */}
          <AnimatePresence>
            {selectedLocation && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
              >
                <Card className="bg-black/40 border-white/10 backdrop-blur-xl">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm md:text-lg flex flex-col md:flex-row md:items-center justify-between gap-2">
                      <span className="flex items-center gap-2 min-w-0">
                        <Target className="w-4 h-4 md:w-5 md:h-5 text-purple-400 flex-shrink-0" />
                        <span className="truncate">{selectedLocation.name}</span>
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className={`${getStatusBadge(selectedLocation.status)} border-0 text-xs`}>
                          {selectedLocation.status.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="border-blue-400/50 text-blue-400 text-xs">
                          {(selectedLocation.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Current Occupancy</p>
                        <p className="text-xl md:text-2xl font-bold">{selectedLocation.current_occupancy}</p>
                        <Progress value={(selectedLocation.current_occupancy / selectedLocation.capacity) * 100} className="h-2" />
                        <p className="text-xs text-slate-400">{((selectedLocation.current_occupancy / selectedLocation.capacity) * 100).toFixed(0)}% of capacity</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Next Hour Forecast</p>
                        <p className="text-2xl font-bold text-blue-400">{selectedLocation.forecast_count}</p>
                        <Progress value={(selectedLocation.forecast_count / selectedLocation.capacity) * 100} className="h-2" />
                        <p className="text-xs text-slate-400">
                          {selectedLocation.forecast_count > selectedLocation.current_occupancy ? '↗' : '↘'} 
                          {' '}{Math.abs(selectedLocation.forecast_count - selectedLocation.current_occupancy)} expected
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-xs text-slate-400">Total Capacity</p>
                        <p className="text-2xl font-bold text-slate-400">{selectedLocation.capacity}</p>
                        <Progress value={100} className="h-2 opacity-30" />
                        <p className="text-xs text-slate-400">
                          {selectedLocation.capacity - selectedLocation.forecast_count} seats available
                        </p>
                      </div>
                    </div>

                    {/* Alert if overcrowding predicted */}
                    {selectedLocation.forecast_count > selectedLocation.capacity * 0.9 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 p-3 bg-orange-500/20 border border-orange-500/50 rounded-lg"
                      >
                        <div className="flex items-center gap-2 text-orange-400">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-semibold">Overcrowding Risk</span>
                        </div>
                        <p className="text-xs text-orange-300 mt-1">
                          This location is predicted to exceed 90% capacity in the next hour. Consider activating overflow spaces.
                        </p>
                      </motion.div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right: Alerts Panel - Responsive */}
        <motion.div 
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full lg:w-96 flex flex-col gap-3 md:gap-4"
        >
          <Card className={`flex-1 backdrop-blur-xl overflow-hidden flex flex-col ${
            theme === 'dark' 
              ? 'bg-black/40 border-white/10' 
              : 'bg-white/80 border-blue-200/50 shadow-xl shadow-blue-100/50'
          }`}>
            <CardHeader className="pb-3 px-4 md:px-6">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <AlertTriangle className={`w-4 h-4 md:w-5 md:h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-600'}`} />
                <span className="truncate">Priority Alerts</span>
                <Badge className={`ml-auto text-xs ${
                  theme === 'dark' 
                    ? 'bg-red-500/20 text-red-400 border-red-500/50' 
                    : 'bg-red-100 text-red-700 border-red-300'
                }`}>
                  {alerts.length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto space-y-3">
              {alerts.map((alert, idx) => (
                <motion.div
                  key={alert.alert_id}
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card 
                    className={`cursor-pointer transition-all ${
                      theme === 'dark'
                        ? 'bg-black/60 border-white/10 hover:border-white/30'
                        : 'bg-white/90 border-blue-200/50 hover:border-blue-400/70 shadow-md hover:shadow-lg'
                    } ${
                      selectedAlert?.alert_id === alert.alert_id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${getSeverityColor(alert.severity_score)} animate-pulse`} />
                            <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity_score)} border-0`}>
                              {getSeverityLabel(alert.severity_score)}
                            </Badge>
                          </div>
                          <h4 className="font-semibold text-sm">{alert.title}</h4>
                          <p className="text-xs text-slate-400 mt-1">{alert.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-white/20">
                          {alert.affected_zone}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <AnimatePresence>
                      {selectedAlert?.alert_id === alert.alert_id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                        >
                          <CardContent className="pt-0 space-y-3">
                            {/* Evidence */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Brain className="w-4 h-4 text-purple-400" />
                                <p className="text-xs font-semibold text-purple-400">Evidence</p>
                              </div>
                              <div className="space-y-2">
                                {alert.evidence.map((ev) => (
                                  <div key={ev.id} className="flex items-center gap-2 text-xs">
                                    <div className="w-full bg-white/5 rounded p-2">
                                      <div className="flex items-center justify-between mb-1">
                                        <Badge variant="outline" className="text-xs border-white/20">{ev.source}</Badge>
                                        <span className="text-xs text-slate-400">{(ev.weight * 100).toFixed(0)}%</span>
                                      </div>
                                      <p className="text-slate-300">{ev.description}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Recommended Actions */}
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Zap className="w-4 h-4 text-yellow-400" />
                                <p className="text-xs font-semibold text-yellow-400">Recommended Actions</p>
                              </div>
                              <div className="space-y-2">
                                {alert.recommended_actions.map((action) => (
                                  <Button
                                    key={action.action_id}
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start text-left border-white/20 hover:bg-white/10"
                                  >
                                    <div className="flex-1">
                                      <p className="font-semibold text-xs">{action.title}</p>
                                      <p className="text-xs text-slate-400">{action.expected_effect}</p>
                                    </div>
                                    <Badge variant="outline" className="ml-2 border-green-500/50 text-green-400">
                                      {(action.impact_score * 100).toFixed(0)}%
                                    </Badge>
                                  </Button>
                                ))}
                                
                                {/* Resolve Alert Button */}
                                <Button
                                  onClick={() => resolveAlert(alert.alert_id)}
                                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                                  size="sm"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Resolve Alert
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default SpaceFlow;