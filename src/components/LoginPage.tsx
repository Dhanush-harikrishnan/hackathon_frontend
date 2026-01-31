import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppDispatch, RootState } from '../store';
import { login, clearError } from '../store/slices/authSlice';
import { 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle,
  Loader2,
  Shield,
  MapPin,
  Users,
  Bell,
  CheckCircle2,
  Zap,
  Globe,
  Lock,
  User
} from 'lucide-react';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

// Animated background particles
const FloatingParticle = ({ delay, duration, size, x, y }: { delay: number; duration: number; size: number; x: number; y: number }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20"
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{
      y: [0, -30, 0],
      x: [0, 15, 0],
      scale: [1, 1.1, 1],
      opacity: [0.3, 0.6, 0.3],
    }}
    transition={{
      duration,
      delay,
      repeat: Infinity,
      ease: "easeInOut"
    }}
  />
);

// Feature card component
const FeatureCard = ({ icon: Icon, title, description, delay }: { icon: React.ElementType; title: string; description: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5 }}
    className="flex items-start gap-4 p-4 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center flex-shrink-0">
      <Icon className="w-6 h-6 text-blue-400" />
    </div>
    <div>
      <h3 className="font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{description}</p>
    </div>
  </motion.div>
);

export default function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  // Clear error when inputs change
  useEffect(() => {
    if (error) {
      dispatch(clearError());
    }
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    dispatch(clearError());
    dispatch(login({ username: username.trim(), password }));
  };

  const isFormValid = username.trim().length >= 3 && password.length >= 6;

  return (
    <div className="fixed inset-0 flex bg-slate-950 overflow-hidden">
      {/* Left Panel - Branding & Features */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-slate-950 to-cyan-600/20" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        </div>
        
        {/* Floating Particles */}
        <FloatingParticle delay={0} duration={6} size={120} x={10} y={20} />
        <FloatingParticle delay={1} duration={8} size={80} x={70} y={60} />
        <FloatingParticle delay={2} duration={7} size={100} x={30} y={70} />
        <FloatingParticle delay={0.5} duration={9} size={60} x={80} y={15} />
        <FloatingParticle delay={1.5} duration={6.5} size={90} x={50} y={40} />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 opacity-[0.02]">
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '64px 64px'
          }} />
        </div>

        {/* Content */}
        <div className="relative z-10">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-4"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">SafeRoute</h1>
              <p className="text-slate-400 text-sm">Emergency Response System</p>
            </div>
          </motion.div>
        </div>

        {/* Hero Section */}
        <div className="relative z-10 flex-1 flex flex-col justify-center py-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          >
            <h2 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
              Real-time disaster
              <br />
              <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
                response & coordination
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg mb-10">
              Connect with emergency shelters, send SOS alerts, and coordinate rescue operations 
              with our advanced disaster management platform.
            </p>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid gap-4">
            <FeatureCard 
              icon={MapPin} 
              title="Live Shelter Tracking" 
              description="Find nearby shelters with real-time capacity and resource availability"
              delay={0.5}
            />
            <FeatureCard 
              icon={Bell} 
              title="Instant SOS Alerts" 
              description="Send emergency alerts with your location to rescue teams instantly"
              delay={0.6}
            />
            <FeatureCard 
              icon={Users} 
              title="Coordinated Response" 
              description="Real-time coordination between managers, rescue teams, and citizens"
              delay={0.7}
            />
          </div>
        </div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 flex items-center gap-8 pt-8 border-t border-white/10"
        >
          <div>
            <p className="text-3xl font-bold text-white">15+</p>
            <p className="text-sm text-slate-400">Active Shelters</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-3xl font-bold text-white">24/7</p>
            <p className="text-sm text-slate-400">Emergency Support</p>
          </div>
          <div className="w-px h-12 bg-white/10" />
          <div>
            <p className="text-3xl font-bold text-white">Chennai</p>
            <p className="text-sm text-slate-400">Coverage Area</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Right Panel - Login Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 relative"
      >
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-blue-600/10 via-slate-950 to-cyan-600/10" />
        
        <div className="w-full max-w-md relative z-10">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">SafeRoute</span>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">Welcome back</h2>
            <p className="text-slate-400">Enter your credentials to access your account</p>
          </motion.div>

          {/* Login Form Card */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Username Field */}
            <div className="space-y-2">
              <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                Username
              </label>
              <div className={`relative rounded-xl transition-all duration-300 ${
                focusedField === 'username' 
                  ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : ''
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <User className="w-5 h-5" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your username"
                  className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  disabled={loading}
                  autoComplete="username"
                />
                {username.length >= 3 && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </motion.div>
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <button type="button" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className={`relative rounded-xl transition-all duration-300 ${
                focusedField === 'password' 
                  ? 'ring-2 ring-blue-500/50 shadow-lg shadow-blue-500/10' 
                  : ''
              }`}>
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all"
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                    rememberMe 
                      ? 'bg-blue-500 border-blue-500' 
                      : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {rememberMe && (
                      <motion.svg 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </motion.svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                  Remember me
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading || !isFormValid}
              whileHover={{ scale: isFormValid && !loading ? 1.01 : 1 }}
              whileTap={{ scale: isFormValid && !loading ? 0.99 : 1 }}
              className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                isFormValid && !loading
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-xl shadow-blue-500/25 hover:shadow-blue-500/40'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              )}
            </motion.button>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center">
                <span className="px-4 bg-slate-950 text-sm text-slate-500">New to SafeRoute?</span>
              </div>
            </div>

            {/* Register Link */}
            <motion.button
              type="button"
              onClick={onSwitchToRegister}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full py-4 rounded-xl font-semibold bg-slate-900/50 border border-slate-700/50 text-white hover:bg-slate-800/50 hover:border-slate-600/50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              <Zap className="w-5 h-5 text-cyan-400" />
              <span>Create an account</span>
            </motion.button>
          </motion.form>

          {/* Demo Credentials */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 rounded-xl bg-slate-900/30 border border-slate-800/50"
          >
            <p className="text-xs text-slate-500 mb-3 flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Demo Credentials
            </p>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="p-2 rounded-lg bg-slate-800/50">
                <p className="text-blue-400 font-medium">User</p>
                <p className="text-slate-400">user1 / user123</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50">
                <p className="text-emerald-400 font-medium">Manager</p>
                <p className="text-slate-400">admin / admin123</p>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50">
                <p className="text-rose-400 font-medium">Rescue</p>
                <p className="text-slate-400">rescue1 / rescue123</p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-center text-xs text-slate-600 mt-8"
          >
            By signing in, you agree to our Terms of Service and Privacy Policy
          </motion.p>
        </div>
      </motion.div>
    </div>
  );
}
