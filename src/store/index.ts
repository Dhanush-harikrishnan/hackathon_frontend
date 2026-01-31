import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import sheltersReducer from './slices/sheltersSlice';
import sosReducer from './slices/sosSlice';
import uiReducer from './slices/uiSlice';
import apiReducer from './slices/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    shelters: sheltersReducer,
    sos: sosReducer,
    ui: uiReducer,
    api: apiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['sos/setSosLocation'],
        ignoredPaths: ['sos.sosLocation'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
