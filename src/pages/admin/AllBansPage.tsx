import { useState, useEffect, useCallback } from 'react';
import { Ban, Unlock, Filter } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Ban as BanType } from '../../types';

function UnbanModal({
  ban,
  onClose,
  onUnbanned,
}: {
  ban: BanType;
  onClose: () => void;
  onUnbanned: () => void;
}) {
  const { profile } = useAuth();
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnban = async () => {
    if (!profile) return;
    setLoading(true);
    await supabase.from('bans').update({
      is_active: false,
      unban_notes: notes.trim() || null,
      unbanned_by: profile.id,
      unbanned_at: new Date().toISOString(),
    }).eq('id', ban.id);
    await supabase.from('notifications').insert({
      user_id: ban.student_id,
      type: 'ban_lifted',
      title: 'Ban Lifted by Admin',
      body: notes.trim()
        ? `Your posting ban has been removed. Note: ${notes.trim()}`
        : 'Your posting ban has been removed.',
      data: {},
    });
    toast.success(`${ban.student_name} unbanned`);
    onUnbanned();
    onClose();
    setLoading(false);
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content max-w-sm">
        <h2 className="font-serif text-xl font-bold text-[var(--text-primary)] mb-4">Lift Ban</h2>
        <p className="text-sm text-[var(--text-secondary)] mb-4">
          Removing ban for <strong className="text-[var(--text-primary)]">{ban.student_name}</strong>
        </p>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
              Note (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Reason for lifting the ban..."
              rows={3}
              className="input-field resize-none"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline-gold flex-1 py-2.5 text-sm">Cancel</button>
            <button
              onClick={handleUnban}
              disabled={loading}
              className="flex-1 py-2.5 rounded-full bg-green-600 text-white font-semibold text-sm flex items-center justify-center gap-2 hover:bg-green-700 disabled:opacity-40 transition-colors"
            >
              <Unlock size={14} /> {loading ? 'Processing...' : 'Lift Ban'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AllBansPage() {
  const [bans, setBans] = useState<BanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'all'>('active');
  const [unbanTarget, setUnbanTarget] = useState<BanType | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('bans').select('*').order('created_at', { ascending: false });
    if (filter === 'active') query = query.eq('is_active', true);
    const { data } = await query;
    setBans((data ?? []) as BanType[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
          <Ban size={20} className="text-red-400" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">All Bans</h1>
          <p className="text-[var(--text-secondary)] text-sm">{bans.length} record{bans.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Filter toggle */}
        <div className="ml-auto flex items-center gap-1 bg-[var(--surface-raised)] border border-[var(--border)] rounded-xl p-1">
          {(['active', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all capitalize
                ${filter === f ? 'bg-[var(--gold)] text-black' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
            >
              {f === 'active' ? 'Active Only' : 'All History'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
      ) : bans.length === 0 ? (
        <div className="text-center py-12">
          <Ban size={28} className="mx-auto mb-2 text-[var(--text-secondary)] opacity-30" />
          <p className="text-[var(--text-secondary)] text-sm">No bans found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {bans.map(ban => (
            <div key={ban.id} className={`bg-[var(--surface)] border rounded-2xl p-4 ${ban.is_active ? 'border-red-500/30' : 'border-[var(--border)] opacity-70'}`}>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">{ban.student_name}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{ban.student_usn}</span>
                    {ban.is_active && (
                      <span className="text-[10px] bg-red-500/15 text-red-400 font-bold px-1.5 py-0.5 rounded-full">ACTIVE</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Issued by: <span className="font-medium">{ban.issued_by_name}</span>
                    {' · '}{format(new Date(ban.start_date), 'd MMM yyyy')}
                  </p>
                </div>
                {ban.is_active && (
                  <button
                    onClick={() => setUnbanTarget(ban)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 text-green-400 text-xs font-semibold border border-green-500/20 hover:bg-green-500/20 transition-colors shrink-0"
                  >
                    <Unlock size={12} /> Unban
                  </button>
                )}
              </div>

              <p className="text-sm text-[var(--text-primary)] mb-2 line-clamp-2">{ban.reason}</p>

              <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                <span>
                  Until: <span className="font-medium">{ban.end_date ? format(new Date(ban.end_date), 'd MMM yyyy') : 'Permanent'}</span>
                </span>
                {!ban.is_active && ban.unbanned_at && (
                  <span className="text-green-400">
                    Lifted: {format(new Date(ban.unbanned_at), 'd MMM yyyy')}
                  </span>
                )}
                {ban.unban_notes && (
                  <span className="text-[var(--text-secondary)] italic truncate">· "{ban.unban_notes}"</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {unbanTarget && (
        <UnbanModal
          ban={unbanTarget}
          onClose={() => setUnbanTarget(null)}
          onUnbanned={fetch}
        />
      )}
    </div>
  );
}
