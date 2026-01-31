import { AnimatePresence, motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from './store';
import { setViewMode, setDarkMode } from './store/slices/uiSlice';
import { logout } from './store/slices/authSlice';
import MapMap from './components/MapMap';
import ManagerDashboard from './components/ManagerDashboard';
import RescueTeamDashboard from './components/RescueTeamDashboard';
// SOSButton import removed - not used in current layout
import UserDashboard from './components/UserDashboard';
import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import { setOfflineMode } from './store/slices/sheltersSlice';
import { useEffect, useState } from 'react';
import { useSocket } from './hooks/useSocket';
import OfflineBanner from './components/OfflineBanner';
import EmergencySOS from './components/EmergencySOS';

// Auth Page - Manages Login/Register flow
function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <AnimatePresence mode="wait">
      {isLogin ? (
        <LoginPage key="login" onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterPage key="register" onSwitchToLogin={() => setIsLogin(true)} />
      )}
    </AnimatePresence>
  );
}

// Sidebar Navigation
function Sidebar() {
  const dispatch = useDispatch();
  const { userRole, user } = useSelector((state: RootState) => state.auth);
  const { viewMode, darkMode: _sidebarDarkMode } = useSelector((state: RootState) => state.ui);
  void _sidebarDarkMode; // Used for future dark mode toggle in sidebar
  const { offlineMode } = useSelector((state: RootState) => state.shelters);

  // Normalize role for display
  const normalizedRole = userRole === 'rescue_team' ? 'rescue' : userRole;

  const handleLogout = () => {
    dispatch(logout());
  };

  const navItems = [
    { id: 'map', label: 'Live Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.447-.894L15 4m0 13V4m0 0L9 7', roles: ['user', 'manager', 'rescue', 'rescue_team'] },
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', roles: ['manager'] },
    { id: 'rescue', label: 'Operations', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', roles: ['rescue', 'rescue_team'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole || ''));

  const getRoleConfig = () => {
    if (normalizedRole === 'rescue') return { color: 'rose', gradient: 'from-rose-500 to-orange-500', label: 'Rescue Team' };
    if (normalizedRole === 'manager') return { color: 'emerald', gradient: 'from-emerald-500 to-teal-500', label: 'Manager' };
    return { color: 'blue', gradient: 'from-blue-500 to-cyan-500', label: 'User' };
  };

  const roleConfig = getRoleConfig();

  return (
    <motion.aside
      initial={{ x: -280 }}
      animate={{ x: 0 }}
      exit={{ x: -280 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed left-0 top-0 h-full w-72 z-40 bg-slate-950 border-r border-slate-800/50"
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-6">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-8">
            <div className={`w-11 h-11 bg-gradient-to-br ${roleConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">SafeRoute</h1>
              <p className="text-xs text-slate-500">Emergency Response</p>
            </div>
          </div>

          {/* User Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800/50">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center text-white font-semibold text-sm`}>
                {user?.username?.charAt(0).toUpperCase() || 'G'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{user?.username || 'Guest'}</p>
                <p className="text-xs text-slate-500">{roleConfig.label}</p>
              </div>
            </div>
            {/* Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50">
              <div className={`w-2 h-2 rounded-full ${offlineMode ? 'bg-amber-500' : 'bg-emerald-500'} animate-pulse`} />
              <span className="text-xs text-slate-400">
                {offlineMode ? 'Offline Mode' : 'Connected'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3 px-3">
            Navigation
          </p>
          <div className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = viewMode === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => dispatch(setViewMode(item.id as 'map' | 'dashboard' | 'rescue'))}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive
                    ? `bg-gradient-to-r ${roleConfig.gradient} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  <span>{item.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-white"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-6">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3 px-3">
              Quick Actions
            </p>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Settings</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800/50 transition-all">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help Center</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/50">
          <motion.button
            onClick={handleLogout}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </motion.button>

          {/* Version */}
          <p className="text-[10px] text-slate-700 text-center mt-4">
            SafeRoute v2.0 • Chennai Region
          </p>
        </div>
      </div>
    </motion.aside>
  );
}

// Mobile Navigation
function MobileNav() {
  const dispatch = useDispatch();
  const { userRole, user } = useSelector((state: RootState) => state.auth);
  const { viewMode } = useSelector((state: RootState) => state.ui);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const normalizedRole = userRole === 'rescue_team' ? 'rescue' : userRole;

  const navItems = [
    { id: 'map', label: 'Live Map', icon: 'M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0121 18.382V7.618a1 1 0 00-.447-.894L15 4m0 13V4m0 0L9 7', roles: ['user', 'manager', 'rescue', 'rescue_team'] },
    { id: 'dashboard', label: 'Dashboard', icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z', roles: ['manager'] },
    { id: 'rescue', label: 'Operations', icon: 'M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z', roles: ['rescue', 'rescue_team'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(userRole || ''));

  const getRoleConfig = () => {
    if (normalizedRole === 'rescue') return { gradient: 'from-rose-500 to-orange-500' };
    if (normalizedRole === 'manager') return { gradient: 'from-emerald-500 to-teal-500' };
    return { gradient: 'from-blue-500 to-cyan-500' };
  };

  const roleConfig = getRoleConfig();

  const handleLogout = () => {
    dispatch(logout());
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-30 px-4 py-3 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800/50 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 bg-gradient-to-br ${roleConfig.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-bold text-white">SafeRoute</span>
          </div>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 bg-slate-950 border-l border-slate-800/50 md:hidden"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-6 border-b border-slate-800/50">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-white">Menu</h2>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* User Card */}
                  <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${roleConfig.gradient} flex items-center justify-center text-white font-semibold`}>
                        {user?.username?.charAt(0).toUpperCase() || 'G'}
                      </div>
                      <div>
                        <p className="font-semibold text-white">{user?.username || 'Guest'}</p>
                        <p className="text-xs text-slate-500 capitalize">{normalizedRole}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 overflow-y-auto">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 mb-3 px-3">
                    Navigation
                  </p>
                  <div className="space-y-1">
                    {filteredNavItems.map((item) => {
                      const isActive = viewMode === item.id;
                      return (
                        <motion.button
                          key={item.id}
                          onClick={() => {
                            dispatch(setViewMode(item.id as 'map' | 'dashboard' | 'rescue'));
                            setIsMenuOpen(false);
                          }}
                          whileTap={{ scale: 0.98 }}
                          className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium transition-all ${isActive
                            ? `bg-gradient-to-r ${roleConfig.gradient} text-white shadow-lg`
                            : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                            }`}
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                          </svg>
                          <span>{item.label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-slate-800/50">
                  <motion.button
                    onClick={handleLogout}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center gap-3 px-4 py-4 rounded-xl text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Sign Out</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// Main App Component
function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, userRole } = useSelector((state: RootState) => state.auth);
  const { viewMode, darkMode } = useSelector((state: RootState) => state.ui);

  // Initialize socket connection
  useSocket();

  // Check online status
  useEffect(() => {
    const handleOnline = () => dispatch(setOfflineMode(false));
    const handleOffline = () => dispatch(setOfflineMode(true));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    dispatch(setOfflineMode(!navigator.onLine));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [dispatch]);

  // Normalize userRole for display (rescue_team -> rescue)
  const normalizedRole = userRole === 'rescue_team' ? 'rescue' : userRole;

  // Set view mode based on user role after login
  useEffect(() => {
    if (isAuthenticated && userRole) {
      if (userRole === 'rescue_team' || userRole === 'rescue') {
        dispatch(setViewMode('rescue'));
        dispatch(setDarkMode(true));
      } else if (userRole === 'manager') {
        dispatch(setViewMode('dashboard'));
        dispatch(setDarkMode(false));
      } else {
        dispatch(setViewMode('map'));
        dispatch(setDarkMode(false));
      }
    }
  }, [isAuthenticated, userRole, dispatch]);

  // Debug logging
  useEffect(() => {
    console.log('🔐 Auth State:', { isAuthenticated, userRole, normalizedRole, viewMode });
  }, [isAuthenticated, userRole, normalizedRole, viewMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* Emergency Offline Mode Banner - Shows when network is unavailable */}
      <OfflineBanner />
      {/* ONE-TAP Emergency SOS - Big button, auto-broadcasts to nearby devices */}
      {isAuthenticated && <EmergencySOS />}
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthPage key="auth-page" />
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex"
          >
            {(normalizedRole === 'manager' || normalizedRole === 'rescue') && (
              <div className="hidden md:block">
                <Sidebar />
              </div>
            )}

            <MobileNav />

            <main
              className={`flex-1 h-full overflow-hidden relative ${(normalizedRole === 'manager' || normalizedRole === 'rescue') ? 'md:ml-72' : ''
                }`}
            >
              <AnimatePresence mode="wait">
                {viewMode === 'map' && normalizedRole === 'user' && (
                  <motion.div
                    key="user-dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <UserDashboard />
                  </motion.div>
                )}

                {viewMode === 'map' && normalizedRole !== 'user' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <MapMap />
                  </motion.div>
                )}

                {viewMode === 'dashboard' && normalizedRole === 'manager' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-auto pt-14 md:pt-0"
                  >
                    <ManagerDashboard />
                  </motion.div>
                )}

                {viewMode === 'rescue' && (normalizedRole === 'rescue' || userRole === 'rescue_team') && (
                  <motion.div
                    key="rescue"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full overflow-auto pt-14 md:pt-0"
                  >
                    <RescueTeamDashboard />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
