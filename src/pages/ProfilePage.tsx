import { useState, useEffect } from 'react';
import { GraduationCap, Star, Calendar, Ban as BanIcon, LogOut, Phone, Mail, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getReputationTier, getDailyPostLimit } from '../types';
import type { Ban } from '../types';
import AvatarCircle from '../components/ui/AvatarCircle';
import { format } from 'date-fns';

const TIER_CONFIG = {
  new:          { label: 'New User',      cls: 'tier-new' },
  trusted:      { label: 'Trusted',       cls: 'tier-trusted' },
  highly_trusted:{ label: 'Highly Trusted', cls: 'tier-highly' },
  flagged:      { label: 'Flagged',        cls: 'tier-flagged' },
  restricted:   { label: 'Restricted',    cls: 'tier-restricted' },
};

export default function ProfilePage() {
  const { profile, signOut } = useAuth();
  const [activeBan, setActiveBan] = useState<Ban | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('bans')
      .select('*')
      .eq('student_id', profile.id)
      .eq('is_active', true)
      .maybeSingle()
      .then(({ data }) => setActiveBan(data as Ban | null));
  }, [profile]);

  if (!profile) return null;

  const today = new Date().toISOString().split('T')[0];
  const usedToday = profile.daily_post_date === today ? profile.daily_post_count : 0;
  const dailyLimit = getDailyPostLimit(profile.reputation_score);
  const progressPct = Math.min(100, (usedToday / dailyLimit) * 100);

  const tier = getReputationTier(profile.reputation_score);
  const tierConfig = TIER_CONFIG[tier];

  return (
    <div className="max-w-md mx-auto space-y-4 animate-fade-in">
      {/* Avatar & Name */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <AvatarCircle name={profile.full_name} size="xl" />
        </div>
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">{profile.full_name}</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1 capitalize">
          {profile.role === 'faculty_pending' ? 'Faculty (Pending)' : profile.role}
        </p>

        {/* Details */}
        <div className="mt-4 space-y-2 text-sm">
          {[
            { icon: Mail,         text: profile.email },
            { icon: Hash,         text: profile.usn || '—' },
            { icon: GraduationCap, text: `${profile.branch} · ${profile.year}${['st','nd','rd','th'][Math.min(profile.year - 1, 3)]} Year` },
            { icon: Phone,         text: profile.phone || '—' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2.5 text-[var(--text-secondary)] justify-center">
              <Icon size={14} className="text-[var(--gold)] shrink-0" />
              <span className="truncate">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Reputation Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Star size={18} className="text-[var(--gold)]" />
          <h2 className="font-serif font-bold text-[var(--text-primary)]">Reputation</h2>
        </div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-4xl font-bold font-serif text-[var(--text-primary)]">
              {profile.reputation_score}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">total score</p>
          </div>
          <span className={`tier-chip ${tierConfig.cls} text-sm font-bold px-3 py-1.5 rounded-full`}>
            {tierConfig.label}
          </span>
        </div>
        <div className="text-xs text-[var(--text-secondary)] bg-[var(--surface-raised)] rounded-xl px-3 py-2.5 border border-[var(--border)]">
          <p className="font-medium">Reporter weight: <span className="text-[var(--gold)]">{profile.reporter_weight.toFixed(2)}</span></p>
          <p className="mt-0.5 opacity-70">Higher weight = more impact on report scoring</p>
        </div>
      </div>

      {/* Daily Posts Card */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={18} className="text-[var(--gold)]" />
          <h2 className="font-serif font-bold text-[var(--text-primary)]">Daily Post Usage</h2>
        </div>
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-[var(--text-secondary)]">
            <span className="font-bold text-[var(--text-primary)]">{usedToday}</span> of{' '}
            <span className="font-bold text-[var(--text-primary)]">{dailyLimit}</span> posts used today
          </span>
          <span className="text-xs text-[var(--text-secondary)] opacity-70">resets at midnight</span>
        </div>
        <div className="w-full h-3 bg-[var(--surface-raised)] rounded-full overflow-hidden border border-[var(--border)]">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${progressPct}%`,
              background: progressPct >= 90
                ? 'linear-gradient(90deg, #ef4444, #dc2626)'
                : progressPct >= 60
                ? 'linear-gradient(90deg, #f97316, #ea580c)'
                : 'linear-gradient(90deg, #C9950F, #8B6508)',
            }}
          />
        </div>
      </div>

      {/* Active Ban */}
      {activeBan && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <BanIcon size={18} className="text-red-400" />
            <h2 className="font-serif font-bold text-red-400">Active Ban</h2>
          </div>
          <p className="text-sm text-[var(--text-primary)] mb-1">{activeBan.reason}</p>
          <p className="text-xs text-[var(--text-secondary)]">
            Issued by: <span className="font-medium">{activeBan.issued_by_name}</span>
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {activeBan.end_date
              ? `Until: ${format(new Date(activeBan.end_date), 'dd MMM yyyy')}`
              : 'Duration: Permanent'
            }
          </p>
          <p className="text-xs text-red-400 mt-2 font-medium">
            You cannot post events during this ban period.
          </p>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={signOut}
        className="btn-danger w-full py-3 flex items-center justify-center gap-2"
      >
        <LogOut size={16} />
        Sign Out
      </button>
    </div>
  );
}
