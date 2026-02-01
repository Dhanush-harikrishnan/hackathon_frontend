// P2P Mesh Network for Cross-Device SOS Transfer
// Works across devices connected to the same hotspot/network
// Uses polling-based sync with localStorage for reliability

import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a unique device ID
const generateDeviceId = (): string => {
    const stored = localStorage.getItem('mesh_device_id');
    if (stored) return stored;

    const id = 'SR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('mesh_device_id', id);
    return id;
};

// SOS Message structure
export interface P2PSOSMessage {
    id: string;
    senderId: string;
    senderName?: string;
    timestamp: number;
    location?: { lat: number; lng: number };
    message: string;
    priority: 'high' | 'medium' | 'low';
    hops: number;
    originDevice: string;
}

// Peer info
export interface PeerInfo {
    id: string;
    name?: string;
    connected: boolean;
    lastSeen: number;
}

interface MeshNetworkState {
    deviceId: string;
    isInitialized: boolean;
    peers: PeerInfo[];
    pendingMessages: P2PSOSMessage[];
    receivedMessages: P2PSOSMessage[];
    connectionCode: string;
}

// Storage keys
const STORAGE_KEYS = {
    PENDING: 'mesh_pending_sos',
    RECEIVED: 'mesh_received_sos',
    SHARED: 'mesh_shared_sos', // Shared across devices
    PEERS: 'mesh_peers'
};

