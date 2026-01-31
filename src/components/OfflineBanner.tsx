// OfflineBanner - Emergency Offline Mode indicator
// Shows a prominent banner when network is unavailable
// Critical UX for disaster scenarios to inform users data is cached

import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Database, AlertTriangle } from 'lucide-react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

export default function OfflineBanner() {
    const { isOffline } = useNetworkStatus();

    return (
        <AnimatePresence>
            {isOffline && (
                <motion.div
                    initial={{ y: -100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -100, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 shadow-lg"
                >
                    <div className="px-4 py-3">
                        <div className="flex items-center justify-center gap-3">
                            {/* Animated offline icon */}
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="p-2 bg-white/20 rounded-full"
                            >
                                <WifiOff className="w-5 h-5 text-white" />
                            </motion.div>

                            {/* Main message */}
                            <div className="text-center">
                                <div className="flex items-center gap-2 text-white font-bold text-sm">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span>⚡ EMERGENCY OFFLINE MODE</span>
                                    <AlertTriangle className="w-4 h-4" />
                                </div>
                                <p className="text-white/90 text-xs mt-0.5 flex items-center justify-center gap-1">
                                    <Database className="w-3 h-3" />
                                    Using cached shelter data • No internet required
                                </p>
                            </div>

                            {/* Pulsing indicator */}
                            <motion.div
                                animate={{ opacity: [1, 0.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="w-3 h-3 bg-white rounded-full"
                            />
                        </div>
                    </div>

                    {/* Animated bottom border */}
                    <motion.div
                        className="h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
