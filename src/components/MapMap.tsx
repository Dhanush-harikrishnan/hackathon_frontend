import { useEffect, useState, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { RootState, AppDispatch } from '../store';
import { selectShelter, setShelters } from '../store/slices/sheltersSlice';
import { fetchShelters, fetchNearestShelters } from '../store/slices/apiSlice';
import { 
  Navigation, 
  Phone, 
  Users, 
  Utensils, 
  Droplets, 
  Heart,
  ChevronUp,
  ChevronDown,
  MapPin,
  WifiOff,
  Zap,
  Shield,
  X,
  Locate,
  Layers,
  RefreshCw,
  Activity
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Map Tiles
const MAP_TILES = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri'
  },
  light: {
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }
};

// Default center (Chennai)
const DEFAULT_CENTER: [number, number] = [13.0827, 80.2707];
const DEFAULT_ZOOM = 12;

// Custom marker icons
const createShelterIcon = (status: string, isSelected: boolean, capacity: number) => {
  const colors = {
    OPEN: { bg: '#10b981', glow: 'rgba(16, 185, 129, 0.6)', pulse: '#34d399' },
    FULL: { bg: '#f59e0b', glow: 'rgba(245, 158, 11, 0.6)', pulse: '#fbbf24' },
    CLOSED: { bg: '#6b7280', glow: 'rgba(107, 114, 128, 0.4)', pulse: '#9ca3af' }
  };
  const color = colors[status as keyof typeof colors] || colors.CLOSED;
  const size = isSelected ? 56 : 44;
  
  return L.divIcon({
    className: 'custom-shelter-marker',
    html: `
      <div class="relative" style="width: ${size}px; height: ${size}px;">
        ${status === 'OPEN' ? `
          <div class="absolute inset-0 rounded-full animate-ping" style="background: ${color.glow}; animation-duration: 2s;"></div>
          <div class="absolute inset-1 rounded-full animate-pulse" style="background: ${color.glow}; animation-duration: 1.5s;"></div>
        ` : ''}
        <div class="absolute inset-0 flex items-center justify-center">
          <div class="relative rounded-full shadow-2xl flex items-center justify-center transition-all duration-300" 
               style="width: ${size - 8}px; height: ${size - 8}px; background: linear-gradient(135deg, ${color.bg}, ${color.pulse}); box-shadow: 0 0 ${isSelected ? '30' : '20'}px ${color.glow};">
            <svg width="${size/2.5}" height="${size/2.5}" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            ${isSelected ? `
              <div class="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-lg">
                <span class="text-[10px] font-bold" style="color: ${color.bg}">${capacity}%</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

const createUserIcon = () => {
  return L.divIcon({
    className: 'user-location-marker',
    html: `
      <div class="relative w-12 h-12">
        <div class="absolute inset-0 rounded-full bg-blue-500/30 animate-ping"></div>
        <div class="absolute inset-2 rounded-full bg-blue-500/50 animate-pulse"></div>
        <div class="absolute inset-3 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg shadow-blue-500/50 flex items-center justify-center">
          <div class="w-2 h-2 rounded-full bg-white"></div>
        </div>
      </div>
    `,
    iconSize: [48, 48],
    iconAnchor: [24, 24]
  });
};

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1 });
  }, [center, zoom, map]);
  return null;
}

function CircularProgress({ value, size = 60, strokeWidth = 6, color = '#10b981' }: { value: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-700" />
        <motion.circle
          cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeOut" }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-white">{value}%</span>
      </div>
    </div>
  );
}

function ResourceBadge({ available, icon: Icon, label }: { available: boolean; icon: React.ElementType; label: string }) {
  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
        available 
          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
          : 'bg-slate-800/50 text-slate-500 border border-slate-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
      {available && <Zap className="w-3 h-3 text-emerald-400" />}
    </motion.div>
  );
}