export function useMeshNetwork() {
    const [state, setState] = useState<MeshNetworkState>({
        deviceId: '',
        isInitialized: false,
        peers: [],
        pendingMessages: [],
        receivedMessages: [],
        connectionCode: ''
    });

    const broadcastChannel = useRef<BroadcastChannel | null>(null);
    const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

    // Initialize mesh network
    useEffect(() => {
        const deviceId = generateDeviceId();
        const connectionCode = deviceId.substring(3);

        // Load persisted messages
        const savedPending = localStorage.getItem(STORAGE_KEYS.PENDING);
        const savedReceived = localStorage.getItem(STORAGE_KEYS.RECEIVED);

        setState(prev => ({
            ...prev,
            deviceId,
            connectionCode,
            isInitialized: true,
            pendingMessages: savedPending ? JSON.parse(savedPending) : [],
            receivedMessages: savedReceived ? JSON.parse(savedReceived) : []
        }));

        // BroadcastChannel for same-browser tabs
        try {
            broadcastChannel.current = new BroadcastChannel('saferoute_mesh');
            broadcastChannel.current.onmessage = (event) => {
                handleIncomingMessage(event.data);
            };

            // Announce presence
            broadcastChannel.current.postMessage({
                type: 'PEER_ANNOUNCE',
                deviceId,
                timestamp: Date.now()
            });
        } catch (e) {
            console.log('BroadcastChannel not supported');
        }

        // Poll for shared SOS messages (cross-device sync)
        pollInterval.current = setInterval(() => {
            checkForSharedSOS(deviceId);
        }, 1000); // Check every second

        return () => {
            broadcastChannel.current?.close();
            if (pollInterval.current) clearInterval(pollInterval.current);
        };
    }, []);

    // Check for SOS messages shared via the server/shared storage
    const checkForSharedSOS = useCallback((myDeviceId: string) => {
        try {
            const shared = localStorage.getItem(STORAGE_KEYS.SHARED);
            if (!shared) return;

            const messages: P2PSOSMessage[] = JSON.parse(shared);
            const newMessages = messages.filter(msg =>
                msg.senderId !== myDeviceId &&
                !state.receivedMessages.some(r => r.id === msg.id)
            );

            if (newMessages.length > 0) {
                setState(prev => {
                    const updated = [...prev.receivedMessages, ...newMessages];
                    localStorage.setItem(STORAGE_KEYS.RECEIVED, JSON.stringify(updated));
                    return { ...prev, receivedMessages: updated };
                });

                // Vibrate on new SOS
                if (navigator.vibrate) {
                    navigator.vibrate([200, 100, 200, 100, 200]);
                }
            }
        } catch (e) {
            // Ignore parse errors
        }
    }, [state.receivedMessages]);

    // Handle incoming P2P messages (same browser)
    const handleIncomingMessage = useCallback((data: any) => {
        if (data.type === 'PEER_ANNOUNCE') {
            setState(prev => {
                const exists = prev.peers.some(p => p.id === data.deviceId);
                if (exists || data.deviceId === prev.deviceId) return prev;

                return {
                    ...prev,
                    peers: [...prev.peers, {
                        id: data.deviceId,
                        connected: true,
                        lastSeen: data.timestamp
                    }]
                };
            });
        } else if (data.type === 'SOS_BROADCAST') {
            const sosMessage: P2PSOSMessage = data.payload;

            setState(prev => {
                const exists = prev.receivedMessages.some(m => m.id === sosMessage.id);
                if (exists) return prev;

                const newReceived = [...prev.receivedMessages, {
                    ...sosMessage,
                    hops: sosMessage.hops + 1
                }];

                localStorage.setItem(STORAGE_KEYS.RECEIVED, JSON.stringify(newReceived));
                return { ...prev, receivedMessages: newReceived };
            });

            // Vibrate
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200, 100, 200]);
            }
        }
    }, []);

    // Relay message
    const relayMessage = useCallback((message: P2PSOSMessage) => {
        if (message.hops > 5) return;

        // Broadcast via BroadcastChannel
        broadcastChannel.current?.postMessage({
            type: 'SOS_BROADCAST',
            payload: message
        });

        // Store in shared storage for cross-device sync
        try {
            const existing = localStorage.getItem(STORAGE_KEYS.SHARED);
            const messages: P2PSOSMessage[] = existing ? JSON.parse(existing) : [];

            if (!messages.some(m => m.id === message.id)) {
                messages.push(message);
                // Keep only last 20 messages
                const trimmed = messages.slice(-20);
                localStorage.setItem(STORAGE_KEYS.SHARED, JSON.stringify(trimmed));
            }
        } catch (e) {
            console.error('Failed to store shared SOS:', e);
        }
    }, []);

    // Send SOS
    const sendSOS = useCallback((location?: { lat: number; lng: number }, message?: string) => {
        const sosMessage: P2PSOSMessage = {
            id: `sos-${Date.now()}-${state.deviceId}`,
            senderId: state.deviceId,
            timestamp: Date.now(),
            location,
            message: message || 'Emergency SOS - Need immediate assistance!',
            priority: 'high',
            hops: 0,
            originDevice: state.deviceId
        };

        // Add to pending
        setState(prev => {
            const newPending = [...prev.pendingMessages, sosMessage];
            localStorage.setItem(STORAGE_KEYS.PENDING, JSON.stringify(newPending));
            return { ...prev, pendingMessages: newPending };
        });

        // Broadcast
        relayMessage(sosMessage);
        console.log('📡 P2P SOS Broadcast:', sosMessage);
        return sosMessage;
    }, [state.deviceId, relayMessage]);

    // Connect to peer
    const connectToPeer = useCallback(async (peerCode: string) => {
        const peerId = 'SR-' + peerCode.toUpperCase();

        broadcastChannel.current?.postMessage({
            type: 'PEER_CONNECT_REQUEST',
            fromId: state.deviceId,
            toId: peerId
        });

        setState(prev => ({
            ...prev,
            peers: [...prev.peers, {
                id: peerId,
                connected: true,
                lastSeen: Date.now()
            }]
        }));

        return true;
    }, [state.deviceId]);

    // Clear synced messages
    const clearSyncedMessages = useCallback((messageIds: string[]) => {
        setState(prev => {
            const newReceived = prev.receivedMessages.filter(m => !messageIds.includes(m.id));
            localStorage.setItem(STORAGE_KEYS.RECEIVED, JSON.stringify(newReceived));
            return { ...prev, receivedMessages: newReceived };
        });
    }, []);

    // Sync to backend
    const syncToBackend = useCallback(async (apiUrl: string, token: string) => {
        const allMessages = [...state.pendingMessages, ...state.receivedMessages];

        if (allMessages.length === 0) return { synced: 0 };

        try {
            const response = await fetch(`${apiUrl}/sos/bulk-sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ messages: allMessages })
            });

            if (response.ok) {
                setState(prev => ({
                    ...prev,
                    pendingMessages: [],
                    receivedMessages: []
                }));
                localStorage.removeItem(STORAGE_KEYS.PENDING);
                localStorage.removeItem(STORAGE_KEYS.RECEIVED);
                localStorage.removeItem(STORAGE_KEYS.SHARED);
                return { synced: allMessages.length };
            }
        } catch (error) {
            console.error('Failed to sync to backend:', error);
        }

        return { synced: 0 };
    }, [state.pendingMessages, state.receivedMessages]);

    return {
        deviceId: state.deviceId,
        connectionCode: state.connectionCode,
        isInitialized: state.isInitialized,
        peers: state.peers,
        peerCount: state.peers.length,
        pendingMessages: state.pendingMessages,
        receivedMessages: state.receivedMessages,
        totalQueuedSOS: state.pendingMessages.length + state.receivedMessages.length,
        sendSOS,
        connectToPeer,
        syncToBackend,
        clearSyncedMessages
    };
}

export default useMeshNetwork;
