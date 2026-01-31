import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '../store';
import { updateCapacity as localUpdateCapacity, toggleResource as localToggleResource, setShelters } from '../store/slices/sheltersSlice';
import { fetchShelters } from '../store/slices/apiSlice';
import {
  Home,
  Users,
  TrendingUp,
  TrendingDown,
  Utensils,
  Droplets,
  Heart,
  RefreshCw,
  Plus,
  Minus,
  Save,
  Activity,
  Clock,
  AlertTriangle,
  CheckCircle2,
  WifiOff,
  Zap,
  Bell,
  MapPin,
  Shield,
  Settings,
  BarChart3,
  X
} from 'lucide-react';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

// Animated background particle
const BackgroundParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-emerald-500/20 rounded-full"
    initial={{ x: Math.random() * 100 + '%', y: '100%', opacity: 0 }}
    animate={{ y: '-100%', opacity: [0, 1, 0] }}
    transition={{ duration: 10 + Math.random() * 5, delay, repeat: Infinity, ease: 'linear' }}
  />
);

// Circular Progress Component
function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 10,
  showLabel = true
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 90) return { stroke: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
    if (percentage >= 70) return { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.3)' };
    return { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
  };

  const colors = getColor();

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-700/50"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{ strokeDasharray: circumference, filter: `drop-shadow(0 0 8px ${colors.glow})` }}
        />
      </svg>
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            key={percentage}
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl font-bold text-white"
          >
            {percentage}%
          </motion.span>
          <span className="text-xs text-slate-400 mt-1">Occupied</span>
        </div>
      )}
    </div>
  );
}

// Resource Toggle Component
function ResourceToggle({
  icon: Icon,
  label,
  active,
  onToggle,
  color,
  description
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onToggle: () => void;
  color: string;
  description: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      onClick={onToggle}
      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 border ${active
        ? `${color} border-white/10 shadow-lg`
        : 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800'
        }`}
    >
      <div className={`p-3 rounded-xl ${active ? 'bg-white/20' : 'bg-slate-700/50'}`}>
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400'}`} />
      </div>
      <div className="flex-1 text-left">
        <p className={`font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${active ? 'text-white/70' : 'text-slate-500'}`}>
          {description}
        </p>
      </div>
      <div className={`w-14 h-8 rounded-full p-1 transition-all duration-300 ${active ? 'bg-white/30' : 'bg-slate-700'
        }`}>
        <motion.div
          className={`w-6 h-6 rounded-full shadow-md ${active ? 'bg-white' : 'bg-slate-500'}`}
          animate={{ x: active ? 24 : 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </motion.button>
  );
}

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  trend,
  trendValue,
  color,
  delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative overflow-hidden rounded-2xl p-5 border border-white/10 ${color}`}
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12" />
      <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full -ml-8 -mb-8" />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <Icon className="w-5 h-5 text-white" />
          </div>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${trend === 'up' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
              }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-sm text-white/70 mt-1">{label}</p>
      </div>
    </motion.div>
  );
}

// Status Badge
function StatusBadge({ status }: { status: string }) {
  const config = {
    OPEN: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    FULL: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
    CLOSED: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' },
  };
  const c = config[status as keyof typeof config] || config.CLOSED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={c.text}>{status}</span>
    </span>
  );
}

// Shelter Card for Grid
function ShelterCard({
  shelter,
  isSelected,
  onSelect,
  index
}: {
  shelter: RootState['shelters']['shelters'][0];
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) {
  const occupancy = Math.round((shelter.capacity.current / shelter.capacity.total) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={`group relative bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 cursor-pointer transition-all duration-300 border ${isSelected
        ? 'border-emerald-500/50 bg-emerald-500/5 shadow-lg shadow-emerald-500/10'
        : 'border-slate-700/50 hover:border-emerald-500/30'
        }`}
    >
      {isSelected && (
        <div className="absolute top-3 right-3">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
        </div>
      )}

      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <StatusBadge status={shelter.status} />
          <h3 className="text-lg font-semibold text-white mt-2 group-hover:text-emerald-400 transition-colors">
            {shelter.name}
          </h3>
          <p className="text-slate-400 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3" />
            {shelter.address?.slice(0, 30)}...
          </p>
        </div>
        <div className="ml-4">
          <CircularProgress percentage={occupancy} size={56} strokeWidth={5} showLabel={false} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-400">
          <Users className="w-4 h-4" />
          <span className="text-sm font-medium">
            {shelter.capacity.current}/{shelter.capacity.total}
          </span>
        </div>
        <span className={`text-sm font-bold ${occupancy >= 90 ? 'text-rose-400' :
          occupancy >= 70 ? 'text-amber-400' : 'text-emerald-400'
          }`}>
          {occupancy}% full
        </span>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-700/50">
        <div className={`flex items-center gap-1.5 text-xs ${shelter.resources.food ? 'text-emerald-400' : 'text-slate-600'}`}>
          <Utensils className="w-3.5 h-3.5" />Food
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${shelter.resources.water ? 'text-blue-400' : 'text-slate-600'}`}>
          <Droplets className="w-3.5 h-3.5" />Water
        </div>
        <div className={`flex items-center gap-1.5 text-xs ${shelter.resources.medical ? 'text-rose-400' : 'text-slate-600'}`}>
          <Heart className="w-3.5 h-3.5" />Medical
        </div>
      </div>
    </motion.div>
  );
}

