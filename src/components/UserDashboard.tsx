import { useState, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '../store';
import { setShelters } from '../store/slices/sheltersSlice';
import { fetchShelters } from '../store/slices/apiSlice';
import {
  AlertTriangle,
  MapPin,
  Clock,
  Shield,
  Phone,
  Navigation,
  Home,
  Utensils,
  Droplets,
  Heart,
  CheckCircle2,
  History,
  Bell,
  X,
  Users,
  Activity,
  Zap,
  ExternalLink,
  RefreshCw,
  Map,
  Star,
  Locate
} from 'lucide-react';

import LiveMap from './LiveMap';
import { formatDistanceToNow } from 'date-fns';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface SOSHistoryItem {
  _id: string;
  status: string;
  timestamp: string;
  location: { coordinates: [number, number] };
  details?: string;
}

// Animated background particle component
const BackgroundParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-blue-500/30 rounded-full"
    initial={{
      x: Math.random() * 100 + '%',
      y: '100%',
      opacity: 0
    }}
    animate={{
      y: '-100%',
      opacity: [0, 1, 0]
    }}
    transition={{
      duration: 8 + Math.random() * 4,
      delay,
      repeat: Infinity,
      ease: 'linear'
    }}
  />
);

// Status badge component
const StatusBadge = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' }) => {
  const config = {
    OPEN: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Open' },
    FULL: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500', label: 'Full' },
    CLOSED: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500', label: 'Closed' },
    PENDING: { bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-500 animate-pulse', label: 'Pending' },
    ACKNOWLEDGED: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500 animate-pulse', label: 'Help Coming' },
    RESOLVED: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'Resolved' },
  };
  const c = config[status as keyof typeof config] || config.CLOSED;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${c.bg} ${size === 'md' ? 'text-sm' : 'text-xs'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      <span className={`font-medium ${c.text}`}>{c.label}</span>
    </span>
  );
};

