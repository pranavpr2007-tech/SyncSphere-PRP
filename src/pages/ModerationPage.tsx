import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, CheckCircle2, XCircle, Flag, AlertTriangle, Eye, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Event, Report } from '../types';
import TagChip from '../components/events/TagChip';

function useModerationQueue() {
  const [items, setItems] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('state', 'auto_hidden')
      .order('updated_at', { ascending: false });
    setItems((data ?? []) as Event[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const ch = supabase.channel('moderation_queue')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetch]);

  return { items, loading, refetch: fetch };
}

function ReportsList({ eventId }: { eventId: string }) {
  const [reports, setReports] = useState<Report[]>([]);

  useEffect(() => {
    supabase
      .from('reports')
      .select('*')
      .eq('event_id', eventId)
      .order('reporter_weight', { ascending: false })
      .then(({ data }) => setReports((data ?? []) as Report[]));
  }, [eventId]);

  const REASON_LABELS: Record<string, string> = {
    spam: '🚫 Spam', inappropriate: '⚠️ Inappropriate',
    false_info: '❌ False Info', offensive: '🔞 Offensive', other: '📝 Other',
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {reports.map(r => (
        <span key={r.id} className="text-[11px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded-full">
          {REASON_LABELS[r.reason] ?? r.reason} (w:{r.reporter_weight.toFixed(1)})
        </span>
      ))}
    </div>
  );
}

export default function ModerationPage() {
  const { profile } = useAuth();
  const { items, loading, refetch } = useModerationQueue();
  const [actionId, setActionId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleApprove = async (event: Event) => {
    setActionId(event.id);
    await supabase.from('events').update({ state: 'active' }).eq('id', event.id);
    await supabase.rpc('increment_reputation', { target_id: event.posted_by, delta: 2 });

    // Reward reporters who were wrong (event was fine)
    const { data: reports } = await supabase.from('reports').select('*').eq('event_id', event.id);
    if (reports) {
      for (const r of reports) {
        await supabase.rpc('increment_reputation', { target_id: r.reporter_id, delta: -1 });
        await supabase.rpc('adjust_reporter_weight', { target_id: r.reporter_id, delta: -0.2 });
      }
    }

    await supabase.from('reports').update({ reviewed_by: profile?.id, review_result: 'false' }).eq('event_id', event.id);
    await supabase.from('notifications').insert({
      user_id: event.posted_by,
      type: 'event_verified',
      title: 'Good news! Event Restored',
      body: `"${event.title}" was reviewed and found to be valid. It's back on the feed!`,
      data: { event_id: event.id },
    });

    toast.success('Event restored — poster reputation +2 🎉');
    setActionId(null);
  };

  const handleRemove = async (event: Event) => {
    if (!confirm(`Permanently remove "${event.title}"?`)) return;
    setActionId(event.id);
    await supabase.from('events').update({ state: 'removed' }).eq('id', event.id);
    await supabase.rpc('increment_reputation', { target_id: event.posted_by, delta: -3 });

    // Reward reporters who were right
    const { data: reports } = await supabase.from('reports').select('*').eq('event_id', event.id);
    if (reports) {
      for (const r of reports) {
        await supabase.rpc('increment_reputation', { target_id: r.reporter_id, delta: 1 });
        await supabase.rpc('adjust_reporter_weight', { target_id: r.reporter_id, delta: 0.1 });
      }
    }

    await supabase.from('reports').update({ reviewed_by: profile?.id, review_result: 'valid' }).eq('event_id', event.id);
    await supabase.from('notifications').insert({
      user_id: event.posted_by,
      type: 'event_removed',
      title: 'Event Removed by Faculty',
      body: `"${event.title}" was reviewed and removed for policy violations.`,
      data: { event_id: event.id },
    });

    toast.success('Event removed — poster reputation -3');
    setActionId(null);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
          <ShieldCheck size={20} className="text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Moderation Queue</h1>
          <p className="text-[var(--text-secondary)] text-sm">
            {items.length > 0 ? `${items.length} item${items.length !== 1 ? 's' : ''} pending review` : 'All clear'}
          </p>
        </div>
        {items.length > 0 && (
          <span className="ml-auto bg-red-500 text-white text-sm font-bold rounded-full min-w-[28px] h-7 flex items-center justify-center px-2">
            {items.length}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-400" />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-1">No pending reports</h3>
          <p className="text-[var(--text-secondary)] text-sm">You're all caught up! ✓</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map(event => (
            <div key={event.id} className="bg-[var(--surface)] border border-red-500/30 rounded-2xl overflow-hidden">
              {/* Banner */}
              <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2.5 flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" />
                <span className="text-red-400 text-xs font-semibold">
                  Auto-hidden · {event.report_count} report{event.report_count !== 1 ? 's' : ''} · Weighted score: {event.weighted_report_score.toFixed(1)}
                </span>
              </div>

              <div className="p-4 space-y-3">
                {/* Event info */}
                <div className="flex gap-3">
                  {event.poster_url ? (
                    <img src={event.poster_url} alt="" className="w-20 h-14 object-cover rounded-xl shrink-0" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  ) : (
                    <div className="w-20 h-14 bg-[var(--surface-raised)] rounded-xl flex items-center justify-center shrink-0">
                      <ImageOff size={16} className="opacity-30" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-serif font-bold text-[var(--text-primary)] line-clamp-1">{event.title}</h3>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      by <span className="font-medium text-amber-400">{event.display_name}</span>
                      {event.is_anonymous && (
                        <span className="ml-2 text-[10px] text-[var(--text-secondary)]">
                          · Real identity: <span className="font-semibold text-[var(--text-primary)]">{event.posted_by_name}</span>
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                      {format(new Date(event.created_at), 'd MMM yyyy')}
                    </p>
                  </div>
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {event.tags.map(t => <TagChip key={t} tag={t} />)}
                  </div>
                )}

                {/* Report reasons */}
                <div>
                  <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Flag size={11} /> Report reasons
                  </p>
                  <ReportsList eventId={event.id} />
                </div>

                {/* Expand description */}
                {event.description && (
                  <button
                    onClick={() => setExpandedId(expandedId === event.id ? null : event.id)}
                    className="flex items-center gap-1.5 text-xs text-[var(--gold)] hover:opacity-80 transition-opacity"
                  >
                    <Eye size={12} />
                    {expandedId === event.id ? 'Hide description' : 'View description'}
                  </button>
                )}
                {expandedId === event.id && (
                  <p className="text-sm text-[var(--text-secondary)] bg-[var(--surface-raised)] rounded-xl p-3 border border-[var(--border)]">
                    {event.description}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => handleApprove(event)}
                    disabled={actionId === event.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-green-500 text-green-400 text-sm font-semibold hover:bg-green-500/10 transition-colors disabled:opacity-40"
                  >
                    <CheckCircle2 size={15} /> Approve Event
                  </button>
                  <button
                    onClick={() => handleRemove(event)}
                    disabled={actionId === event.id}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-red-500 text-red-400 text-sm font-semibold hover:bg-red-500/10 transition-colors disabled:opacity-40"
                  >
                    <XCircle size={15} /> Remove Event
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
