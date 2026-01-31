import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type ViewMode = 'map' | 'dashboard' | 'rescue';

interface UiState {
  viewMode: ViewMode;
  isSidebarOpen: boolean;
  showOfflineToast: boolean;
  searchQuery: string;
  isSearchFocused: boolean;
  showRoleSelector: boolean;
  darkMode: boolean;
}

const initialState: UiState = {
  viewMode: 'map',
  isSidebarOpen: true,
  showOfflineToast: false,
  searchQuery: '',
  isSearchFocused: false,
  showRoleSelector: true,
  darkMode: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.isSidebarOpen = action.payload;
    },
    showOfflineNotification: (state) => {
      state.showOfflineToast = true;
    },
    hideOfflineNotification: (state) => {
      state.showOfflineToast = false;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSearchFocused: (state, action: PayloadAction<boolean>) => {
      state.isSearchFocused = action.payload;
    },
    setShowRoleSelector: (state, action: PayloadAction<boolean>) => {
      state.showRoleSelector = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
    },
  },
});

export const {
  setViewMode,
  toggleSidebar,
  setSidebarOpen,
  showOfflineNotification,
  hideOfflineNotification,
  setSearchQuery,
  setSearchFocused,
  setShowRoleSelector,
  toggleDarkMode,
  setDarkMode,
} = uiSlice.actions;
export default uiSlice.reducer;
