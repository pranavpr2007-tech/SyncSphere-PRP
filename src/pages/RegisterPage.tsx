import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, User, Mail, Lock, Eye, EyeOff, Hash, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import SyncSphereLogo from '../components/ui/SyncSphereLogo';
import ThemeToggle from '../components/ui/ThemeToggle';

const BRANCHES = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'ISE', 'Other'];
const YEARS = [
  { label: '1st Year', value: 1 },
  { label: '2nd Year', value: 2 },
  { label: '3rd Year', value: 3 },
  { label: '4th Year', value: 4 },
];

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  usn: string;
  branch: string;
  year: number;
  phone: string;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData & { general: string }>>({});

  const [form, setForm] = useState<FormData>({
    fullName: '', email: '', password: '', confirmPassword: '',
    usn: '', branch: 'CSE', year: 1, phone: '',
  });

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: key === 'year' ? Number(e.target.value) : e.target.value }));

  const validate = (): boolean => {
    const e: Partial<FormData & { general: string }> = {};
    const nameParts = form.fullName.trim().split(/\s+/);
    if (nameParts.length < 2) e.fullName = 'Please enter your full name (first and last)';
    if (!form.email.endsWith('.ac.in')) e.email = 'Only .ac.in college emails are allowed';
    if (form.password.length < 8) e.password = 'Min 8 characters';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Must contain at least 1 uppercase letter';
    else if (!/[0-9]/.test(form.password)) e.password = 'Must contain at least 1 number';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';
    if (form.usn.length < 6 || !/^[a-zA-Z0-9]+$/.test(form.usn)) e.usn = 'USN must be at least 6 alphanumeric characters';
    if (!/^\d{10}$/.test(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          usn: form.usn.toUpperCase(),
          branch: form.branch,
          year: form.year,
          phone: form.phone,
        },
      },
    });

    if (authError) {
      const msg = authError.message.includes('already registered')
        ? 'This email is already registered. Please log in.'
        : authError.message;
      toast.error(msg);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: form.email,
        full_name: form.fullName,
        usn: form.usn.toUpperCase(),
        branch: form.branch,
        year: form.year,
        phone: form.phone,
        role: 'student',
        reputation_score: 0,
        reporter_weight: 1.0,
      });
    }

    toast.success('Account created! Welcome to SyncSphere! 🎉');
    navigate('/feed');
    setLoading(false);
  };

  const fieldCls = (key: keyof FormData) =>
    `input-field ${errors[key] ? 'border-red-500' : ''}`;

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-8 overflow-hidden relative">
      <div className="blob w-80 h-80 bg-[var(--gold)] top-[-10%] left-[-5%]" />
      <div className="blob w-64 h-64 bg-[#6C3483] bottom-[-10%] right-[-5%]" />

      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      <div className="relative z-10 w-full max-w-md animate-scale-in">
        <div className="bg-[var(--surface)] rounded-2xl p-7 border border-[var(--border)] shadow-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Link to="/login" className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)] transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-serif text-xl font-bold text-[var(--text-primary)]">Create Account</h1>
              <p className="text-[var(--text-secondary)] text-xs">Join SyncSphere Events</p>
            </div>
            <div className="ml-auto">
              <SyncSphereLogo size="sm" showText={false} />
            </div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {/* Full Name */}
            <div>
              <div className="relative">
                <User size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input type="text" value={form.fullName} onChange={set('fullName')} placeholder="Full Name" className={`${fieldCls('fullName')} pl-10`} />
              </div>
              {errors.fullName && <p className="text-red-500 text-xs mt-1 ml-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <div className="relative">
                <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input type="email" value={form.email} onChange={set('email')} placeholder="college@vvce.ac.in" className={`${fieldCls('email')} pl-10`} />
              </div>
              {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>}
            </div>

            {/* Password row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password} onChange={set('password')} placeholder="Password"
                    className={`${fieldCls('password')} pl-8 pr-8 text-sm`}
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--gold)]">
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-[10px] mt-1">{errors.password}</p>}
              </div>
              <div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Confirm"
                    className={`${fieldCls('confirmPassword')} pl-8 pr-8 text-sm`}
                  />
                  <button type="button" onClick={() => setShowConfirm(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--gold)]">
                    {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-[10px] mt-1">{errors.confirmPassword}</p>}
              </div>
            </div>

            {/* USN */}
            <div>
              <div className="relative">
                <Hash size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input type="text" value={form.usn} onChange={set('usn')} placeholder="USN (e.g. 1VV22CS001)" className={`${fieldCls('usn')} pl-10 uppercase`} />
              </div>
              {errors.usn && <p className="text-red-500 text-xs mt-1 ml-1">{errors.usn}</p>}
            </div>

            {/* Branch + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <select value={form.branch} onChange={set('branch')} className="input-field text-sm">
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <select value={form.year} onChange={set('year')} className="input-field text-sm">
                  {YEARS.map(y => <option key={y.value} value={y.value}>{y.label}</option>)}
                </select>
              </div>
            </div>

            {/* Phone */}
            <div>
              <div className="relative">
                <Phone size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                <input type="tel" value={form.phone} onChange={set('phone')} placeholder="10-digit mobile number" className={`${fieldCls('phone')} pl-10`} maxLength={10} />
              </div>
              {errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{errors.phone}</p>}
            </div>

            <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-base mt-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Create Account <ArrowRight size={16} />
                </span>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--text-secondary)] mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-[var(--gold)] font-semibold hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
