// EmergencySOS - ONE-TAP Emergency Alert
// Simplified for disaster scenarios - NO CODE ENTRY NEEDED
// Auto-broadcasts to ALL nearby devices instantly

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Radio, Check, Loader2, Users } from 'lucide-react';
import { useMeshNetwork } from '../hooks/useMeshNetwork';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function EmergencySOS() {
    const { isOffline } = useNetworkStatus();
    const { sendSOS, peerCount, totalQueuedSOS, receivedMessages } = useMeshNetwork();

    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);
    const [showReceived, setShowReceived] = useState(false);

    // Show notification when SOS received from others
    useEffect(() => {
        if (receivedMessages.length > 0) {
            setShowReceived(true);
            // Vibrate device if supported (mobile)
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        }
    }, [receivedMessages.length]);

    // ONE-TAP SOS - Gets location and broadcasts immediately
    const handleEmergencySOS = async () => {
        setSending(true);

        // Get location (with timeout for speed)
        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: false, // Faster
                    timeout: 3000, // 3 second max
                    maximumAge: 60000
                });
            });

            sendSOS({
                lat: position.coords.latitude,
                lng: position.coords.longitude
            }, 'EMERGENCY! Need immediate help!');
        } catch {
            // Send without location if geolocation fails
            sendSOS(undefined, 'EMERGENCY! Need immediate help!');
        }

        setSending(false);
        setSent(true);

        // Reset after 5 seconds
        setTimeout(() => setSent(false), 5000);
    };

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
                            ✓ SOS Sent to {peerCount} device{peerCount !== 1 ? 's' : ''}!
                        </motion.span>
                    ) : isOffline ? (
                        <span className="text-amber-400 text-xs font-medium flex items-center justify-center gap-1">
                            <Radio className="w-3 h-3 animate-pulse" />
                            P2P Mode • {peerCount} nearby
                        </span>
                    ) : (
                        <span className="text-slate-400 text-xs">Tap for emergency</span>
                    )}
                </div>
            </div>

            {/* Received SOS Alert */}
            <AnimatePresence>
                {showReceived && receivedMessages.length > 0 && (
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
                                    {receivedMessages[receivedMessages.length - 1]?.message}
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
