// EmergencySOS - ONE-TAP Emergency Alert
// Simplified for disaster scenarios - NO CODE ENTRY NEEDED
// Auto-broadcasts to ALL nearby devices instantly via Socket.io

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, Check, Loader2, Users } from 'lucide-react';
import { useMeshNetwork, type P2PSOSMessage } from '../hooks/useMeshNetwork';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { useSocket } from '../hooks/useSocket';

export default function EmergencySOS() {
    const { isOffline } = useNetworkStatus();
    const { sendSOS, totalQueuedSOS } = useMeshNetwork();
    const { emit, isConnected } = useSocket();

    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [showReceived, setShowReceived] = useState(false);
    const [receivedSOS, setReceivedSOS] = useState<P2PSOSMessage | null>(null);

    // Listen for P2P SOS from other devices (via Socket.io)
    useEffect(() => {
        const handleP2PSOS = () => {
            // Read from localStorage (set by useSocket)
            const stored = localStorage.getItem('mesh_received_sos');
            if (stored) {
                const messages: P2PSOSMessage[] = JSON.parse(stored);
                if (messages.length > 0) {
                    setReceivedSOS(messages[messages.length - 1]);
                    setShowReceived(true);
                }
            }
        };

        // Listen for custom event from useSocket
        window.addEventListener('p2p_sos_received', handleP2PSOS);

        // Also check on mount
        handleP2PSOS();

        return () => {
            window.removeEventListener('p2p_sos_received', handleP2PSOS);
        };
    }, []);

    // ONE-TAP SOS - Gets location and broadcasts immediately
    const handleEmergencySOS = useCallback(async () => {
        setSending(true);

        let location: { lat: number; lng: number } | undefined;

        // Get location (with timeout for speed)
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false, // Faster
                    timeout: 3000, // 3 second max
                    maximumAge: 60000
                });
            });
            location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
        } catch {
            // Continue without location
        }

        const sosMessage = {
            id: `sos-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
            senderId: localStorage.getItem('mesh_device_id') || 'unknown',
            timestamp: Date.now(),
            location,
            message: 'EMERGENCY! Need immediate help!',
            priority: 'high' as const,
            hops: 0,
            originDevice: localStorage.getItem('mesh_device_id') || 'unknown'
        };

        // Send via Socket.io (works across devices on hosted app!)
        if (isConnected && !isOffline) {
            emit('p2p_sos_broadcast', sosMessage);
            console.log('📡 SOS sent via Socket.io to all devices');
        }

        // Also send via local mesh (for offline/same-device)
        sendSOS(location, 'EMERGENCY! Need immediate help!');

        setSending(false);
        setSent(true);

        // Reset after 5 seconds
        setTimeout(() => setSent(false), 5000);
    }, [emit, isConnected, isOffline, sendSOS]);

    return (
        <>
            {/* BIG EMERGENCY BUTTON - Fixed bottom center */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
                <motion.button
                    onClick={handleEmergencySOS}
                    disabled={sending}
                    whileTap={{ scale: 0.9 }}
                    className={`relative w-24 h-24 rounded-full shadow-2xl flex items-center justify-center transition-all ${sent
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                        : 'bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                        }`}
                >
                    {/* Pulsing ring when offline (P2P active) */}
                    {isOffline && !sent && (
                        <>
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-red-400"
                                animate={{ scale: [1, 1.3, 1], opacity: [0.8, 0, 0.8] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-full border-4 border-red-400"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
                                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                            />
                        </>
                    )}

                    {/* Button content */}
                    {sending ? (
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                    ) : sent ? (
                        <Check className="w-10 h-10 text-white" />
                    ) : (
                        <div className="text-center">
                            <AlertTriangle className="w-8 h-8 text-white mx-auto" />
                            <span className="text-white text-xs font-bold mt-1 block">SOS</span>
                        </div>
                    )}
                </motion.button>

                {/* Status label */}
                <div className="text-center mt-2">
                    {sent ? (
                        <motion.span
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-emerald-400 text-xs font-bold"
                        >
                            ✓ SOS Broadcast sent!
                        </motion.span>
                    ) : isOffline ? (
                        <span className="text-amber-400 text-xs font-medium flex items-center justify-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" />
                            Offline P2P Mode
                        </span>
                    ) : isConnected ? (
                        <span className="text-emerald-400 text-xs font-medium flex items-center justify-center gap-1">
                            <Radio className="w-3 h-3" />
                            Connected • Ready
                        </span>
                    ) : (
                        <span className="text-slate-400 text-xs">Tap for emergency</span>
                    )}
                </div>
            </div>

            {/* Received SOS Alert */}
            <AnimatePresence>
                {showReceived && receivedSOS && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className="fixed top-16 left-4 right-4 z-50 bg-gradient-to-r from-rose-600 to-red-600 rounded-2xl shadow-2xl p-4"
                    >
                        <div className="flex items-start gap-3">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 0.5, repeat: Infinity }}
                                className="p-2 bg-white/20 rounded-full"
                            >
                                <AlertTriangle className="w-6 h-6 text-white" />
                            </motion.div>
                            <div className="flex-1">
                                <div className="text-white font-bold text-sm">
                                    🚨 SOS RECEIVED!
                                </div>
                                <div className="text-white/90 text-xs mt-1">
                                    {receivedSOS.message}
                                </div>
                                <div className="flex items-center gap-2 mt-2 text-white/70 text-xs">
                                    <Users className="w-3 h-3" />
                                    <span>Received via P2P network</span>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowReceived(false)}
                                className="text-white/70 hover:text-white text-xl"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Queued SOS indicator */}
            {totalQueuedSOS > 0 && (
                <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-40">
                    <div className="px-3 py-1.5 bg-slate-800/90 rounded-full text-xs text-white flex items-center gap-2">
                        <Radio className="w-3 h-3 text-amber-400" />
                        {totalQueuedSOS} SOS queued for sync
                    </div>
                </div>
            )}
        </>
    );
}
