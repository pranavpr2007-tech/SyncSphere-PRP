import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, User, Mail, BookOpen, Hash, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ui/ThemeToggle';
import SyncSphereLogo from '../components/ui/SyncSphereLogo';

const DEPARTMENTS = ['CSE', 'ECE', 'ME', 'CE', 'EEE', 'ISE', 'Mathematics', 'Physics', 'Chemistry', 'Management', 'Other'];

export default function ApplyFacultyPage() {
  const navigate = useNavigate();
  const { toggleTheme, isDark } = useTheme();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: '', email: '', department: 'CSE', employeeId: '', phone: '', password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter your full name';
    if (!form.email.endsWith('.ac.in')) e.email = 'Faculty email must end in .ac.in';
    if (!form.employeeId.trim()) e.employeeId = 'Employee ID is required';
    if (!/^\d{10}$/.test(form.phone)) e.phone = '10-digit phone required';
    if (form.password.length < 8) e.password = 'Min 8 characters';
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
      options: { data: { full_name: form.fullName, role: 'faculty_pending' } },
    });

    if (authError) {
      toast.error(authError.message.includes('already registered')
        ? 'This email is already registered.' : authError.message);
      setLoading(false);
      return;
    }

    if (authData.user) {
      await supabase.from('profiles').upsert({
        id: authData.user.id,
        email: form.email,
        full_name: form.fullName,
        usn: form.employeeId,
        branch: form.department,
        year: 0,
        phone: form.phone,
        role: 'faculty_pending',
      });
    }

    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 relative overflow-hidden">
        <div className="blob w-80 h-80 bg-[var(--emerald)] top-[-10%] right-[-5%]" />
        <div className="blob w-64 h-64 bg-[var(--gold)] bottom-[-10%] left-[-5%]" />
        <div className="relative z-10 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 max-w-sm w-full text-center animate-scale-in shadow-2xl">
          <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h2 className="font-serif text-2xl font-bold text-[var(--text-primary)] mb-2">Application Submitted!</h2>
          <p className="text-[var(--text-secondary)] text-sm mb-2">
            Your faculty application has been received.
          </p>
          <p className="text-[var(--gold)] font-semibold text-sm mb-6">{form.email}</p>
          <p className="text-[var(--text-secondary)] text-sm bg-[var(--surface-raised)] rounded-xl px-4 py-3 border border-[var(--border)]">
            🕐 The admin will review it within <strong>24 hours</strong> and send you an approval notification.
          </p>
          <Link to="/login" className="btn-gold w-full py-3 mt-6 block text-center">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4 py-8 relative overflow-hidden">
      <div className="blob w-80 h-80 bg-[var(--emerald)] top-[-10%] right-[-5%]" />
      <div className="blob w-64 h-64 bg-[var(--gold)] bottom-[-10%] left-[-5%]" />

      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
      </div>

      <div className="relative z-10 w-full max-w-sm animate-scale-in">
        <div className="bg-[var(--surface)] rounded-2xl p-7 border border-[var(--border)] shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <Link to="/login" className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)] transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="font-serif text-xl font-bold text-[var(--text-primary)]">Faculty Application</h1>
              <p className="text-[var(--text-secondary)] text-xs">Apply to join as faculty</p>
            </div>
            <div className="ml-auto"><SyncSphereLogo size="sm" showText={false} /></div>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
            {[
              { key: 'fullName', Icon: User, placeholder: 'Full Name', type: 'text' },
              { key: 'email', Icon: Mail, placeholder: 'Faculty Email (.ac.in)', type: 'email' },
              { key: 'employeeId', Icon: Hash, placeholder: 'Employee ID', type: 'text' },
              { key: 'phone', Icon: Phone, placeholder: '10-digit Phone', type: 'tel' },
              { key: 'password', Icon: null, placeholder: 'Set Password (min 8 chars)', type: 'password' },
            ].map(({ key, Icon, placeholder, type }) => (
              <div key={key}>
                <div className="relative">
                  {Icon && <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />}
                  <input
                    type={type}
                    value={(form as Record<string, string>)[key]}
                    onChange={set(key)}
                    placeholder={placeholder}
                    className={`input-field ${Icon ? 'pl-10' : ''} ${errors[key] ? 'border-red-500' : ''}`}
                  />
                </div>
                {errors[key] && <p className="text-red-500 text-xs mt-1 ml-1">{errors[key]}</p>}
              </div>
            ))}

            <div className="relative">
              <BookOpen size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
              <select value={form.department} onChange={set('department')} className="input-field pl-10">
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <button type="submit" disabled={loading} className="btn-emerald w-full py-3 text-base mt-1">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[var(--gold)]/30 border-t-[var(--gold)] rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit Application'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
