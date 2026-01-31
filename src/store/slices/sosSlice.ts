import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface SosAlert {
  _id: string;
  id?: string;
  userId: string;
  userName?: string;
  lat: number;
  lng: number;
  location?: {
    type: string;
    coordinates: [number, number];
  };
  timestamp: string;
  status: 'pending' | 'acknowledged' | 'resolved';
  notes?: string;
}

interface SosState {
  isSosActive: boolean;
  sosCountdown: number;
  sosStatus: 'idle' | 'countdown' | 'sending' | 'sent' | 'error';
  alerts: SosAlert[];
  sosLocation: { lat: number; lng: number } | null;
  lastSosTime: string | null;
}

// Chennai SOS alerts as initial/fallback data
const initialState: SosState = {
  isSosActive: false,
  sosCountdown: 3,
  sosStatus: 'idle',
  alerts: [
    {
      _id: 'sos-1',
      userId: 'user-1',
      lat: 13.0600,
      lng: 80.2500,
      timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'pending',
      userName: 'Ravi K.',
      notes: 'Family of 4 stranded on rooftop, water rising',
    },
    {
      _id: 'sos-2',
      userId: 'user-2',
      lat: 12.9750,
      lng: 80.2150,
      timestamp: new Date(Date.now() - 8 * 60000).toISOString(),
      status: 'pending',
      userName: 'Priya S.',
      notes: 'Elderly person needs medical assistance, diabetic',
    },
    {
      _id: 'sos-3',
      userId: 'user-3',
      lat: 13.0200,
      lng: 80.2700,
      timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
      status: 'pending',
      userName: 'Kumar M.',
    },
  ],
  sosLocation: null,
  lastSosTime: null,
};

const sosSlice = createSlice({
  name: 'sos',
  initialState,
  reducers: {
    startSos: (state) => {
      state.isSosActive = true;
      state.sosStatus = 'countdown';
      state.sosCountdown = 3;
    },
    decrementCountdown: (state) => {
      if (state.sosCountdown > 0) {
        state.sosCountdown -= 1;
      }
      if (state.sosCountdown === 0) {
        state.sosStatus = 'sending';
      }
    },
    setSosSending: (state) => {
      state.sosStatus = 'sending';
    },
    setSosSent: (state) => {
      state.sosStatus = 'sent';
      state.lastSosTime = new Date().toISOString();
    },
    setSosError: (state) => {
      state.sosStatus = 'error';
    },
    cancelSos: (state) => {
      state.isSosActive = false;
      state.sosCountdown = 3;
      state.sosStatus = 'idle';
    },
    resetSos: (state) => {
      state.isSosActive = false;
      state.sosCountdown = 3;
      state.sosStatus = 'idle';
    },
    setSosLocation: (state, action: PayloadAction<{ lat: number; lng: number } | null>) => {
      state.sosLocation = action.payload;
    },
    addAlert: (state, action: PayloadAction<SosAlert>) => {
      state.alerts.unshift(action.payload);
    },
    updateAlertStatus: (state, action: PayloadAction<{ id: string; status: SosAlert['status'] }>) => {
      const alert = state.alerts.find((a) => a._id === action.payload.id || a.id === action.payload.id);
      if (alert) {
        alert.status = action.payload.status;
      }
    },
    acknowledgeAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a._id === action.payload || a.id === action.payload);
      if (alert) {
        alert.status = 'acknowledged';
      }
    },
    resolveAlert: (state, action: PayloadAction<string>) => {
      const alert = state.alerts.find((a) => a._id === action.payload || a.id === action.payload);
      if (alert) {
        alert.status = 'resolved';
      }
    },
    setAlerts: (state, action: PayloadAction<SosAlert[]>) => {
      state.alerts = action.payload;
    },
    // Real-time update from Socket.io
    realtimeAlert: (state, action: PayloadAction<SosAlert>) => {
      const exists = state.alerts.find((a) => a._id === action.payload._id);
      if (!exists) {
        state.alerts.unshift(action.payload);
      }
    },
    realtimeAlertUpdate: (state, action: PayloadAction<SosAlert>) => {
      const index = state.alerts.findIndex((a) => a._id === action.payload._id);
      if (index !== -1) {
        state.alerts[index] = action.payload;
      }
    }
  },
});

export const {
  startSos,
  decrementCountdown,
  setSosSending,
  setSosSent,
  setSosError,
  cancelSos,
  resetSos,
  setSosLocation,
  addAlert,
  updateAlertStatus,
  acknowledgeAlert,
  resolveAlert,
  setAlerts,
  realtimeAlert,
  realtimeAlertUpdate
} = sosSlice.actions;
export default sosSlice.reducer;
