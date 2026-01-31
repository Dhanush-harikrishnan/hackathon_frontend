import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface Shelter {
  _id: string;
  id?: string;
  name: string;
  status: 'OPEN' | 'FULL' | 'CLOSED';
  capacity: {
    total: number;
    current: number;
  };
  resources: {
    food: boolean;
    water: boolean;
    medical: boolean;
  };
  location: {
    type: string;
    coordinates: [number, number];
  };
  address: string;
  phone?: string;
  lastUpdated: string;
  distance?: number;
  occupancyPercentage?: number;
  weightedScore?: number;
}

interface SheltersState {
  shelters: Shelter[];
  selectedShelter: Shelter | null;
  isLoading: boolean;
  error: string | null;
  offlineMode: boolean;
  lastSync: string | null;
}

// Chennai shelters as initial/fallback data
const initialState: SheltersState = {
  shelters: [
    {
      _id: '1',
      name: 'Marina Beach Community Center',
      status: 'OPEN',
      capacity: { total: 500, current: 185 },
      resources: { food: true, water: true, medical: true },
      location: { type: 'Point', coordinates: [80.2824, 13.0499] },
      address: '123 Kamarajar Salai, Marina Beach, Chennai - 600005',
      phone: '+91 44 2536 1234',
      lastUpdated: new Date().toISOString(),
    },
    {
      _id: '2',
      name: 'T. Nagar Corporation School',
      status: 'OPEN',
      capacity: { total: 350, current: 280 },
      resources: { food: true, water: true, medical: false },
      location: { type: 'Point', coordinates: [80.2339, 13.0418] },
      address: '45 Pondy Bazaar, T. Nagar, Chennai - 600017',
      phone: '+91 44 2434 5678',
      lastUpdated: new Date().toISOString(),
    },
    {
      _id: '3',
      name: 'Anna Nagar Tower Relief Camp',
      status: 'OPEN',
      capacity: { total: 600, current: 125 },
      resources: { food: true, water: true, medical: true },
      location: { type: 'Point', coordinates: [80.2096, 13.0850] },
      address: '2nd Avenue, Anna Nagar, Chennai - 600040',
      phone: '+91 44 2628 9012',
      lastUpdated: new Date().toISOString(),
    },
    {
      _id: '4',
      name: 'Adyar Corporation School',
      status: 'OPEN',
      capacity: { total: 400, current: 390 },
      resources: { food: true, water: false, medical: true },
      location: { type: 'Point', coordinates: [80.2565, 13.0012] },
      address: '78 Gandhi Nagar, Adyar, Chennai - 600020',
      phone: '+91 44 2442 3456',
      lastUpdated: new Date().toISOString(),
    },
    {
      _id: '5',
      name: 'Velachery YMCA Shelter',
      status: 'FULL',
      capacity: { total: 250, current: 250 },
      resources: { food: true, water: true, medical: false },
      location: { type: 'Point', coordinates: [80.2207, 12.9815] },
      address: '156 100 Feet Road, Velachery, Chennai - 600042',
      phone: '+91 44 2243 7890',
      lastUpdated: new Date().toISOString(),
    },
  ],
  selectedShelter: null,
  isLoading: false,
  error: null,
  offlineMode: false,
  lastSync: null,
};

const sheltersSlice = createSlice({
  name: 'shelters',
  initialState,
  reducers: {
    setShelters: (state, action: PayloadAction<Shelter[]>) => {
      state.shelters = action.payload;
      state.lastSync = new Date().toISOString();
      
      // Cache to localStorage for offline mode
      try {
        localStorage.setItem('cached_shelters', JSON.stringify(action.payload));
      } catch (e) {
        console.error('Failed to cache shelters:', e);
      }
    },
    selectShelter: (state, action: PayloadAction<Shelter | null>) => {
      state.selectedShelter = action.payload;
    },
    updateShelter: (state, action: PayloadAction<Shelter>) => {
      const index = state.shelters.findIndex((s) => s._id === action.payload._id || s.id === action.payload.id);
      if (index !== -1) {
        state.shelters[index] = { 
          ...action.payload, 
          lastUpdated: new Date().toISOString() 
        };
      }
    },
    updateCapacity: (state, action: PayloadAction<{ id: string; current: number }>) => {
      const shelter = state.shelters.find((s) => s._id === action.payload.id || s.id === action.payload.id);
      if (shelter) {
        shelter.capacity.current = Math.max(0, Math.min(action.payload.current, shelter.capacity.total));
        shelter.lastUpdated = new Date().toISOString();
        
        // Auto-update status
        if (shelter.capacity.current >= shelter.capacity.total) {
          shelter.status = 'FULL';
        } else if (shelter.status === 'FULL') {
          shelter.status = 'OPEN';
        }
      }
    },
    toggleResource: (state, action: PayloadAction<{ id: string; resource: 'food' | 'water' | 'medical' }>) => {
      const shelter = state.shelters.find((s) => s._id === action.payload.id || s.id === action.payload.id);
      if (shelter) {
        shelter.resources[action.payload.resource] = !shelter.resources[action.payload.resource];
        shelter.lastUpdated = new Date().toISOString();
      }
    },
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.offlineMode = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    loadCachedShelters: (state) => {
      try {
        const cached = localStorage.getItem('cached_shelters');
        if (cached) {
          state.shelters = JSON.parse(cached);
        }
      } catch (e) {
        console.error('Failed to load cached shelters:', e);
      }
    },
    // Real-time update from Socket.io
    realtimeUpdate: (state, action: PayloadAction<Shelter>) => {
      const index = state.shelters.findIndex((s) => s._id === action.payload._id);
      if (index !== -1) {
        state.shelters[index] = action.payload;
      } else {
        state.shelters.push(action.payload);
      }
    }
  },
});

export const {
  setShelters,
  selectShelter,
  updateShelter,
  updateCapacity,
  toggleResource,
  setOfflineMode,
  setLoading,
  setError,
  loadCachedShelters,
  realtimeUpdate
} = sheltersSlice.actions;
export default sheltersSlice.reducer;
