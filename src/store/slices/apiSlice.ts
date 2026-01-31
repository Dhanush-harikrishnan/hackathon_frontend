// API integration slice for backend communication
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Async thunks for API calls
export const fetchShelters = createAsyncThunk(
  'api/fetchShelters',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shelters`);
      if (!response.ok) throw new Error('Failed to fetch shelters');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchNearestShelters = createAsyncThunk(
  'api/fetchNearestShelters',
  async ({ lat, lng }: { lat: number; lng: number }, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shelters/nearest?lat=${lat}&lng=${lng}`);
      if (!response.ok) throw new Error('Failed to fetch nearest shelters');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateShelterCapacity = createAsyncThunk(
  'api/updateShelterCapacity',
  async ({ id, current, token }: { id: string; current: number; token?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const authToken = token || state.auth.token;
      const response = await fetch(`${API_URL}/shelters/${id}/capacity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ current })
      });
      if (!response.ok) throw new Error('Failed to update capacity');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateShelterResources = createAsyncThunk(
  'api/updateShelterResources',
  async ({ id, resources, token }: { id: string; resources: { food: boolean; water: boolean; medical: boolean }; token?: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const authToken = token || state.auth.token;
      const response = await fetch(`${API_URL}/shelters/${id}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ resources })
      });
      if (!response.ok) throw new Error('Failed to update resources');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const toggleShelterResource = createAsyncThunk(
  'api/toggleShelterResource',
  async ({ id, resource }: { id: string; resource: string }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await fetch(`${API_URL}/shelters/${id}/resources`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.auth.token}`
        },
        body: JSON.stringify({ resource })
      });
      if (!response.ok) throw new Error('Failed to toggle resource');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const createSOSAlert = createAsyncThunk(
  'api/createSOSAlert',
  async ({ lat, lng }: { lat: number; lng: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await fetch(`${API_URL}/sos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${state.auth.token}`
        },
        body: JSON.stringify({ lat, lng })
      });
      if (!response.ok) throw new Error('Failed to create SOS alert');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const fetchSOSAlerts = createAsyncThunk(
  'api/fetchSOSAlerts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await fetch(`${API_URL}/sos`, {
        headers: { 'Authorization': `Bearer ${state.auth.token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch SOS alerts');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const acknowledgeSOSAlert = createAsyncThunk(
  'api/acknowledgeSOSAlert',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await fetch(`${API_URL}/sos/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.auth.token}` }
      });
      if (!response.ok) throw new Error('Failed to acknowledge SOS');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const resolveSOSAlert = createAsyncThunk(
  'api/resolveSOSAlert',
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: { token: string } };
      const response = await fetch(`${API_URL}/sos/${id}/resolve`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${state.auth.token}` }
      });
      if (!response.ok) throw new Error('Failed to resolve SOS');
      return await response.json();
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

interface ApiState {
  loading: boolean;
  error: string | null;
  lastSync: string | null;
}

const initialState: ApiState = {
  loading: false,
  error: null,
  lastSync: null
};

const apiSlice = createSlice({
  name: 'api',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLastSync: (state, action) => {
      state.lastSync = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(
        (action) => action.type.endsWith('/pending'),
        (state) => {
          state.loading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled'),
        (state) => {
          state.loading = false;
          state.lastSync = new Date().toISOString();
        }
      )
      .addMatcher(
        (action): action is { type: string; payload: string } => action.type.endsWith('/rejected'),
        (state, action) => {
          state.loading = false;
          state.error = action.payload;
        }
      );
  }
});

export const { clearError, setLastSync } = apiSlice.actions;
export default apiSlice.reducer;
