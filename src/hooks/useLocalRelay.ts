// useLocalRelay - Connect to local P2P relay for true offline SOS
// This connects to a WebSocket server running on the laptop
// Works completely offline on a hotspot network!

import { useState, useEffect, useRef, useCallback } from 'react';

export interface SOSMessage {
    id: string;
    senderId: string;
    timestamp: number;
    location?: { lat: number; lng: number };
    message: string;
}

interface LocalRelayState {
    connected: boolean;
    deviceCount: number;
    receivedSOS: SOSMessage[];
    lastError: string | null;
}

// Default to common local IPs - user can override
const DEFAULT_RELAY_PORT = 8765;

export function useLocalRelay(relayUrl?: string) {
    const [state, setState] = useState<LocalRelayState>({
        connected: false,
        deviceCount: 0,
        receivedSOS: [],
        lastError: null
    });

    const wsRef = useRef<WebSocket | null>(null);
    const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Auto-discover relay URL
    const getRelayUrl = useCallback(() => {
        if (relayUrl) return relayUrl;

        // Check localStorage for saved relay URL
        const saved = localStorage.getItem('local_relay_url');
        if (saved) return saved;

        // Default to localhost (works when running on same device)
        return `ws://localhost:${DEFAULT_RELAY_PORT}`;
    }, [relayUrl]);

    // Connect to relay
    const connect = useCallback(() => {
        const url = getRelayUrl();
        console.log(`📡 Connecting to local relay: ${url}`);

        try {
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log('✅ Connected to local P2P relay!');
                setState(prev => ({ ...prev, connected: true, lastError: null }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'SOS_BROADCAST') {
                        console.log('🚨 SOS received from nearby device:', data.data);
                        setState(prev => ({
                            ...prev,
                            receivedSOS: [...prev.receivedSOS, data.data]
                        }));

                        // Vibrate on SOS
                        if (navigator.vibrate) {
                            navigator.vibrate([200, 100, 200, 100, 200]);
                        }
                    } else if (data.type === 'SOS_HISTORY') {
                        console.log('📜 Received SOS history:', data.messages.length, 'messages');
                        setState(prev => ({
                            ...prev,
                            receivedSOS: [...data.messages, ...prev.receivedSOS]
                        }));
                    }
                } catch (e) {
                    console.error('Error parsing relay message:', e);
                }
            };

            ws.onclose = () => {
                console.log('🔌 Disconnected from local relay');
                setState(prev => ({ ...prev, connected: false }));

                // Auto-reconnect after 3 seconds
                reconnectTimeoutRef.current = setTimeout(() => {
                    console.log('🔄 Attempting to reconnect...');
                    connect();
                }, 3000);
            };

            ws.onerror = (error) => {
                console.error('❌ Relay connection error:', error);
                setState(prev => ({
                    ...prev,
                    connected: false,
                    lastError: 'Could not connect to local relay'
                }));
            };
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            setState(prev => ({
                ...prev,
                lastError: 'WebSocket creation failed'
            }));
        }
    }, [getRelayUrl]);

    // Send SOS via local relay
    const sendSOS = useCallback((message?: string) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            console.warn('Not connected to local relay');
            return false;
        }

        const sosData: SOSMessage = {
            id: `sos-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            senderId: localStorage.getItem('mesh_device_id') || 'unknown',
            timestamp: Date.now(),
            message: message || 'EMERGENCY! Need immediate help!'
        };

        // Try to get location
        navigator.geolocation.getCurrentPosition(
            (position) => {
                sosData.location = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                wsRef.current?.send(JSON.stringify({ type: 'SOS', data: sosData }));
                console.log('📡 SOS sent via local relay with location');
            },
            () => {
                // Send without location
                wsRef.current?.send(JSON.stringify({ type: 'SOS', data: sosData }));
                console.log('📡 SOS sent via local relay (no location)');
            },
            { timeout: 2000 }
        );

        return true;
    }, []);

    // Set custom relay URL
    const setRelayUrl = useCallback((url: string) => {
        localStorage.setItem('local_relay_url', url);
        // Reconnect with new URL
        if (wsRef.current) {
            wsRef.current.close();
        }
        connect();
    }, [connect]);

    // Connect on mount
    useEffect(() => {
        connect();

        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, [connect]);

    // Clear received SOS
    const clearReceivedSOS = useCallback(() => {
        setState(prev => ({ ...prev, receivedSOS: [] }));
    }, []);

    return {
        connected: state.connected,
        deviceCount: state.deviceCount,
        receivedSOS: state.receivedSOS,
        lastError: state.lastError,
        sendSOS,
        setRelayUrl,
        clearReceivedSOS
    };
}

export default useLocalRelay;
