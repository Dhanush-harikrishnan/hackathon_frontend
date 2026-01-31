import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import type { AppDispatch, RootState } from '../store';
import { register, clearError } from '../store/slices/authSlice';
import { 
  Eye, 
  EyeOff, 
  UserPlus, 
  AlertCircle,
  Loader2,
  Shield,
  Users,
  Truck,
  User,
  Check,
  Lock,
  ArrowLeft,
  Sparkles,
  CheckCircle2,
  Building2,
  Siren
} from 'lucide-react';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

type RoleOption = 'user' | 'manager' | 'rescue_team';

const roleOptions: { id: RoleOption; label: string; description: string; icon: React.ElementType; color: string; gradient: string }[] = [
  { 
    id: 'user', 
    label: 'Public User', 
    description: 'Find shelters, send SOS alerts, stay informed',
    icon: User,
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500'
  },
  { 
    id: 'manager', 
    label: 'Shelter Manager', 
    description: 'Manage shelter capacity, resources & operations',
    icon: Building2,
    color: 'emerald',
    gradient: 'from-emerald-500 to-teal-500'
  },
  { 
    id: 'rescue_team', 
    label: 'Rescue Team', 
    description: 'Respond to emergencies & coordinate rescues',
    icon: Siren,
    color: 'rose',
    gradient: 'from-rose-500 to-orange-500'
  },
];

// Animated background particles
const FloatingParticle = ({ delay, duration, size, x, y }: { delay: number; duration: number; size: number; x: number; y: number }) => (
  <motion.div
    className="absolute rounded-full bg-gradient-to-br from-emerald-500/20 to-cyan-500/20"
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

// Password strength indicator
const PasswordStrength = ({ password }: { password: string }) => {
  const getStrength = () => {
    if (password.length === 0) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Too short', color: 'bg-rose-500' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
    
    if (score <= 1) return { level: 2, label: 'Weak', color: 'bg-orange-500' };
    if (score === 2) return { level: 3, label: 'Fair', color: 'bg-yellow-500' };
    if (score === 3) return { level: 4, label: 'Good', color: 'bg-emerald-500' };
    return { level: 5, label: 'Strong', color: 'bg-emerald-400' };
  };

  const strength = getStrength();
  if (password.length === 0) return null;

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= strength.level ? strength.color : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      <p className={`text-xs ${strength.level <= 2 ? 'text-rose-400' : strength.level === 3 ? 'text-yellow-400' : 'text-emerald-400'}`}>
        {strength.label}
      </p>
    </div>
  );
};

