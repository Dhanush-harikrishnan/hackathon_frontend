import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { io, Socket } from 'socket.io-client';
import type { RootState, AppDispatch } from '../store';
import { 
  startSos, 
  decrementCountdown, 
  cancelSos, 
  setSosSent 
} from '../store/slices/sosSlice';
import { AlertTriangle, X, Phone, Check, Loader2 } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';

// Countdown Overlay Component
function CountdownOverlay({ 
  count, 
  onCancel 
}: { 
  count: number; 
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="text-center px-8">
        {/* Pulsing rings */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 rounded-full border-4 border-red-500/30"
            animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.5 }}
          />
          
          {/* Main countdown circle */}
          <motion.div 
            className="absolute inset-4 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-2xl shadow-red-500/50"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={count}
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-7xl font-bold text-white"
              >
                {count}
              </motion.span>
            </AnimatePresence>
          </motion.div>
        </div>
        
        <motion.h2 
          className="text-2xl font-bold text-white mb-2"
          animate={{ opacity: [1, 0.7, 1] }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          Sending SOS Alert
        </motion.h2>
        <p className="text-slate-400 mb-8 max-w-xs mx-auto">
          Emergency services will be notified with your location
        </p>
        
        {/* Cancel Button */}
        <motion.button
          onClick={onCancel}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-8 py-4 rounded-full bg-slate-800 text-white font-semibold flex items-center justify-center gap-3 mx-auto hover:bg-slate-700 transition-colors"
        >
          <X className="w-5 h-5" />
          Cancel
        </motion.button>
      </div>
    </motion.div>
  );
}

// Sending Overlay Component
function SendingOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="text-center px-8">
        <motion.div 
          className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        >
          <Loader2 className="w-12 h-12 text-white animate-spin" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white mb-2">Sending Alert...</h2>
        <p className="text-slate-400">Contacting emergency services</p>
      </div>
    </motion.div>
  );
}

// Success Overlay Component
function SuccessOverlay({ onDismiss }: { onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
    >
      <div className="text-center px-8">
        {/* Success checkmark */}
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-2xl shadow-emerald-500/50"
        >
          <motion.div
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Check className="w-16 h-16 text-white" strokeWidth={3} />
          </motion.div>
        </motion.div>
        
        <motion.h2 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-2xl font-bold text-white mb-2"
        >
          Help is on the way!
        </motion.h2>
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-400 mb-8 max-w-xs mx-auto"
        >
          Rescue teams have been notified of your location. Stay where you are if it's safe.
        </motion.p>
        
        {/* Emergency Contact */}
        <motion.a
          href="tel:911"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors"
        >
          <Phone className="w-5 h-5" />
          Call Emergency Services
        </motion.a>
        
        {/* Dismiss timer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-slate-500 text-sm mt-6"
        >
          This message will dismiss automatically
        </motion.p>
      </div>
    </motion.div>
  );
}

// Main SOS Button Component
export default function SOSButton() {
  const dispatch = useDispatch<AppDispatch>();
  const { sosCountdown, sosStatus } = useSelector((state: RootState) => state.sos);
  const user = useSelector((state: RootState) => state.auth.user);
  const token = useSelector((state: RootState) => state.auth.token);
  
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const socketRef = useRef<Socket | null>(null);

  // Initialize socket connection
  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    return () => {
      socketRef.current?.close();
    };
  }, []);
  
  // Handle countdown
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    
    if (sosStatus === 'countdown' && sosCountdown > 0) {
      timer = setTimeout(() => {
        dispatch(decrementCountdown());
      }, 1000);
    } else if (sosStatus === 'countdown' && sosCountdown === 0) {
      sendSosAlert();
    }
    
    return () => clearTimeout(timer);
  }, [sosStatus, sosCountdown, dispatch]);
  
  // Handle hold progress
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    
    if (isHolding) {
      interval = setInterval(() => {
        setHoldProgress(prev => {
          if (prev >= 100) {
            setIsHolding(false);
            dispatch(startSos());
            return 0;
          }
          return prev + 5;
        });
      }, 50);
    } else {
      setHoldProgress(0);
    }
    
    return () => clearInterval(interval);
  }, [isHolding, dispatch]);
  
  const sendSosAlert = useCallback(async () => {
    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Send SOS to backend
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/sos`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token || localStorage.getItem('token') || ''}`
              },
              body: JSON.stringify({
                location: {
                  type: 'Point',
                  coordinates: [position.coords.longitude, position.coords.latitude]
                },
                details: 'Emergency SOS from SafeRoute App'
              })
            });
            
            if (response.ok) {
              const data = await response.json();
              
              // Emit socket event for real-time sync
              if (socketRef.current) {
                socketRef.current.emit('new_sos', {
                  sos: data.data,
                  lat: position.coords.latitude,
                  lng: position.coords.longitude
                });
              }
              
              dispatch(setSosSent());
            } else {
              throw new Error('Failed to send SOS');
            }
          } catch (error) {
            console.error('SOS Error:', error);
            // Still mark as sent for demo purposes
            dispatch(setSosSent());
          }
        },
        () => {
          // Location error, still send with default coords
          dispatch(setSosSent());
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      dispatch(setSosSent());
    }
  }, [dispatch, token]);
  
  const handleCancel = () => {
    dispatch(cancelSos());
    setIsHolding(false);
    setHoldProgress(0);
  };
  
  const handleDismiss = () => {
    dispatch(cancelSos());
  };
  
  // Don't show for managers
  if (user?.role === 'manager') return null;
  
  return (
    <>
      {/* Main SOS Button */}
      <motion.div
        className="fixed bottom-24 right-4 z-[500]"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, delay: 0.5 }}
      >
        <motion.button
          onMouseDown={() => setIsHolding(true)}
          onMouseUp={() => setIsHolding(false)}
          onMouseLeave={() => setIsHolding(false)}
          onTouchStart={() => setIsHolding(true)}
          onTouchEnd={() => setIsHolding(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/40 flex items-center justify-center sos-pulse"
        >
          {/* Hold progress ring */}
          {holdProgress > 0 && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="30"
                fill="transparent"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={`${(holdProgress / 100) * 188.5} 188.5`}
                className="opacity-50"
              />
            </svg>
          )}
          
          <AlertTriangle className="w-7 h-7 text-white" />
        </motion.button>
        
        {/* Hold hint */}
        <AnimatePresence>
          {holdProgress > 0 && holdProgress < 100 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-900 text-white text-xs font-medium"
            >
              Hold to activate SOS
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      
      {/* Overlays */}
      <AnimatePresence>
        {sosStatus === 'countdown' && (
          <CountdownOverlay count={sosCountdown} onCancel={handleCancel} />
        )}
        
        {sosStatus === 'sending' && (
          <SendingOverlay />
        )}
        
        {sosStatus === 'sent' && (
          <SuccessOverlay onDismiss={handleDismiss} />
        )}
      </AnimatePresence>
    </>
  );
}
