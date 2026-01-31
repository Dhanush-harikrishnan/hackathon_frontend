import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '../store';
import { realtimeAlertUpdate, setAlerts } from '../store/slices/sosSlice';
import { fetchSOSAlerts, acknowledgeSOSAlert, resolveSOSAlert } from '../store/slices/apiSlice';
import {
  AlertTriangle,
  MapPin,
  Clock,
  User,
  CheckCircle2,
  Navigation,
  Phone,
  MessageSquare,
  Radio,
  Siren,
  Shield,
  Activity,
  Bell,
  RefreshCw,
  X,
  ExternalLink,
  Target,
  Zap
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const SOCKET_URL = 'http://localhost:3001';

// Animated background particle
const BackgroundParticle = ({ delay }: { delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 bg-rose-500/20 rounded-full"
    initial={{ x: Math.random() * 100 + '%', y: '100%', opacity: 0 }}
    animate={{ y: '-100%', opacity: [0, 1, 0] }}
    transition={{ duration: 10 + Math.random() * 5, delay, repeat: Infinity, ease: 'linear' }}
  />
);

// Status Badge Component
const StatusBadge = ({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' | 'lg' }) => {
  const config = {
    pending: { bg: 'bg-rose-500/20', text: 'text-rose-400', dot: 'bg-rose-500 animate-pulse', label: 'PENDING' },
    acknowledged: { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500 animate-pulse', label: 'IN PROGRESS' },
    resolved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500', label: 'RESOLVED' },
  };
  const c = config[status as keyof typeof config] || config.pending;
  const sizeClasses = size === 'lg' ? 'px-4 py-2 text-sm' : size === 'md' ? 'px-3 py-1.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-2 rounded-full font-semibold ${c.bg} ${sizeClasses}`}>
      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      <span className={c.text}>{c.label}</span>
    </span>
  );
};

// Stats Card Component
function StatsCard({
  icon: Icon,
  label,
  value,
  color,
  pulse = false,
  delay = 0
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  color: string;
  pulse?: boolean;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`relative overflow-hidden rounded-2xl p-4 border border-white/10 ${color}`}
    >
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10" />
      <div className="relative flex items-center gap-3">
        <div className={`p-3 rounded-xl bg-white/10 ${pulse ? 'animate-pulse' : ''}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-3xl font-bold text-white">{value}</p>
          <p className="text-sm text-white/70">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Alert Card Component
function AlertCard({
  alert,
  onAcknowledge,
  onResolve,
  onNavigate,
  isExpanded,
  onToggleExpand,
  index
}: {
  alert: RootState['sos']['alerts'][0];
  onAcknowledge: () => void;
  onResolve: () => void;
  onNavigate: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) {
  const isPending = alert.status === 'pending';
  const isAcknowledged = alert.status === 'acknowledged';

  const getBorderColor = () => {
    if (isPending) return 'border-rose-500/50 hover:border-rose-500';
    if (isAcknowledged) return 'border-blue-500/50 hover:border-blue-500';
    return 'border-emerald-500/50 hover:border-emerald-500';
  };

  const getBgColor = () => {
    if (isPending) return 'bg-rose-500/5';
    if (isAcknowledged) return 'bg-blue-500/5';
    return 'bg-emerald-500/5';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative rounded-2xl border-2 p-5 transition-all cursor-pointer backdrop-blur-sm ${getBorderColor()} ${getBgColor()}`}
      onClick={onToggleExpand}
    >
      {/* Urgent pulse effect for pending alerts */}
      {isPending && (
        <div className="absolute inset-0 rounded-2xl overflow-hidden pointer-events-none">
          <motion.div
            className="absolute inset-0 bg-rose-500/10"
            animate={{ opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      )}

      {/* Header */}
      <div className="relative flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <motion.div
            className={`p-3 rounded-xl ${isPending ? 'bg-gradient-to-br from-rose-500 to-rose-600 shadow-lg shadow-rose-500/30' :
                isAcknowledged ? 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30' :
                  'bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30'
              }`}
            animate={isPending ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 1, repeat: isPending ? Infinity : 0 }}
          >
            {isPending ? (
              <Siren className="w-6 h-6 text-white" />
            ) : isAcknowledged ? (
              <Radio className="w-6 h-6 text-white" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-white" />
            )}
          </motion.div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <StatusBadge status={alert.status} size="md" />
              {isPending && (
                <motion.span
                  className="text-xs text-rose-400 font-bold bg-rose-500/20 px-2 py-0.5 rounded-full"
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  🚨 URGENT
                </motion.span>
              )}
            </div>
            <p className="text-sm text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
            </p>
          </div>
        </div>

        {/* User info */}
        <div className="text-right">
          <p className="text-white font-semibold flex items-center gap-2 justify-end">
            <User className="w-4 h-4 text-slate-400" />
            {alert.userName || 'Unknown User'}
          </p>
          <p className="text-xs text-slate-500 mt-1 font-mono">ID: {alert._id.slice(-8)}</p>
        </div>
      </div>

      {/* Location */}
      <div className="flex items-center gap-2 text-slate-300 text-sm mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span className="font-mono">{alert.lat.toFixed(6)}, {alert.lng.toFixed(6)}</span>
        <button
          onClick={(e) => { e.stopPropagation(); onNavigate(); }}
          className="ml-auto p-1.5 hover:bg-slate-700/50 rounded-lg transition-colors"
        >
          <ExternalLink className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Notes */}
      {alert.notes && (
        <div className="flex items-start gap-3 text-slate-300 text-sm mb-4 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
          <MessageSquare className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
          <span className="leading-relaxed">{alert.notes}</span>
        </div>
      )}

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t border-slate-700/50">
              {/* Actions */}
              <div className="flex gap-3">
                {isPending && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={(e) => { e.stopPropagation(); onAcknowledge(); }}
                    className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
                  >
                    <Radio className="w-5 h-5" />
                    Acknowledge Alert
                  </motion.button>
                )}

                {(isPending || isAcknowledged) && (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => { e.stopPropagation(); onNavigate(); }}
                      className="flex-1 py-3.5 rounded-xl bg-slate-700/80 text-white font-semibold flex items-center justify-center gap-2 hover:bg-slate-600/80 transition-all border border-slate-600/50"
                    >
                      <Navigation className="w-5 h-5" />
                      Navigate
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => { e.stopPropagation(); onResolve(); }}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-emerald-700 transition-all shadow-lg shadow-emerald-500/30"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Mark Resolved
                    </motion.button>
                  </>
                )}
              </div>

              {/* Quick Contact */}
              <div className="mt-4 flex gap-3">
                <a
                  href="tel:911"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                >
                  <Phone className="w-4 h-4" />
                  Contact User
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}&travelmode=driving`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex-1 py-3 rounded-xl bg-slate-800/50 text-slate-300 text-sm font-medium flex items-center justify-center gap-2 hover:bg-slate-700/50 transition-colors border border-slate-700/50"
                >
                  <Target className="w-4 h-4" />
                  Open in Maps
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expand indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <motion.div
          animate={{ y: isExpanded ? 0 : [0, 3, 0] }}
          transition={{ duration: 1.5, repeat: isExpanded ? 0 : Infinity }}
          className="w-8 h-1 bg-slate-600 rounded-full opacity-50"
        />
      </div>
    </motion.div>
  );
}

// Main Rescue Dashboard Component
export default function RescueTeamDashboard({ onBack: _onBack }: { onBack?: () => void }) {
  void _onBack; // Reserved for future navigation
  const dispatch = useDispatch<AppDispatch>();
  const alerts = useSelector((state: RootState) => state.sos.alerts);
  const user = useSelector((state: RootState) => state.auth.user);

  const [filter, setFilter] = useState<'all' | 'pending' | 'acknowledged' | 'resolved'>('all');
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'alert' | 'success' | 'info' }>>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Socket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });

    newSocket.on('connect', () => {
      setIsConnected(true);
      newSocket.emit('join_room', 'rescue_team_room');
    });

    newSocket.on('disconnect', () => setIsConnected(false));

    newSocket.on('new_emergency', (data: { sos: typeof alerts[0] }) => {
      dispatch(realtimeAlertUpdate(data.sos));
      setLastUpdate(new Date());
      addNotification('🚨 New SOS Alert received!', 'alert');
      playAlertSound();
    });

    newSocket.on('sos_resolved', (data: { sosId: string }) => {
      const alert = alerts.find(a => a._id === data.sosId);
      if (alert) {
        dispatch(realtimeAlertUpdate({ ...alert, status: 'resolved' }));
      }
      setLastUpdate(new Date());
    });

    setSocket(newSocket);
    return () => { newSocket.close(); };
  }, [dispatch]);

  // Fetch alerts on mount
  useEffect(() => {
    const loadAlerts = async () => {
      try {
        const result = await dispatch(fetchSOSAlerts()).unwrap();
        if (result.data) {
          dispatch(setAlerts(result.data));
        } else if (result && Array.isArray(result)) {
          dispatch(setAlerts(result));
        }
        setLastUpdate(new Date());
      } catch (error) {
        console.error('Failed to fetch alerts:', error);
        addNotification('Failed to load alerts', 'alert');
      }
    };
    loadAlerts();

    const interval = setInterval(loadAlerts, 15000);
    return () => clearInterval(interval);
  }, [dispatch]);

  const addNotification = (message: string, type: 'alert' | 'success' | 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      const result = await dispatch(fetchSOSAlerts()).unwrap();
      if (result.data) {
        dispatch(setAlerts(result.data));
      }
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to refresh:', error);
    }
    setIsRefreshing(false);
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      console.log('Audio not supported');
    }
  };

  // Calculate stats
  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const acknowledgedCount = alerts.filter(a => a.status === 'acknowledged').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  // Filter alerts
  const filteredAlerts = filter === 'all'
    ? alerts
    : alerts.filter(a => a.status === filter);

  // Sort alerts: pending first, then by timestamp
  const sortedAlerts = [...filteredAlerts].sort((a, b) => {
    if (a.status === 'pending' && b.status !== 'pending') return -1;
    if (a.status !== 'pending' && b.status === 'pending') return 1;
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
  });

  const handleAcknowledge = async (alertId: string) => {
    const alert = alerts.find(a => a._id === alertId);
    if (!alert) return;

    dispatch(realtimeAlertUpdate({ ...alert, status: 'acknowledged' }));

    try {
      await dispatch(acknowledgeSOSAlert(alertId)).unwrap();

      if (socket && isConnected) {
        socket.emit('acknowledge_sos', { sosId: alertId });
      }

      addNotification('Alert acknowledged successfully', 'success');
    } catch (error) {
      dispatch(realtimeAlertUpdate(alert));
      addNotification('Failed to acknowledge alert', 'alert');
    }
  };

  const handleResolve = async (alertId: string) => {
    const alert = alerts.find(a => a._id === alertId);
    if (!alert) return;

    dispatch(realtimeAlertUpdate({ ...alert, status: 'resolved' }));

    try {
      await dispatch(resolveSOSAlert(alertId)).unwrap();

      if (socket && isConnected) {
        socket.emit('resolve_sos', { sosId: alertId });
      }

      addNotification('Alert resolved successfully', 'success');
    } catch (error) {
      dispatch(realtimeAlertUpdate(alert));
      addNotification('Failed to resolve alert', 'alert');
    }
  };

  const handleNavigate = (alert: RootState['sos']['alerts'][0]) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${alert.lat},${alert.lng}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <BackgroundParticle key={i} delay={i * 0.7} />
        ))}
      </div>

      {/* Gradient orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

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
                    : 'bg-blue-500/90 border-blue-400/50 text-white'
                }`}
            >
              {notif.type === 'alert' ? (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
              ) : notif.type === 'success' ? (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-1.5 bg-white/20 rounded-full">
                  <Activity className="w-5 h-5" />
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
        {/* Hero Header */}
        <div className="bg-gradient-to-b from-rose-600/10 via-transparent to-transparent pb-6">
          <div className="px-6 pt-6">
            {/* Top Bar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <motion.div
                  className="p-3 bg-gradient-to-br from-rose-500 to-rose-600 rounded-xl shadow-lg shadow-rose-500/30"
                  whileHover={{ scale: 1.05 }}
                >
                  <Siren className="w-6 h-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-xl font-bold text-white">Rescue Command</h1>
                  <div className="flex items-center gap-2 mt-1">
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

              <div className="flex items-center gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={refreshData}
                  disabled={isRefreshing}
                  className="p-2.5 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl border border-slate-700 transition-colors"
                >
                  <RefreshCw className={`w-5 h-5 text-slate-300 ${isRefreshing ? 'animate-spin' : ''}`} />
                </motion.button>

                {/* Duty Status Toggle */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setIsOnDuty(!isOnDuty)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${isOnDuty
                      ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-400'
                      : 'bg-slate-800/80 border border-slate-700 text-slate-400'
                    }`}
                >
                  <div className={`w-2 h-2 rounded-full ${isOnDuty ? 'bg-emerald-500 animate-pulse' : 'bg-slate-500'
                    }`} />
                  <span className="font-medium text-sm">{isOnDuty ? 'On Duty' : 'Off Duty'}</span>
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
                  <h2 className="text-2xl font-bold text-white">{user?.username || 'Rescue Officer'}</h2>
                  <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-rose-400" />
                    Ready to respond to emergencies
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-300">Last updated: {lastUpdate.toLocaleTimeString()}</span>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <StatsCard
                icon={AlertTriangle}
                label="Pending"
                value={pendingCount}
                color="bg-gradient-to-br from-rose-600/80 to-rose-700/80"
                pulse={pendingCount > 0}
                delay={0}
              />
              <StatsCard
                icon={Activity}
                label="In Progress"
                value={acknowledgedCount}
                color="bg-gradient-to-br from-blue-600/80 to-blue-700/80"
                delay={0.1}
              />
              <StatsCard
                icon={CheckCircle2}
                label="Resolved"
                value={resolvedCount}
                color="bg-gradient-to-br from-emerald-600/80 to-emerald-700/80"
                delay={0.2}
              />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 -mt-2">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-1.5 border border-slate-700/50">
            <div className="flex gap-2">
              {(['all', 'pending', 'acknowledged', 'resolved'] as const).map((tab) => (
                <motion.button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all ${filter === tab
                      ? tab === 'pending'
                        ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                >
                  {tab === 'all' ? 'All Alerts' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                  {tab === 'pending' && pendingCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${filter === tab
                        ? 'bg-white/20 text-white'
                        : 'bg-rose-500 text-white animate-pulse'
                      }`}>
                      {pendingCount}
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* Alert List */}
        <div className="p-6 pt-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Emergency Alerts</h3>
            <span className="text-sm text-slate-400">{sortedAlerts.length} alerts</span>
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {sortedAlerts.length > 0 ? (
                sortedAlerts.map((alert, index) => (
                  <AlertCard
                    key={alert._id}
                    alert={alert}
                    isExpanded={expandedAlertId === alert._id}
                    onToggleExpand={() => setExpandedAlertId(
                      expandedAlertId === alert._id ? null : alert._id
                    )}
                    onAcknowledge={() => handleAcknowledge(alert._id)}
                    onResolve={() => handleResolve(alert._id)}
                    onNavigate={() => handleNavigate(alert)}
                    index={index}
                  />
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-slate-700/50">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">All Clear</h3>
                  <p className="text-slate-400 max-w-xs mx-auto">
                    {filter === 'all'
                      ? 'No active alerts at this time. Great job!'
                      : `No ${filter} alerts found`
                    }
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Pending Alert Banner */}
        <AnimatePresence>
          {pendingCount > 0 && filter !== 'pending' && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="fixed bottom-6 left-6 right-6 z-50"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilter('pending')}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-bold flex items-center justify-center gap-3 shadow-2xl shadow-rose-500/40 border border-rose-400/50"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                >
                  <Siren className="w-6 h-6" />
                </motion.div>
                {pendingCount} Pending {pendingCount === 1 ? 'Alert' : 'Alerts'} - Tap to View
                <Zap className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