// Stats card component
const StatsCard = ({ icon: Icon, value, label, color, trend }: {
  icon: any;
  value: number | string;
  label: string;
  color: string;
  trend?: string;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`relative overflow-hidden bg-gradient-to-br ${color} rounded-2xl p-4 border border-white/10`}
  >
    <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
    <div className="relative">
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-xl bg-white/10`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className="text-xs font-medium text-white/70 bg-white/10 px-2 py-0.5 rounded-full">
            {trend}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/70 mt-1">{label}</p>
    </div>
  </motion.div>
);

export default function UserDashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const shelters = useSelector((state: RootState) => state.shelters.shelters);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);

  const [activeTab, setActiveTab] = useState<'map' | 'shelters' | 'sos' | 'history'>('map');
  const [sosHistory, setSosHistory] = useState<SOSHistoryItem[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isSendingSOS, setIsSendingSOS] = useState(false);
  const [sosMessage, setSosMessage] = useState('');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosCountdown, setSOSCountdown] = useState(0);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: string }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_room', 'user_room');
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('shelter_update', () => {
      refreshData();
    });

    socket.on('sos_acknowledged', (data: { sos: SOSHistoryItem }) => {
      setSosHistory(prev => prev.map(s => s._id === data.sos._id ? { ...s, status: 'ACKNOWLEDGED' } : s));
      addNotification('Your SOS has been acknowledged! Help is on the way!', 'success');
    });

    socket.on('sos_resolved', (data: { sosId: string }) => {
      setSosHistory(prev => prev.map(s => s._id === data.sosId ? { ...s, status: 'RESOLVED' } : s));
      addNotification('Your emergency has been resolved.', 'info');
    });

    return () => { socket.close(); };
  }, []);

  // Load shelters
  useEffect(() => {
    const loadShelters = async () => {
      try {
        const result = await dispatch(fetchShelters()).unwrap();
        if (result.data) {
          dispatch(setShelters(result.data));
        }
      } catch (error) {
        console.error('Failed to fetch shelters:', error);
      }
    };
    loadShelters();
    const interval = setInterval(loadShelters, 30000);
    return () => clearInterval(interval);
  }, [dispatch]);

  // Load SOS history
  useEffect(() => {
    const loadSOSHistory = async () => {
      if (!token) return;
      try {
        const response = await fetch(`${API_URL}/sos/my`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setSosHistory(data.data || []);
        }
      } catch (error) {
        console.error('Failed to fetch SOS history:', error);
      }
    };
    loadSOSHistory();
  }, [token]);

  const addNotification = (message: string, type: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 5000);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const result = await dispatch(fetchShelters()).unwrap();
      if (result.data) {
        dispatch(setShelters(result.data));
      }
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setIsRefreshing(false);
  };

  const startSOSCountdown = () => {
    setShowSOSModal(true);
    setSOSCountdown(5);
  };

  useEffect(() => {
    if (sosCountdown > 0) {
      const timer = setTimeout(() => setSOSCountdown(sosCountdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (sosCountdown === 0 && showSOSModal && !isSendingSOS) {
      sendSOS();
    }
  }, [sosCountdown, showSOSModal]);

  const cancelSOS = () => {
    setShowSOSModal(false);
    setSOSCountdown(0);
    setSosMessage('');
  };

  const sendSOS = async () => {
    if (isSendingSOS) return;
    setIsSendingSOS(true);

    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000
        });
      });

      const response = await fetch(`${API_URL}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          location: {
            type: 'Point',
            coordinates: [position.coords.longitude, position.coords.latitude]
          },
          details: sosMessage || 'Emergency SOS from SafeRoute App'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSosHistory(prev => [data.data, ...prev]);
        addNotification('🚨 SOS Alert Sent! Rescue teams have been notified.', 'success');
        setShowSOSModal(false);
        setSosMessage('');
      } else {
        throw new Error('Failed to send SOS');
      }
    } catch (error) {
      console.error('SOS Error:', error);
      addNotification('Failed to send SOS. Please try again.', 'error');
    }

    setIsSendingSOS(false);
  };

  const openShelters = shelters.filter(s => s.status === 'OPEN');
  const totalCapacity = shelters.reduce((sum, s) => sum + (s.capacity.total - s.capacity.current), 0);
  const pendingSOS = sosHistory.filter(s => s.status === 'PENDING' || s.status === 'ACKNOWLEDGED');

  // Calculate distance from user location (if available)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.log('Location not available')
    );
  }, []);

  // Calculate distance between two points
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Get recommended shelters (nearest with availability)
  const recommendedShelters = shelters
    .filter(s => s.status === 'OPEN' && s.capacity.current < s.capacity.total)
    .map(s => ({
      ...s,
      distance: userLocation
        ? calculateDistance(userLocation.lat, userLocation.lng, s.location.coordinates[1], s.location.coordinates[0])
        : 999
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-y-auto overflow-x-hidden">
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {[...Array(15)].map((_, i) => (
          <BackgroundParticle key={i} delay={i * 0.5} />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Notifications */}
      <div className="fixed top-4 right-4 z-[100] space-y-2">
        <AnimatePresence>
          {notifications.map(notif => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.9 }}
              className={`px-5 py-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-sm backdrop-blur-xl border ${notif.type === 'success'
                  ? 'bg-emerald-500/90 border-emerald-400/50 text-white'
                  : notif.type === 'error'
                    ? 'bg-rose-500/90 border-rose-400/50 text-white'
                    : 'bg-blue-500/90 border-blue-400/50 text-white'
                }`}
            >
              {notif.type === 'success' ? (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Bell className="w-5 h-5" />
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
      <div className="relative z-10">
        {/* Hero Header Section */}
        <div className="bg-gradient-to-b from-blue-600/20 via-slate-900/50 to-transparent pb-8">
          <div className="px-6 pt-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg shadow-blue-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Shield className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-lg font-bold text-white">SafeRoute</h1>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                        Live Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-rose-400 text-xs font-medium">
                        <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                        Offline
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refreshData}
                disabled={isRefreshing}
                className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors"
              >
                <RefreshCw className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
              </motion.button>
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
                  <h2 className="text-2xl font-bold text-white">{user?.username || 'User'}</h2>
                  <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Stay safe and informed
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={startSOSCountdown}
                    className="px-6 py-3 bg-gradient-to-r from-rose-500 via-rose-600 to-rose-500 bg-[length:200%_100%] hover:bg-right rounded-xl text-white font-bold flex items-center gap-2 shadow-lg shadow-rose-500/40 transition-all duration-300"
                  >
                    <AlertTriangle className="w-5 h-5" />
                    Emergency SOS
                  </motion.button>
                  {pendingSOS.length > 0 && (
                    <span className="text-xs text-rose-400 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-pulse" />
                      {pendingSOS.length} active alert{pendingSOS.length > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <StatsCard
                icon={Home}
                value={openShelters.length}
                label="Open Shelters"
                color="from-emerald-600/80 to-emerald-700/80"
                trend="Live"
              />
              <StatsCard
                icon={Users}
                value={totalCapacity}
                label="Available Spots"
                color="from-blue-600/80 to-blue-700/80"
              />
              <StatsCard
                icon={Zap}
                value={pendingSOS.length}
                label="Active Alerts"
                color="from-rose-600/80 to-rose-700/80"
              />
              <StatsCard
                icon={Shield}
                value={shelters.length}
                label="Total Shelters"
                color="from-indigo-600/80 to-indigo-700/80"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6 -mt-2">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-1.5 border border-slate-700/50">
            <div className="flex gap-2">
              {[
                { id: 'map', label: 'Map', icon: Map, count: 0 },
                { id: 'shelters', label: 'Shelters', icon: Home, count: openShelters.length },
                { id: 'history', label: 'My Alerts', icon: History, count: pendingSOS.length }
              ].map((tab) => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as 'map' | 'shelters' | 'history')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 ${activeTab === tab.id
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-600 text-slate-300'
                      }`}>
                      {tab.count}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 pt-4 pb-24">
          <AnimatePresence mode="wait">
            {activeTab === 'map' && (
              <motion.div
                key="map"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6 overflow-y-auto"
                style={{ maxHeight: '70vh' }}
              >
                {/* Recommendations Section */}
                {recommendedShelters.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="p-2 rounded-xl bg-amber-500/20">
                        <Star className="w-5 h-5 text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">Recommended for You</h3>
                        <p className="text-xs text-slate-400">Based on your location and availability</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {recommendedShelters.map((shelter, idx) => (
                        <motion.div
                          key={shelter._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          className="relative bg-gradient-to-r from-amber-500/10 via-slate-800/50 to-slate-800/50 border border-amber-500/30 rounded-2xl p-4"
                        >
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                            #{idx + 1} Best Match
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex-1 pr-4">
                              <div className="flex items-center gap-2 mb-1">
                                <StatusBadge status={shelter.status} />
                                {userLocation && (
                                  <span className="text-xs text-blue-400 flex items-center gap-1">
                                    <Navigation className="w-3 h-3" />
                                    {shelter.distance.toFixed(1)} km away
                                  </span>
                                )}
                              </div>
                              <h4 className="text-white font-semibold">{shelter.name}</h4>
                              <p className="text-slate-400 text-sm truncate">{shelter.address}</p>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-emerald-400 text-sm font-medium">
                                  {shelter.capacity.total - shelter.capacity.current} spots available
                                </span>
                                <div className="flex items-center gap-1">
                                  {shelter.resources.food && <Utensils className="w-3 h-3 text-emerald-400" />}
                                  {shelter.resources.water && <Droplets className="w-3 h-3 text-blue-400" />}
                                  {shelter.resources.medical && <Heart className="w-3 h-3 text-rose-400" />}
                                </div>
                              </div>
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.location.coordinates[1]},${shelter.location.coordinates[0]}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/30 hover:scale-105 transition-transform"
                            >
                              <Navigation className="w-5 h-5" />
                            </a>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Map Section */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-blue-500/20">
                        <Map className="w-5 h-5 text-blue-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Shelter Map</h3>
                    </div>
                    {userLocation && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 bg-emerald-500/20 px-3 py-1.5 rounded-full">
                        <Locate className="w-3 h-3" />
                        Location Active
                      </span>
                    )}
                  </div>

                  {/* Interactive Map */}
                  <div className="relative bg-slate-800/50 border border-slate-700/50 rounded-2xl overflow-hidden" style={{ height: 400 }}>
                    <LiveMap shelters={shelters} userLocation={userLocation} />
                  </div>

                  {/* Shelter List Below Map */}
                  <div className="mt-4">
                    <p className="text-sm text-slate-400 mb-3">All {shelters.length} shelter locations:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                      {shelters.map((shelter) => {
                        const available = shelter.capacity.total - shelter.capacity.current;
                        return (
                          <motion.a
                            key={shelter._id}
                            href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.location.coordinates[1]},${shelter.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            whileHover={{ scale: 1.02 }}
                            className="flex items-center gap-3 p-3 bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 rounded-xl transition-all"
                          >
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${shelter.status === 'OPEN' ? 'bg-emerald-500' :
                                shelter.status === 'FULL' ? 'bg-amber-500' : 'bg-slate-500'
                              }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-white font-medium text-sm truncate">{shelter.name}</p>
                              <p className="text-slate-400 text-xs truncate">{shelter.address}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${available > 10 ? 'text-emerald-400' : available > 0 ? 'text-amber-400' : 'text-rose-400'
                                }`}>{available}</p>
                              <p className="text-xs text-slate-500">spots</p>
                            </div>
                            <Navigation className="w-4 h-4 text-blue-400 flex-shrink-0" />
                          </motion.a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'shelters' && (
              <motion.div
                key="shelters"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Nearby Shelters</h3>
                  <span className="text-sm text-slate-400">{shelters.length} locations</span>
                </div>

                {/* Shelter Cards */}
                <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                  {shelters.map((shelter, index) => {
                    const available = shelter.capacity.total - shelter.capacity.current;
                    const pct = Math.round((shelter.capacity.current / shelter.capacity.total) * 100);

                    return (
                      <motion.div
                        key={shelter._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 hover:border-blue-500/30 rounded-2xl p-5 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5"
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StatusBadge status={shelter.status} />
                              <span className="text-xs text-slate-500 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                Updated recently
                              </span>
                            </div>
                            <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                              {shelter.name}
                            </h3>
                            <p className="text-slate-400 text-sm flex items-center gap-1.5 mt-1">
                              <MapPin className="w-4 h-4 text-blue-400" />
                              {shelter.address}
                            </p>
                          </div>
                          <div className="text-right bg-slate-700/50 rounded-xl p-3">
                            <p className={`text-2xl font-bold ${pct >= 90 ? 'text-rose-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                              {available}
                            </p>
                            <p className="text-xs text-slate-400">spots left</p>
                          </div>
                        </div>

                        {/* Capacity Bar */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs mb-2">
                            <span className="text-slate-400">Capacity</span>
                            <span className={`font-medium ${pct >= 90 ? 'text-rose-400' : pct >= 70 ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                              {pct}% Full
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, ease: 'easeOut' }}
                              className={`h-full rounded-full ${pct >= 90
                                  ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                                  : pct >= 70
                                    ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                    : 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                }`}
                            />
                          </div>
                        </div>

                        {/* Resources */}
                        <div className="flex items-center gap-2 mb-4 flex-wrap">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${shelter.resources.food
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                            }`}>
                            <Utensils className="w-3.5 h-3.5" />Food
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${shelter.resources.water
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                            }`}>
                            <Droplets className="w-3.5 h-3.5" />Water
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${shelter.resources.medical
                              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                              : 'bg-slate-700/50 text-slate-500 border border-slate-600/30'
                            }`}>
                            <Heart className="w-3.5 h-3.5" />Medical
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <a
                            href={`tel:${shelter.phone}`}
                            className="flex-1 py-2.5 bg-slate-700/80 hover:bg-slate-600/80 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all border border-slate-600/50 hover:border-slate-500/50"
                          >
                            <Phone className="w-4 h-4" />
                            Call
                          </a>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${shelter.location.coordinates[1]},${shelter.location.coordinates[0]}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-500/20"
                          >
                            <Navigation className="w-4 h-4" />
                            Navigate
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </a>
                        </div>
                      </motion.div>
                    );
                  })}

                  {shelters.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-16"
                    >
                      <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                        <Home className="w-10 h-10 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">No Shelters Found</h3>
                      <p className="text-slate-400 text-sm">Pull down to refresh or check back later</p>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                {/* Section Header */}
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">Alert History</h3>
                  <span className="text-sm text-slate-400">{sosHistory.length} alerts</span>
                </div>

                {sosHistory.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-16"
                  >
                    <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                      <History className="w-10 h-10 text-slate-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No SOS History</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto">
                      Your emergency alerts will appear here. Stay safe!
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '60vh' }}>
                    {sosHistory.map((sos, index) => (
                      <motion.div
                        key={sos._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`relative overflow-hidden rounded-2xl border-2 p-5 transition-all ${sos.status === 'PENDING'
                            ? 'border-rose-500/50 bg-rose-500/10'
                            : sos.status === 'ACKNOWLEDGED'
                              ? 'border-blue-500/50 bg-blue-500/10'
                              : 'border-emerald-500/50 bg-emerald-500/10'
                          }`}
                      >
                        {/* Animated background for active alerts */}
                        {(sos.status === 'PENDING' || sos.status === 'ACKNOWLEDGED') && (
                          <div className="absolute inset-0 overflow-hidden">
                            <motion.div
                              className={`absolute -inset-full ${sos.status === 'PENDING' ? 'bg-rose-500/5' : 'bg-blue-500/5'
                                }`}
                              animate={{
                                rotate: 360
                              }}
                              transition={{
                                duration: 10,
                                repeat: Infinity,
                                ease: 'linear'
                              }}
                              style={{
                                background: `conic-gradient(from 0deg, transparent, ${sos.status === 'PENDING' ? 'rgba(244, 63, 94, 0.1)' : 'rgba(59, 130, 246, 0.1)'
                                  }, transparent)`
                              }}
                            />
                          </div>
                        )}

                        <div className="relative">
                          <div className="flex items-center justify-between mb-3">
                            <StatusBadge status={sos.status} size="md" />
                            <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              {formatDistanceToNow(new Date(sos.timestamp), { addSuffix: true })}
                            </span>
                          </div>

                          <p className="text-slate-200 text-sm mb-3 line-clamp-2">
                            {sos.details || 'Emergency SOS Alert'}
                          </p>

                          <div className="flex items-center justify-between">
                            <p className="text-xs text-slate-500 flex items-center gap-1.5">
                              <MapPin className="w-3.5 h-3.5" />
                              {sos.location.coordinates[1].toFixed(4)}, {sos.location.coordinates[0].toFixed(4)}
                            </p>

                            {sos.status === 'ACKNOWLEDGED' && (
                              <span className="text-xs text-blue-400 flex items-center gap-1.5 font-medium">
                                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                                Help is on the way
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* SOS Modal */}
      <AnimatePresence>
        {showSOSModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 rounded-3xl p-8 w-full max-w-sm shadow-2xl"
            >
              {sosCountdown > 0 ? (
                <div className="text-center">
                  <div className="relative w-36 h-36 mx-auto mb-6">
                    {/* Outer pulse rings */}
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute inset-0 rounded-full border-2 border-rose-500/40"
                        animate={{
                          scale: [1, 2],
                          opacity: [0.6, 0]
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.5
                        }}
                      />
                    ))}
                    {/* Main countdown circle */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-rose-500 to-rose-700 flex items-center justify-center shadow-2xl shadow-rose-500/50">
                      <span className="text-6xl font-bold text-white">{sosCountdown}</span>
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">Sending SOS Alert</h2>
                  <p className="text-slate-400 text-sm mb-8 max-w-xs mx-auto">
                    Emergency services will be notified with your current location
                  </p>

                  <button
                    onClick={cancelSOS}
                    className="w-full py-4 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-colors border border-slate-600"
                  >
                    <X className="w-5 h-5" />
                    Cancel Alert
                  </button>
                </div>
              ) : isSendingSOS ? (
                <div className="text-center py-8">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-rose-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-3 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-rose-500" />
                    </div>
                  </div>
                  <p className="text-xl font-semibold text-white">Sending SOS...</p>
                  <p className="text-slate-400 text-sm mt-2">Please wait</p>
                </div>
              ) : (
                <div className="text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/40"
                  >
                    <CheckCircle2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-white mb-2">SOS Sent!</h2>
                  <p className="text-slate-400 text-sm">Help is on the way. Stay where you are.</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
