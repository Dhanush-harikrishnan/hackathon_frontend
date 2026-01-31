// useNetworkStatus - Detect online/offline status for disaster resilience
// This hook monitors network connectivity to enable offline mode
// Critical for disaster scenarios when cell towers or WiFi may be down

import { useState, useEffect } from 'react';

interface NetworkStatus {
    isOnline: boolean;
    isOffline: boolean;
}

export function useNetworkStatus(): NetworkStatus {
    const [isOnline, setIsOnline] = useState<boolean>(
        typeof navigator !== 'undefined' ? navigator.onLine : true
    );

    useEffect(() => {
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

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return {
        isOnline,
        isOffline: !isOnline
    };
}

export default useNetworkStatus;
