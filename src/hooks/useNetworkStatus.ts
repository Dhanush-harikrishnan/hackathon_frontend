// useNetworkStatus - Detect online/offline status for disaster resilience
// This hook monitors network connectivity to enable offline mode
// Critical for disaster scenarios when cell towers or WiFi may be down

import { useState, useEffect, useCallback } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    isOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
    // Start with navigator.onLine but verify with actual connectivity check
    const [isOnline, setIsOnline] = useState<boolean>(true);

    // Check actual connectivity by pinging a resource
    const checkConnectivity = useCallback(async () => {
        try {
            // Try to fetch a tiny resource to verify real connectivity
            const response = await fetch('/manifest.json', {
                method: 'HEAD',
                cache: 'no-store'
            });
            return response.ok;
        } catch {
            // If fetch fails, check navigator.onLine as fallback
            return navigator.onLine;
        }
    }, []);

    useEffect(() => {
        // Initial check
        const initialCheck = async () => {
            // Trust navigator.onLine initially, but verify
            if (navigator.onLine) {
                setIsOnline(true);
            } else {
                setIsOnline(false);
            }
        };
        initialCheck();

        // Handle network status changes
        const handleOnline = () => {
            console.log('🌐 Network: Back online');
            setIsOnline(true);
        };

        const handleOffline = () => {
            console.log('📡 Network: Going offline - Emergency mode activated');
            setIsOnline(false);
        };

        // Listen to browser online/offline events
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Periodic connectivity check (every 30 seconds)
        const intervalId = setInterval(async () => {
            const online = await checkConnectivity();
            setIsOnline(online);
        }, 30000);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(intervalId);
        };
    }, [checkConnectivity]);

    return {
        isOnline,
        isOffline: !isOnline
    };
}

export default useNetworkStatus;
