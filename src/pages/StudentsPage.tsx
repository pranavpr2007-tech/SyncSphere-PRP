import { useState, useEffect, useCallback } from 'react';
import { Search, Ban as BanIcon, Unlock, User, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Profile, Ban } from '../types';
import { getReputationTier } from '../types';
import AvatarCircle from '../components/ui/AvatarCircle';

const TIER_CONFIG = {
  new:           { label: 'New',         cls: 'tier-new' },
  trusted:       { label: 'Trusted',     cls: 'tier-trusted' },
  highly_trusted:{ label: 'Highly Trusted', cls: 'tier-highly' },
  flagged:       { label: 'Flagged',     cls: 'tier-flagged' },
  restricted:    { label: 'Restricted',  cls: 'tier-restricted' },
};

const BAN_DURATIONS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: 'Permanent', days: null },
];

function BanModal({
  student,
  onClose,
  onBanned,
}: {
  student: Profile;
  onClose: () => void;
  onBanned: () => void;
}) {
  const { profile } = useAuth();
  const [days, setDays] = useState<number | null>(7);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBan = async () => {
    if (!profile || reason.trim().length < 20) {
      toast.error('Reason must be at least 20 characters');
      return;
    }
    setLoading(true);
    const endDate = days
      ? new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase.from('bans').insert({
      student_id: student.id,
      student_name: student.full_name,
      student_usn: student.usn,
      issued_by: profile.id,
      issued_by_name: profile.full_name,
      reason: reason.trim(),
      start_date: new Date().toISOString(),
      end_date: endDate,
      is_active: true,
    });

    if (!error) {
      await supabase.from('notifications').insert({
        user_id: student.id,
        type: 'ban_issued',
        title: 'Account Banned',
        body: `You have been banned from posting events. Reason: ${reason.trim()}`,
        data: {},
      });
      toast.success(`${student.full_name} has been banned`);
      onBanned();
      onClose();
    } else {
      toast.error('Failed to issue ban');
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-red-400">Issue Ban</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-red-500/10 text-[var(--text-secondary)]">
            <X size={18} />
          </button>
        </div>

        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-2">
            <AvatarCircle name={student.full_name} size="sm" />
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">{student.full_name}</p>
              <p className="text-xs text-[var(--text-secondary)]">{student.usn} · {student.branch}</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 block">
              Ban Duration
            </label>
            <div className="grid grid-cols-2 gap-2">
              {BAN_DURATIONS.map(({ label, days: d }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setDays(d)}
                  className={`py-2.5 rounded-xl border text-sm font-semibold transition-all
                    ${days === d
                      ? 'border-red-500 bg-red-500/10 text-red-400'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-red-500/40'
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-2 flex justify-between">
              <span>Reason *</span>
              <span className={reason.length < 20 ? 'text-red-400' : 'text-green-400'}>
                {reason.length}/20 min
              </span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Explain why this student is being banned..."
              rows={3}
              className="input-field resize-none"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-400">
              This student will not be able to post events during the ban period.
            </p>
          </div>

          <button
            onClick={handleBan}
            disabled={reason.trim().length < 20 || loading}
            className="w-full py-3 rounded-full bg-red-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-40 transition-colors"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><BanIcon size={15} /> Confirm Ban</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function StudentPanel({
  student,
  onClose,
  onUpdate,
}: {
  student: Profile;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const { profile } = useAuth();
  const [activeBan, setActiveBan] = useState<Ban | null>(null);
  const [showBanModal, setShowBanModal] = useState(false);
  const [unbanning, setUnbanning] = useState(false);

  const fetchBan = useCallback(async () => {
    const { data } = await supabase
      .from('bans')
      .select('*')
      .eq('student_id', student.id)
      .eq('is_active', true)
      .maybeSingle();
    setActiveBan(data as Ban | null);
  }, [student.id]);

  useEffect(() => { fetchBan(); }, [fetchBan]);

  const tier = getReputationTier(student.reputation_score);
  const tierConfig = TIER_CONFIG[tier];

  const canUnban =
    activeBan && (
      profile?.role === 'admin' ||
      activeBan.issued_by === profile?.id
    );

  const handleUnban = async () => {
    if (!activeBan || !profile) return;
    setUnbanning(true);
    await supabase
      .from('bans')
      .update({ is_active: false, unbanned_by: profile.id, unbanned_at: new Date().toISOString() })
      .eq('id', activeBan.id);
    await supabase.from('notifications').insert({
      user_id: student.id,
      type: 'ban_lifted',
      title: 'Ban Lifted',
      body: 'Your posting ban has been removed. You can post events again.',
      data: {},
    });
    toast.success(`${student.full_name} has been unbanned`);
    setActiveBan(null);
    onUpdate();
    setUnbanning(false);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-[var(--surface)] border-l border-[var(--border)] shadow-2xl z-50 flex flex-col animate-slide-down overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--border)] sticky top-0 bg-[var(--surface)]">
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)] transition-colors">
          <X size={18} />
        </button>
        <h2 className="font-serif font-bold text-[var(--text-primary)]">Student Profile</h2>
      </div>

      <div className="flex-1 p-4 space-y-4">
        {/* Profile header */}
        <div className="flex items-center gap-3 bg-[var(--surface-raised)] rounded-xl p-4 border border-[var(--border)]">
          <AvatarCircle name={student.full_name} size="lg" />
          <div>
            <h3 className="font-serif font-bold text-[var(--text-primary)]">{student.full_name}</h3>
            <p className="text-sm text-[var(--text-secondary)]">{student.usn}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{student.branch} · {student.year}yr</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold font-serif text-[var(--text-primary)]">{student.reputation_score}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Reputation</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full mt-1.5 inline-block ${tierConfig.cls}`}>
              {tierConfig.label}
            </span>
          </div>
          <div className="bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-3 text-center">
            <p className="text-2xl font-bold font-serif text-[var(--text-primary)]">{student.reporter_weight.toFixed(1)}</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Reporter Weight</p>
          </div>
        </div>

        {/* Active ban */}
        {activeBan && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <BanIcon size={15} className="text-red-400" />
              <p className="text-red-400 font-semibold text-sm">Active Ban</p>
            </div>
            <p className="text-sm text-[var(--text-primary)]">{activeBan.reason}</p>
            <p className="text-xs text-[var(--text-secondary)]">
              Issued by: <span className="font-medium">{activeBan.issued_by_name}</span>
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {activeBan.end_date
                ? `Until: ${format(new Date(activeBan.end_date), 'dd MMM yyyy')}`
                : 'Permanent'
              }
            </p>

            {canUnban ? (
              <button
                onClick={handleUnban}
                disabled={unbanning}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-500/10 text-green-400 border border-green-500/30 text-sm font-semibold hover:bg-green-500/20 transition-colors disabled:opacity-50"
              >
                <Unlock size={14} />
                {unbanning ? 'Unbanning...' : 'Lift Ban'}
              </button>
            ) : (
              <p className="text-xs text-amber-400 text-center">
                ⛔ Only <strong>{activeBan.issued_by_name}</strong> or Admin can remove this ban
              </p>
            )}
          </div>
        )}

        {/* Issue ban button */}
        {!activeBan && (
          <button
            onClick={() => setShowBanModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-red-500/40 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors"
          >
            <BanIcon size={15} /> Issue Ban
          </button>
        )}
      </div>

      {showBanModal && (
        <BanModal
          student={student}
          onClose={() => setShowBanModal(false)}
          onBanned={() => { fetchBan(); onUpdate(); }}
        />
      )}
    </div>
  );
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [selected, setSelected] = useState<Profile | null>(null);
  const [bannedIds, setBannedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'student')
      .order('full_name');

    if (searchDebounced) {
      query = query.or(`full_name.ilike.%${searchDebounced}%,usn.ilike.%${searchDebounced}%`);
    }

    const { data } = await query.limit(50);
    setStudents((data ?? []) as Profile[]);

    // Fetch banned IDs
    const { data: bans } = await supabase
      .from('bans')
      .select('student_id')
      .eq('is_active', true);
    setBannedIds(new Set((bans ?? []).map(b => b.student_id)));
    setLoading(false);
  }, [searchDebounced]);

  useEffect(() => { fetchStudents(); }, [fetchStudents]);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
          <User size={20} className="text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Student Management</h1>
          <p className="text-[var(--text-secondary)] text-sm">{students.length} students found</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or USN..."
          className="input-field pl-11"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <User size={28} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No students found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map(s => {
            const tier = getReputationTier(s.reputation_score);
            const tierConfig = TIER_CONFIG[tier];
            const isBanned = bannedIds.has(s.id);

            return (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-[var(--surface)] border border-[var(--border)] hover:border-[var(--gold)]/40 transition-all text-left"
              >
                <AvatarCircle name={s.full_name} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{s.full_name}</p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {s.usn} · {s.branch} · {s.year}yr
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierConfig.cls}`}>
                    {tierConfig.label}
                  </span>
                  {isBanned && (
                    <span className="text-[10px] font-bold bg-red-500/15 text-red-400 px-2 py-0.5 rounded-full">
                      Banned
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Student detail panel */}
      {selected && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelected(null)} />
          <StudentPanel
            student={selected}
            onClose={() => setSelected(null)}
            onUpdate={fetchStudents}
          />
        </>
      )}
    </div>
  );
}