export default function MapMap() {
  const dispatch = useDispatch<AppDispatch>();
  const { shelters, selectedShelter } = useSelector((state: RootState) => state.shelters);
  
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [mapStyle, setMapStyle] = useState<'dark' | 'satellite' | 'light'>('dark');
  const [showStylePicker, setShowStylePicker] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const mapRef = useRef<L.Map | null>(null);

  const loadShelters = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const result = await dispatch(fetchShelters()).unwrap();
      if (result.data) {
        dispatch(setShelters(result.data));
        setLastUpdate(new Date());
        setConnectionStatus('connected');
      }
    } catch (error) {
      console.error('Failed to fetch shelters:', error);
      setConnectionStatus('disconnected');
    }
    setIsRefreshing(false);
  }, [dispatch]);

  useEffect(() => {
    loadShelters();
    const interval = setInterval(loadShelters, 30000);
    return () => clearInterval(interval);
  }, [loadShelters]);

  const getUserLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(14);
        setIsLocating(false);
        dispatch(fetchNearestShelters({ lat: latitude, lng: longitude }));
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [dispatch]);

  const handleShelterClick = (shelter: typeof shelters[0]) => {
    dispatch(selectShelter(shelter));
    setSheetExpanded(true);
    const [lng, lat] = shelter.location.coordinates;
    setMapCenter([lat, lng]);
    setMapZoom(15);
  };

  const getCapacityInfo = (shelter: typeof shelters[0]) => {
    const pct = Math.round((shelter.capacity.current / shelter.capacity.total) * 100);
    const available = shelter.capacity.total - shelter.capacity.current;
    return { pct, available };
  };

  const getStatusColor = (status: string) => {
    if (status === 'OPEN') return '#10b981';
    if (status === 'FULL') return '#f59e0b';
    return '#6b7280';
  };

  const stats = {
    total: shelters.length,
    open: shelters.filter(s => s.status === 'OPEN').length,
    full: shelters.filter(s => s.status === 'FULL').length,
    totalCapacity: shelters.reduce((sum, s) => sum + s.capacity.total, 0),
    totalOccupied: shelters.reduce((sum, s) => sum + s.capacity.current, 0)
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-950">
      <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-0" zoomControl={false} ref={mapRef}>
        <TileLayer url={MAP_TILES[mapStyle].url} attribution={MAP_TILES[mapStyle].attribution} />
        <MapController center={mapCenter} zoom={mapZoom} />
        
        {userLocation && (
          <>
            <Circle center={userLocation} radius={100} pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1, weight: 2 }} />
            <Marker position={userLocation} icon={createUserIcon()}>
              <Popup><div className="text-center p-2"><p className="font-semibold">Your Location</p></div></Popup>
            </Marker>
          </>
        )}
        
        {shelters.map((shelter) => {
          const [lng, lat] = shelter.location.coordinates;
          const { pct } = getCapacityInfo(shelter);
          const isSelected = selectedShelter?._id === shelter._id;
          return (
            <Marker key={shelter._id} position={[lat, lng]} icon={createShelterIcon(shelter.status, isSelected, pct)} eventHandlers={{ click: () => handleShelterClick(shelter) }} />
          );
        })}
      </MapContainer>

      {/* Top Status Bar */}
      <motion.div initial={{ y: -100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="absolute top-4 left-4 right-4 z-20">
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">SafeRoute</h1>
                <div className="flex items-center gap-2">
                  {connectionStatus === 'connected' ? (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs"><Activity className="w-3 h-3 animate-pulse" /> Live</span>
                  ) : connectionStatus === 'connecting' ? (
                    <span className="flex items-center gap-1 text-amber-400 text-xs"><RefreshCw className="w-3 h-3 animate-spin" /> Connecting</span>
                  ) : (
                    <span className="flex items-center gap-1 text-rose-400 text-xs"><WifiOff className="w-3 h-3" /> Offline</span>
                  )}
                  <span className="text-slate-500 text-xs">•</span>
                  <span className="text-slate-400 text-xs">{lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
            
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center px-3">
                <p className="text-2xl font-bold text-emerald-400">{stats.open}</p>
                <p className="text-xs text-slate-500">Open</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-3">
                <p className="text-2xl font-bold text-amber-400">{stats.full}</p>
                <p className="text-xs text-slate-500">Full</p>
              </div>
              <div className="h-8 w-px bg-slate-800" />
              <div className="text-center px-3">
                <p className="text-2xl font-bold text-white">{stats.totalCapacity - stats.totalOccupied}</p>
                <p className="text-xs text-slate-500">Available</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Map Controls */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={getUserLocation} disabled={isLocating}
          className="w-12 h-12 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50">
          {isLocating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Locate className="w-5 h-5" />}
        </motion.button>
        
        <div className="relative">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setShowStylePicker(!showStylePicker)}
            className="w-12 h-12 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg">
            <Layers className="w-5 h-5" />
          </motion.button>
          <AnimatePresence>
            {showStylePicker && (
              <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="absolute right-14 top-0 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-xl p-2 shadow-xl">
                {(['dark', 'light', 'satellite'] as const).map((style) => (
                  <button key={style} onClick={() => { setMapStyle(style); setShowStylePicker(false); }}
                    className={`block w-full px-4 py-2 text-sm text-left rounded-lg capitalize transition-colors ${mapStyle === style ? 'bg-blue-500/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800'}`}>
                    {style}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={loadShelters} disabled={isRefreshing}
          className="w-12 h-12 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition-colors shadow-lg disabled:opacity-50">
          <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Bottom Sheet */}
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="absolute bottom-0 left-0 right-0 z-30">
        <div onClick={() => setSheetExpanded(!sheetExpanded)} className="flex justify-center py-2 cursor-pointer">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
        </div>
        
        <motion.div animate={{ height: sheetExpanded ? 'auto' : selectedShelter ? '180px' : '120px' }}
          className="bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 rounded-t-3xl overflow-hidden">
          {selectedShelter ? (
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      selectedShelter.status === 'OPEN' ? 'bg-emerald-500/20 text-emerald-400' 
                      : selectedShelter.status === 'FULL' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-500/20 text-slate-400'
                    }`}>{selectedShelter.status}</span>
                    <span className="text-xs text-slate-500">Updated {new Date(selectedShelter.lastUpdated).toLocaleTimeString()}</span>
                  </div>
                  <h2 className="text-xl font-bold text-white">{selectedShelter.name}</h2>
                  <p className="text-slate-400 text-sm flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" />{selectedShelter.address}</p>
                </div>
                <div className="flex items-center gap-3">
                  <CircularProgress value={getCapacityInfo(selectedShelter).pct} color={getStatusColor(selectedShelter.status)} />
                  <button onClick={() => { dispatch(selectShelter(null)); setSheetExpanded(false); }}
                    className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <button onClick={() => setSheetExpanded(!sheetExpanded)} className="flex items-center gap-2 text-slate-400 text-sm mb-4 hover:text-white transition-colors">
                {sheetExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                {sheetExpanded ? 'Show less' : 'Show more'}
              </button>
              
              <AnimatePresence>
                {sheetExpanded && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-slate-400 text-sm flex items-center gap-2"><Users className="w-4 h-4" />Capacity</span>
                        <span className="text-white font-semibold">{selectedShelter.capacity.current} / {selectedShelter.capacity.total}</span>
                      </div>
                      <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${getCapacityInfo(selectedShelter).pct}%` }} transition={{ duration: 0.5 }}
                          className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${getStatusColor(selectedShelter.status)}, ${getStatusColor(selectedShelter.status)}99)` }} />
                      </div>
                      <p className="text-sm text-slate-500 mt-2">{getCapacityInfo(selectedShelter).available} spots available</p>
                    </div>
                    
                    <div>
                      <p className="text-slate-400 text-sm mb-3">Available Resources</p>
                      <div className="flex flex-wrap gap-2">
                        <ResourceBadge available={selectedShelter.resources.food} icon={Utensils} label="Food" />
                        <ResourceBadge available={selectedShelter.resources.water} icon={Droplets} label="Water" />
                        <ResourceBadge available={selectedShelter.resources.medical} icon={Heart} label="Medical" />
                      </div>
                    </div>
                    
                    <div className="flex gap-3 pt-2">
                      <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} href={`tel:${selectedShelter.phone}`}
                        className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors">
                        <Phone className="w-5 h-5" />Call
                      </motion.a>
                      <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                        href={`https://www.google.com/maps/dir/?api=1&destination=${selectedShelter.location.coordinates[1]},${selectedShelter.location.coordinates[0]}`}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all">
                        <Navigation className="w-5 h-5" />Navigate
                      </motion.a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Nearby Shelters</h2>
                <span className="text-slate-400 text-sm">{shelters.length} locations</span>
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
                {shelters.slice(0, 5).map((shelter) => {
                  const { available } = getCapacityInfo(shelter);
                  return (
                    <motion.button key={shelter._id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleShelterClick(shelter)}
                      className="flex-shrink-0 w-48 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-xl p-4 text-left transition-all">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getStatusColor(shelter.status) }} />
                        <span className="text-xs text-slate-400 uppercase">{shelter.status}</span>
                      </div>
                      <p className="text-white font-semibold text-sm truncate">{shelter.name}</p>
                      <p className="text-xs text-slate-500 mt-1">{available} spots left</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
