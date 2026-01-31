// P2PSOSBeacon - Peer-to-Peer SOS Transfer Component
// Shows P2P network status and enables offline SOS transfer
// Perfect for disaster scenarios when internet is down

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Radio,
    Wifi,
    WifiOff,
    Users,
    Send,
    Copy,
    Check,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Zap,
    MapPin
} from 'lucide-react';
import { useMeshNetwork, type P2PSOSMessage } from '../hooks/useMeshNetwork';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatDistanceToNow } from 'date-fns';

export default function P2PSOSBeacon() {
    const { isOffline } = useNetworkStatus();
    const {
        connectionCode,
        peerCount,
        pendingMessages,
        receivedMessages,
        totalQueuedSOS,
        sendSOS,
        connectToPeer
    } = useMeshNetwork();

    const [isExpanded, setIsExpanded] = useState(false);
    const [peerCodeInput, setPeerCodeInput] = useState('');
    const [copied, setCopied] = useState(false);
    const [connecting, setConnecting] = useState(false);

    // Copy connection code to clipboard
    const handleCopyCode = async () => {
        await navigator.clipboard.writeText(connectionCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Connect to peer
    const handleConnect = async () => {
        if (!peerCodeInput.trim()) return;
        setConnecting(true);
        await connectToPeer(peerCodeInput.trim());
        setPeerCodeInput('');
        setConnecting(false);
    };

    // Send P2P SOS
    const handleSendSOS = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    sendSOS({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                },
                () => {
                    sendSOS();
                }
            );
        } else {
            sendSOS();
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-4 z-50"
        >
            {/* Main Beacon Button */}
            <motion.button
                onClick={() => setIsExpanded(!isExpanded)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-4 py-3 rounded-2xl shadow-lg border transition-all ${isOffline
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 border-amber-500/50 text-white'
                    : 'bg-slate-800/90 border-slate-700/50 text-white'
                    }`}
            >
                {/* Animated radio waves when offline */}
                {isOffline && (
                    <motion.div
                        className="absolute -left-1 -top-1 -right-1 -bottom-1 rounded-2xl border-2 border-amber-400/50"
                        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}

                <Radio className={`w-5 h-5 ${isOffline ? 'animate-pulse' : ''}`} />

                <div className="text-left">
                    <div className="text-xs font-bold">
                        {isOffline ? '📡 P2P Mode' : 'Mesh Network'}
                    </div>
                    <div className="text-xs opacity-75">
                        {peerCount} peer{peerCount !== 1 ? 's' : ''} • {totalQueuedSOS} queued
                    </div>
                </div>

                {isExpanded ? (
                    <ChevronDown className="w-4 h-4" />
                ) : (
                    <ChevronUp className="w-4 h-4" />
                )}
            </motion.button>

            {/* Expanded Panel */}
            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 10, height: 0 }}
                        className="absolute bottom-16 left-0 w-80 bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/50 to-transparent">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-400" />
                                    P2P Emergency Network
                                </h3>
                                {isOffline ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium flex items-center gap-1">
                                        <WifiOff className="w-3 h-3" />
                                        Offline
                                    </span>
                                ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium flex items-center gap-1">
                                        <Wifi className="w-3 h-3" />
                                        Online
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-slate-400">
                                Transfer SOS signals directly to nearby devices
                            </p>
                        </div>

                        {/* Device Code Section */}
                        <div className="p-4 border-b border-slate-700/50">
                            <label className="text-xs text-slate-400 mb-2 block">Your Device Code</label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 px-3 py-2 bg-slate-800 rounded-lg font-mono text-lg text-white tracking-widest">
                                    {connectionCode}
                                </div>
                                <button
                                    onClick={handleCopyCode}
                                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                                >
                                    {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">
                                Share this code with nearby devices to connect
                            </p>
                        </div>

                        {/* Connect to Peer */}
                        <div className="p-4 border-b border-slate-700/50">
                            <label className="text-xs text-slate-400 mb-2 block">Connect to Device</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={peerCodeInput}
                                    onChange={(e) => setPeerCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Enter code"
                                    maxLength={6}
                                    className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono uppercase tracking-widest placeholder:text-slate-600"
                                />
                                <button
                                    onClick={handleConnect}
                                    disabled={connecting || !peerCodeInput.trim()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg text-white font-medium transition-colors flex items-center gap-2"
                                >
                                    <Users className="w-4 h-4" />
                                    {connecting ? '...' : 'Join'}
                                </button>
                            </div>
                        </div>

                        {/* Peer Status */}
                        <div className="p-4 border-b border-slate-700/50">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-400">Connected Peers</span>
                                <span className="text-xs font-bold text-white">{peerCount}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {[...Array(Math.min(peerCount, 5))].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: i * 0.1 }}
                                        className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold"
                                    >
                                        P{i + 1}
                                    </motion.div>
                                ))}
                                {peerCount === 0 && (
                                    <span className="text-xs text-slate-500 italic">No peers connected yet</span>
                                )}
                            </div>
                        </div>

                        {/* Queued Messages */}
                        {totalQueuedSOS > 0 && (
                            <div className="p-4 border-b border-slate-700/50">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-slate-400">Queued SOS Alerts</span>
                                    <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-xs font-bold">
                                        {totalQueuedSOS}
                                    </span>
                                </div>
                                <div className="space-y-2 max-h-32 overflow-y-auto">
                                    {[...pendingMessages, ...receivedMessages].slice(0, 3).map((msg: P2PSOSMessage) => (
                                        <div key={msg.id} className="p-2 bg-slate-800/50 rounded-lg">
                                            <div className="flex items-center gap-2 text-xs">
                                                <AlertTriangle className="w-3 h-3 text-rose-400" />
                                                <span className="text-white font-medium truncate">{msg.message}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                {msg.location && <MapPin className="w-3 h-3" />}
                                                <span>{formatDistanceToNow(msg.timestamp)} ago</span>
                                                <span>• {msg.hops} hop{msg.hops !== 1 ? 's' : ''}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Send SOS Button */}
                        <div className="p-4">
                            <button
                                onClick={handleSendSOS}
                                className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 transition-all"
                            >
                                <Send className="w-5 h-5" />
                                Broadcast SOS via P2P
                            </button>
                            <p className="text-xs text-slate-500 text-center mt-2">
                                Sends to all connected devices instantly
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}