export default function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector((state: RootState) => state.auth);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RoleOption>('user');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Clear errors when inputs change
  useEffect(() => {
    setValidationError(null);
    if (error) dispatch(clearError());
  }, [username, password, confirmPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    
    if (!username.trim()) {
      setValidationError('Username is required');
      return;
    }
    
    if (username.trim().length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }
    
    if (!password) {
      setValidationError('Password is required');
      return;
    }
    
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (!agreeTerms) {
      setValidationError('You must agree to the terms and conditions');
      return;
    }
    
    dispatch(clearError());
    dispatch(register({ username: username.trim(), password, role }));
  };

  const handleNextStep = () => {
    if (!username.trim() || username.trim().length < 3) {
      setValidationError('Username must be at least 3 characters');
      return;
    }
    if (!password || password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    setValidationError(null);
    setStep(2);
  };

  const isStep1Valid = username.trim().length >= 3 && password.length >= 6 && password === confirmPassword;
  const isFormValid = isStep1Valid && agreeTerms;

  const selectedRole = roleOptions.find(r => r.id === role);

  return (
    <div className="fixed inset-0 flex bg-slate-950 overflow-hidden">
      {/* Left Panel - Branding */}
      <motion.div 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative flex-col justify-between p-12 overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-slate-950 to-cyan-600/20" />
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        </div>
        
        {/* Floating Particles */}
        <FloatingParticle delay={0} duration={6} size={120} x={10} y={20} />
        <FloatingParticle delay={1} duration={8} size={80} x={70} y={60} />
        <FloatingParticle delay={2} duration={7} size={100} x={30} y={70} />
        <FloatingParticle delay={0.5} duration={9} size={60} x={80} y={15} />
        
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
            <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30">
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
              Join our network of
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                emergency responders
              </span>
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed max-w-lg mb-10">
              Whether you're seeking shelter, managing resources, or saving lives — 
              SafeRoute connects you to the help you need in times of crisis.
            </p>
          </motion.div>

          {/* Role Preview Cards */}
          <div className="space-y-4">
            {roleOptions.map((opt, index) => {
              const Icon = opt.icon;
              const isSelected = role === opt.id;
              return (
                <motion.div
                  key={opt.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isSelected 
                      ? `bg-gradient-to-r ${opt.gradient} border-transparent shadow-lg` 
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isSelected ? 'bg-white/20' : `bg-${opt.color}-500/20`
                    }`}>
                      <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : `text-${opt.color}-400`}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${isSelected ? 'text-white' : 'text-white'}`}>
                        {opt.label}
                      </h3>
                      <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {opt.description}
                      </p>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-6 h-6 text-white" />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer Quote */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="relative z-10 pt-8 border-t border-white/10"
        >
          <p className="text-slate-400 italic">
            "In times of crisis, every second counts. Be part of the solution."
          </p>
          <p className="text-slate-500 text-sm mt-2">— SafeRoute Team</p>
        </motion.div>
      </motion.div>

      {/* Right Panel - Register Form */}
      <motion.div 
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto"
      >
        {/* Mobile Background */}
        <div className="absolute inset-0 lg:hidden bg-gradient-to-br from-emerald-600/10 via-slate-950 to-cyan-600/10" />
        
        <div className="w-full max-w-md relative z-10 py-8">
          {/* Mobile Logo */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:hidden flex items-center justify-center gap-3 mb-10"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-white text-2xl font-bold">SafeRoute</span>
          </motion.div>

          {/* Back Button & Progress */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              {step === 2 ? (
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Back</span>
                </button>
              ) : (
                <button
                  onClick={onSwitchToLogin}
                  className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span className="text-sm">Sign in instead</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
                <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-emerald-500' : 'bg-slate-700'}`} />
              </div>
            </div>
          </motion.div>

          {/* Welcome Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <h2 className="text-3xl font-bold text-white mb-2">
              {step === 1 ? 'Create your account' : 'Choose your role'}
            </h2>
            <p className="text-slate-400">
              {step === 1 
                ? 'Fill in your details to get started' 
                : 'Select how you\'ll use SafeRoute'}
            </p>
          </motion.div>

          {/* Register Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Error Message */}
            <AnimatePresence mode="wait">
              {(error || validationError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{validationError || error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  {/* Username Field */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-slate-300">
                      Username
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${
                      focusedField === 'username' 
                        ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' 
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
                        placeholder="Choose a username"
                        className="w-full pl-12 pr-4 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
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
                    <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                      Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${
                      focusedField === 'password' 
                        ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' 
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
                        placeholder="Create a strong password"
                        className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    <PasswordStrength password={password} />
                  </div>

                  {/* Confirm Password Field */}
                  <div className="space-y-2">
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300">
                      Confirm Password
                    </label>
                    <div className={`relative rounded-xl transition-all duration-300 ${
                      focusedField === 'confirmPassword' 
                        ? 'ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-500/10' 
                        : ''
                    }`}>
                      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                        <Lock className="w-5 h-5" />
                      </div>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onFocus={() => setFocusedField('confirmPassword')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Confirm your password"
                        className="w-full pl-12 pr-12 py-4 bg-slate-900/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 transition-all"
                        disabled={loading}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1"
                      >
                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {confirmPassword && password === confirmPassword && (
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-emerald-400 flex items-center gap-1"
                      >
                        <Check className="w-3 h-3" /> Passwords match
                      </motion.p>
                    )}
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    disabled={!isStep1Valid}
                    whileHover={{ scale: isStep1Valid ? 1.01 : 1 }}
                    whileTap={{ scale: isStep1Valid ? 0.99 : 1 }}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                      isStep1Valid
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <span>Continue</span>
                    <Sparkles className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  {/* Role Selection */}
                  <div className="space-y-3">
                    {roleOptions.map((option) => {
                      const Icon = option.icon;
                      const isSelected = role === option.id;
                      
                      return (
                        <motion.button
                          key={option.id}
                          type="button"
                          onClick={() => setRole(option.id)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className={`relative w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 ${
                            isSelected 
                              ? `bg-gradient-to-r ${option.gradient} border-transparent shadow-lg` 
                              : 'bg-slate-900/50 border-slate-700/50 hover:border-slate-600/50'
                          }`}
                        >
                          <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
                            isSelected ? 'bg-white/20' : 'bg-slate-800'
                          }`}>
                            <Icon className={`w-7 h-7 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <div className="flex-1 text-left">
                            <p className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-white'}`}>
                              {option.label}
                            </p>
                            <p className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                              {option.description}
                            </p>
                          </div>
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'bg-white border-white' 
                              : 'border-slate-600'
                          }`}>
                            {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Terms Agreement */}
                  <label className="flex items-start gap-3 cursor-pointer group p-4 rounded-xl bg-slate-900/30 border border-slate-800/50">
                    <div className="relative mt-0.5">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-md border-2 transition-all duration-200 flex items-center justify-center ${
                        agreeTerms 
                          ? 'bg-emerald-500 border-emerald-500' 
                          : 'border-slate-600 group-hover:border-slate-500'
                      }`}>
                        {agreeTerms && (
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
                    <span className="text-sm text-slate-400 leading-relaxed">
                      I agree to the <span className="text-emerald-400 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-emerald-400 hover:underline cursor-pointer">Privacy Policy</span>. I understand my data will be used to provide emergency services.
                    </span>
                  </label>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading || !isFormValid}
                    whileHover={{ scale: isFormValid && !loading ? 1.01 : 1 }}
                    whileTap={{ scale: isFormValid && !loading ? 0.99 : 1 }}
                    className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 ${
                      isFormValid && !loading
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white shadow-xl shadow-emerald-500/25 hover:shadow-emerald-500/40'
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sign In Link */}
            <div className="text-center pt-4">
              <p className="text-slate-400 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign in
                </button>
              </p>
            </div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}
