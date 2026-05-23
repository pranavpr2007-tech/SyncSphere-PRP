import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import SyncSphereLogo from '../components/ui/SyncSphereLogo';
import ThemeToggle from '../components/ui/ThemeToggle';

export default function LoginPage() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = 'Email is required';
    else if (!email.endsWith('.ac.in')) e.email = 'Only .ac.in college emails are allowed';
    if (!password) e.password = 'Password is required';
    else if (password.length < 8) e.password = 'Password must be at least 8 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg =
        error.message.includes('Invalid login credentials')
          ? 'Incorrect email or password. Please try again.'
          : error.message.includes('Email not confirmed')
          ? 'Please verify your email first.'
          : 'Login failed. Please try again.';
      toast.error(msg);
    } else {
      toast.success('Welcome back!');
      navigate('/feed');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Decorative blobs */}
      <div className="blob w-96 h-96 bg-[var(--gold)] top-[-10%] right-[-10%]" />
      <div className="blob w-72 h-72 bg-[#6C3483] bottom-[-5%] left-[-5%]" />
      <div className="blob w-48 h-48 bg-[var(--emerald)] top-[40%] left-[-8%]" />

      {/* Theme toggle top-left */}
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <div className="bg-[var(--surface)] rounded-2xl p-7 border border-[var(--border)] shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <SyncSphereLogo size="lg" showText={false} />
            <div className="mt-3 text-center">
              <h1 className="font-serif text-2xl font-bold text-[var(--gold)] tracking-tight">
                Sync-Sphere
              </h1>
              <p className="font-sans text-[var(--text-secondary)] text-sm mt-0.5">
                Campus Event Network
              </p>
            </div>
            <p className="mt-4 text-center font-serif text-lg font-semibold text-[var(--text-primary)] italic">
              "Elevate Your Experience"
            </p>
          </div>

          <form onSubmit={handleLogin} noValidate className="space-y-4">
            {/* Email */}
            <div>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="yourname@college.ac.in"
                  className={`input-field pl-10 ${errors.email ? 'border-red-500 focus:border-red-500' : ''}`}
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Password (min 8 chars)"
                  className={`input-field pl-10 pr-11 ${errors.password ? 'border-red-500 focus:border-red-500' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1.5 ml-1">{errors.password}</p>}
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 text-base"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Log In <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-[var(--border)]" />
            <span className="text-xs text-[var(--text-secondary)] font-medium">OR</span>
            <div className="flex-1 h-px bg-[var(--border)]" />
          </div>

          {/* Register */}
          <Link to="/register" className="btn-outline-gold w-full py-3 text-sm block text-center">
            <span className="flex items-center justify-center gap-2">
              <GraduationCap size={16} />
              Create Student Account
            </span>
          </Link>

          {/* Apply faculty */}
          <Link to="/apply-faculty" className="btn-emerald w-full py-3 text-sm mt-3 block text-center">
            Apply as Faculty
          </Link>

          {/* ToS */}
          <p className="text-center text-[10px] text-[var(--text-secondary)] mt-5 opacity-70">
            By continuing you agree to our{' '}
            <span className="underline cursor-pointer hover:text-[var(--gold)]">Terms of Service</span>
            {' '}and{' '}
            <span className="underline cursor-pointer hover:text-[var(--gold)]">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}