// Main Manager Dashboard Component
export default function ManagerDashboard({ onBack: _onBack }: { onBack?: () => void }) {
  void _onBack; // Reserved for future navigation
  const dispatch = useDispatch<AppDispatch>();
  const shelters = useSelector((state: RootState) => state.shelters.shelters);
  const token = useSelector((state: RootState) => state.auth.token);
  const user = useSelector((state: RootState) => state.auth.user);

  const [selectedShelterId, setSelectedShelterId] = useState<string | null>(null);
  const [capacityInput, setCapacityInput] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [_socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const selectedShelter = shelters.find(s => s._id === selectedShelterId);

  // Socket connection and real-time updates
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_room', 'manager_room');
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('shelter_update', (data: { shelter: typeof shelters[0] }) => {
      if (data.shelter) {
        dispatch(localUpdateCapacity({ id: data.shelter._id, current: data.shelter.capacity.current }));
        setLastUpdate(new Date());
      }
    });

    newSocket.on('new_emergency', () => {
      addNotification('🚨 New SOS Alert received!', 'alert');
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [dispatch]);

  // Load shelters on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await dispatch(fetchShelters()).unwrap();
        if (result.data) {
          dispatch(setShelters(result.data));
        }
      } catch (error) {
        console.error('Failed to fetch shelters:', error);
      }
    };
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const addNotification = (message: string, type: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const result = await dispatch(fetchShelters()).unwrap();
      if (result.data) {
        dispatch(setShelters(result.data));
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setIsRefreshing(false);
  };

  // Auto-select first shelter
  useEffect(() => {
    if (!selectedShelterId && shelters.length > 0) {
      setSelectedShelterId(shelters[0]._id);
    }
  }, [shelters, selectedShelterId]);

  // Update capacity input when selected shelter changes
  useEffect(() => {
    if (selectedShelter) {
      setCapacityInput(selectedShelter.capacity.current);
    }
  }, [selectedShelterId]);

  const handleCapacityChange = (delta: number) => {
    if (!selectedShelter) return;
    const newValue = Math.max(0, Math.min(selectedShelter.capacity.total, capacityInput + delta));
    setCapacityInput(newValue);
  };

  const handleSaveCapacity = async () => {
    if (!selectedShelter || !token) {
      addNotification('❌ Not authorized', 'error');
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/shelters/${selectedShelter._id}/capacity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current: capacityInput })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to update capacity');
      }

      if (result.data) {
        dispatch(localUpdateCapacity({
          id: selectedShelter._id,
          current: result.data.capacity.current
        }));
        setCapacityInput(result.data.capacity.current);
      }

      setLastSaved(new Date());
      setLastUpdate(new Date());
      addNotification('✅ Capacity updated successfully!', 'success');
    } catch (error: unknown) {
      console.error('Failed to update capacity:', error);
      const errMsg = error instanceof Error ? error.message : 'Unknown error';
      addNotification(`❌ ${errMsg}`, 'error');
    }

    setIsSaving(false);
  };

  const handleToggleResource = async (resource: 'food' | 'water' | 'medical') => {
    if (!selectedShelter || !token) return;

    const newResources = {
      ...selectedShelter.resources,
      [resource]: !selectedShelter.resources[resource]
    };

    dispatch(localToggleResource({
      id: selectedShelter._id,
      resource
    }));

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/shelters/${selectedShelter._id}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resources: newResources })
      });

      if (!response.ok) {
        throw new Error('Failed to update resource');
      }

      addNotification(`✅ ${resource.charAt(0).toUpperCase() + resource.slice(1)} ${newResources[resource] ? 'enabled' : 'disabled'}`, 'success');
    } catch (error) {
      console.error('Failed to update resource:', error);
      dispatch(localToggleResource({
        id: selectedShelter._id,
        resource
      }));
      addNotification('❌ Failed to update resource', 'error');
    }
  };

  // Calculate stats
  const totalCapacity = shelters.reduce((sum, s) => sum + s.capacity.total, 0);
  const totalOccupied = shelters.reduce((sum, s) => sum + s.capacity.current, 0);
  const totalAvailable = totalCapacity - totalOccupied;
  const openShelters = shelters.filter(s => s.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <BackgroundParticle key={i} delay={i * 0.7} />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Notification Toasts */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border max-w-sm ${notif.type === 'alert'
                ? 'bg-rose-500/90 border-rose-400/50 text-white'
                : notif.type === 'success'
                  ? 'bg-emerald-500/90 border-emerald-400/50 text-white'
                  : notif.type === 'error'
                    ? 'bg-red-500/90 border-red-400/50 text-white'
                    : 'bg-blue-500/90 border-blue-400/50 text-white'
                }`}
            >
              {notif.type === 'alert' ? (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Bell className="w-5 h-5" />
                </div>
              ) : notif.type === 'success' ? (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Zap className="w-5 h-5" />
                </div>
              )}
              <span className="font-medium text-sm flex-1">{notif.message}</span>
              <button
                onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content */}
      <div className="relative z-10 p-4 md:p-6">
        {/* Header */}
        <div className="bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent -mx-4 md:-mx-6 px-4 md:px-6 pb-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <motion.div
                className="p-3 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg shadow-emerald-500/30"
                whileHover={{ scale: 1.05 }}
              >
                <Shield className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">Manager Dashboard</h1>
                <p className="text-slate-400 text-sm">Shelter capacity and resource management</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className={`hidden md:flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800/50 backdrop-blur-sm border ${isConnected ? 'border-emerald-500/30' : 'border-rose-500/30'
                }`}>
                {isConnected ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm text-emerald-400 font-medium">Live</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-4 h-4 text-rose-500" />
                    <span className="text-sm text-rose-400">Offline</span>
                  </>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2.5 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-slate-700/50 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-slate-800/80 to-slate-800/40 backdrop-blur-xl rounded-2xl p-5 border border-slate-700/50 mb-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm mb-1">Welcome back,</p>
                <h2 className="text-2xl font-bold text-white">{user?.username || 'Manager'}</h2>
                <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Managing {shelters.length} shelter locations
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">Updated {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              icon={Home}
              label="Open Shelters"
              value={openShelters}
              color="bg-gradient-to-br from-emerald-600/80 to-emerald-700/80"
              delay={0}
            />
            <StatsCard
              icon={Users}
              label="Total Capacity"
              value={totalCapacity}
              color="bg-gradient-to-br from-blue-600/80 to-blue-700/80"
              delay={0.1}
            />
            <StatsCard
              icon={Activity}
              label="Currently Occupied"
              value={totalOccupied}
              trend="up"
              trendValue="+12%"
              color="bg-gradient-to-br from-purple-600/80 to-purple-700/80"
              delay={0.2}
            />
            <StatsCard
              icon={CheckCircle2}
              label="Spots Available"
              value={totalAvailable}
              color="bg-gradient-to-br from-amber-600/80 to-amber-700/80"
              delay={0.3}
            />
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Shelter List */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">All Shelters</h2>
              <span className="text-sm text-slate-400">{shelters.length} locations</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {shelters.map((shelter, index) => (
                <ShelterCard
                  key={shelter._id}
                  shelter={shelter}
                  isSelected={selectedShelterId === shelter._id}
                  onSelect={() => setSelectedShelterId(shelter._id)}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Selected Shelter Controls */}
          <div className="lg:col-span-1">
            <AnimatePresence mode="wait">
              {selectedShelter ? (
                <motion.div
                  key={selectedShelter._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 sticky top-6"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20">
                        <Settings className="w-5 h-5 text-emerald-400" />
                      </div>
                      <h2 className="text-lg font-semibold text-white">Manage Shelter</h2>
                    </div>
                    {lastSaved && (
                      <span className="text-xs text-slate-400 flex items-center gap-1 bg-slate-700/50 px-2 py-1 rounded-lg">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Saved
                      </span>
                    )}
                  </div>

                  <StatusBadge status={selectedShelter.status} />
                  <h3 className="text-xl font-bold text-white mt-3 mb-1">{selectedShelter.name}</h3>
                  <p className="text-slate-400 text-sm mb-6 flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {selectedShelter.address}
                  </p>

                  {/* Capacity Control */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Current Occupancy
                    </label>
                    <div className="flex items-center justify-center mb-6">
                      <CircularProgress
                        percentage={Math.round((capacityInput / selectedShelter.capacity.total) * 100)}
                        size={160}
                        strokeWidth={14}
                      />
                    </div>

                    <div className="flex items-center justify-between gap-3 mb-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCapacityChange(-10)}
                        className="flex-1 p-3.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600/50"
                      >
                        <Minus className="w-5 h-5 text-white mx-auto" />
                      </motion.button>
                      <div className="flex-1 text-center">
                        <input
                          type="number"
                          value={capacityInput}
                          onChange={(e) => setCapacityInput(Math.min(selectedShelter.capacity.total, Math.max(0, parseInt(e.target.value) || 0)))}
                          className="w-full text-center text-3xl font-bold text-white bg-transparent border-b-2 border-slate-600 focus:border-emerald-500 outline-none py-2 transition-colors"
                        />
                        <span className="text-sm text-slate-400">of {selectedShelter.capacity.total}</span>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCapacityChange(10)}
                        className="flex-1 p-3.5 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors border border-slate-600/50"
                      >
                        <Plus className="w-5 h-5 text-white mx-auto" />
                      </motion.button>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSaveCapacity}
                      disabled={isSaving}
                      className={`w-full py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${isSaving
                        ? 'bg-slate-600 text-slate-400 cursor-wait'
                        : capacityInput !== selectedShelter.capacity.current
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30'
                          : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 border border-slate-600/50'
                        }`}
                    >
                      {isSaving ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <Save className="w-5 h-5" />
                      )}
                      {isSaving ? 'Saving...' : capacityInput !== selectedShelter.capacity.current ? 'Save Changes' : 'Update Capacity'}
                    </motion.button>
                  </div>

                  {/* Resources */}
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-4">
                      Available Resources
                    </label>
                    <div className="space-y-3">
                      <ResourceToggle
                        icon={Utensils}
                        label="Food Supply"
                        description={selectedShelter.resources.food ? 'Currently available' : 'Not available'}
                        active={selectedShelter.resources.food}
                        onToggle={() => handleToggleResource('food')}
                        color="bg-gradient-to-r from-emerald-500 to-emerald-600"
                      />
                      <ResourceToggle
                        icon={Droplets}
                        label="Water Supply"
                        description={selectedShelter.resources.water ? 'Currently available' : 'Not available'}
                        active={selectedShelter.resources.water}
                        onToggle={() => handleToggleResource('water')}
                        color="bg-gradient-to-r from-blue-500 to-blue-600"
                      />
                      <ResourceToggle
                        icon={Heart}
                        label="Medical Support"
                        description={selectedShelter.resources.medical ? 'Currently available' : 'Not available'}
                        active={selectedShelter.resources.medical}
                        onToggle={() => handleToggleResource('medical')}
                        color="bg-gradient-to-r from-rose-500 to-rose-600"
                      />
                    </div>
                  </div>

                  {/* Status Warning */}
                  {Math.round((capacityInput / selectedShelter.capacity.total) * 100) >= 90 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-amber-500/20">
                          <AlertTriangle className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-400">High Occupancy Alert</p>
                          <p className="text-xs text-amber-400/70 mt-1">
                            This shelter is nearing full capacity. Consider redirecting to nearby shelters.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                    <Home className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 font-medium">Select a shelter to manage</p>
                  <p className="text-slate-500 text-sm mt-1">Click on any shelter card to view details</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
