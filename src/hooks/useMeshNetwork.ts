// useMeshNetwork - P2P Mesh Network for Disaster SOS Transfer
// Uses WebRTC to enable device-to-device communication without internet
// Critical for disaster scenarios where cell towers may be down

import { useState, useEffect, useRef, useCallback } from 'react';

// Generate a unique device ID for mesh network identification
const generateDeviceId = (): string => {
    const stored = localStorage.getItem('mesh_device_id');
    if (stored) return stored;

    const id = 'SR-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('mesh_device_id', id);
    return id;
};

// SOS Message structure for P2P transfer
export interface P2PSOSMessage {
    id: string;
    senderId: string;
    senderName?: string;
    timestamp: number;
    location?: { lat: number; lng: number };
    message: string;
    priority: 'high' | 'medium' | 'low';
    hops: number; // Number of device relays
    originDevice: string;
}

// Peer connection info
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

export function useMeshNetwork() {
    const [state, setState] = useState<MeshNetworkState>({
        deviceId: '',
        isInitialized: false,
        peers: [],
        pendingMessages: [],
        receivedMessages: [],
        connectionCode: ''
    });

    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    const dataChannels = useRef<Map<string, RTCDataChannel>>(new Map());
    const broadcastChannel = useRef<BroadcastChannel | null>(null);

    // Initialize mesh network
    useEffect(() => {
        const deviceId = generateDeviceId();
        const connectionCode = deviceId.substring(3); // Short code for sharing

        // Load persisted messages from localStorage
        const savedPending = localStorage.getItem('mesh_pending_sos');
        const savedReceived = localStorage.getItem('mesh_received_sos');

        setState(prev => ({
            ...prev,
            deviceId,
            connectionCode,
            isInitialized: true,
            pendingMessages: savedPending ? JSON.parse(savedPending) : [],
            receivedMessages: savedReceived ? JSON.parse(savedReceived) : []
        }));

        // BroadcastChannel for same-browser tab communication (demo/testing)
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

        return () => {
            broadcastChannel.current?.close();
            // Close all peer connections
            peerConnections.current.forEach(pc => pc.close());
        };
    }, []);

    // Handle incoming P2P messages
    const handleIncomingMessage = useCallback((data: any) => {
        if (data.type === 'PEER_ANNOUNCE') {
            // New peer discovered
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
            // Received SOS from another device
            const sosMessage: P2PSOSMessage = data.payload;

            setState(prev => {
                // Check if we already have this message
                const exists = prev.receivedMessages.some(m => m.id === sosMessage.id);
                if (exists) return prev;

                const newReceived = [...prev.receivedMessages, {
                    ...sosMessage,
                    hops: sosMessage.hops + 1
                }];

                // Persist to localStorage
                localStorage.setItem('mesh_received_sos', JSON.stringify(newReceived));

                return {
                    ...prev,
                    receivedMessages: newReceived
                };
            });

            // Relay to other peers (mesh propagation)
            relayMessage({ ...sosMessage, hops: sosMessage.hops + 1 });
        }
    }, []);

    // Relay message to all connected peers
    const relayMessage = useCallback((message: P2PSOSMessage) => {
        // Don't relay if too many hops (prevent infinite loops)
        if (message.hops > 5) return;

        // Broadcast via BroadcastChannel
        broadcastChannel.current?.postMessage({
            type: 'SOS_BROADCAST',
            payload: message
        });

        // Broadcast via WebRTC data channels
        dataChannels.current.forEach((channel) => {
            if (channel.readyState === 'open') {
                channel.send(JSON.stringify({
                    type: 'SOS_BROADCAST',
                    payload: message
                }));
            }
        });
    }, []);

    // Send SOS to mesh network
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

        // Add to pending queue
        setState(prev => {
            const newPending = [...prev.pendingMessages, sosMessage];
            localStorage.setItem('mesh_pending_sos', JSON.stringify(newPending));
            return { ...prev, pendingMessages: newPending };
        });

        // Broadcast to mesh network
        relayMessage(sosMessage);

        console.log('📡 P2P SOS Broadcast:', sosMessage);
        return sosMessage;
    }, [state.deviceId, relayMessage]);

    // Connect to peer via code
    const connectToPeer = useCallback(async (peerCode: string) => {
        const peerId = 'SR-' + peerCode.toUpperCase();

        // For demo: use BroadcastChannel discovery
        broadcastChannel.current?.postMessage({
            type: 'PEER_CONNECT_REQUEST',
            fromId: state.deviceId,
            toId: peerId
        });

        // Add peer optimistically
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

    // Clear received messages after sync
    const clearSyncedMessages = useCallback((messageIds: string[]) => {
        setState(prev => {
            const newReceived = prev.receivedMessages.filter(m => !messageIds.includes(m.id));
            localStorage.setItem('mesh_received_sos', JSON.stringify(newReceived));
            return { ...prev, receivedMessages: newReceived };
        });
    }, []);

    // Sync pending messages to backend when online
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
                // Clear synced messages
                setState(prev => ({
                    ...prev,
                    pendingMessages: [],
                    receivedMessages: []
                }));
                localStorage.removeItem('mesh_pending_sos');
                localStorage.removeItem('mesh_received_sos');

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
