import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io, type Socket } from 'socket.io-client';
import { realtimeUpdate } from '../store/slices/sheltersSlice';
import { realtimeAlert, realtimeAlertUpdate } from '../store/slices/sosSlice';
import type { RootState } from '../store';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const dispatch = useDispatch();
  const socketRef = useRef<Socket | null>(null);
  const user = useSelector((state: RootState) => state.auth.user);

  useEffect(() => {
    // Initialize socket connection
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Socket connected:', socket.id);
      
      // Auto-join rooms based on user role
      if (user?.role === 'rescue_team' || user?.role === 'rescue') {
        socket.emit('join_room', 'rescue_team_room');
        console.log('📢 Joined rescue_team_room');
      }
      
      if (user?.role === 'manager') {
        socket.emit('join_room', 'manager_room');
        console.log('📢 Joined manager_room');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error.message);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('🔄 Socket reconnected after', attemptNumber, 'attempts');
    });

    // Shelter update events (from backend)
    socket.on('shelter_update', (shelter) => {
      console.log('🏠 Shelter updated:', shelter.name);
      dispatch(realtimeUpdate(shelter));
    });

    // SOS alert events (from backend - only rescue team receives these)
    socket.on('new_emergency', (alert) => {
      console.log('🚨 New emergency alert received:', alert);
      
      // Transform the alert to match our frontend structure
      const transformedAlert = {
        _id: alert._id,
        userId: alert.userId?._id || alert.userId,
        userName: alert.userId?.username || 'Unknown',
        lat: alert.location?.coordinates?.[1] || 0,
        lng: alert.location?.coordinates?.[0] || 0,
        timestamp: alert.timestamp || new Date().toISOString(),
        status: alert.status?.toLowerCase() || 'pending',
        notes: alert.details || '',
      };
      
      dispatch(realtimeAlert(transformedAlert));
      
      // Play notification sound
      playNotificationSound();
      
      // Show browser notification if permitted
      showBrowserNotification('🚨 New SOS Alert', {
        body: `Emergency from ${transformedAlert.userName}`,
        requireInteraction: true,
      });
    });

    socket.on('sos_resolved', (alert) => {
      console.log('✅ SOS resolved:', alert._id);
      
      const transformedAlert: { _id: string; userId: string; userName: string; lat: number; lng: number; timestamp: string; status: 'pending' | 'acknowledged' | 'resolved'; notes: string } = {
        _id: alert._id,
        userId: alert.userId?._id || alert.userId,
        userName: alert.userId?.username || 'Unknown',
        lat: alert.location?.coordinates?.[1] || 0,
        lng: alert.location?.coordinates?.[0] || 0,
        timestamp: alert.timestamp || new Date().toISOString(),
        status: 'resolved' as const,
        notes: alert.details || '',
      };
      
      dispatch(realtimeAlertUpdate(transformedAlert));
    });

    // User location updates (for rescue team tracking)
    socket.on('user_location_update', (data) => {
      console.log('📍 User location update:', data);
      // Could dispatch to a tracking slice if needed
    });

    return () => {
      // Leave rooms before disconnecting
      if (user?.role === 'rescue_team' || user?.role === 'rescue') {
        socket.emit('leave_room', 'rescue_team_room');
      }
      if (user?.role === 'manager') {
        socket.emit('leave_room', 'manager_room');
      }
      socket.disconnect();
    };
  }, [dispatch, user?.role]);

  // Join a specific room
  const joinRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('join_room', room);
      console.log(`📢 Joined room: ${room}`);
    }
  }, []);

  // Leave a specific room
  const leaveRoom = useCallback((room: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('leave_room', room);
      console.log(`📢 Left room: ${room}`);
    }
  }, []);

  // Emit a custom event
  const emit = useCallback((event: string, data?: unknown) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return {
    socket: socketRef.current,
    joinRoom,
    leaveRoom,
    emit,
    isConnected: socketRef.current?.connected || false,
  };
};

// Helper function to play notification sound
function playNotificationSound() {
  try {
    // Create an audio context for the notification sound
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.warn('Could not play notification sound:', error);
  }
}

// Helper function to show browser notification
function showBrowserNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, options);
  } else if ('Notification' in window && Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(title, options);
      }
    });
  }
}

export default useSocket;
