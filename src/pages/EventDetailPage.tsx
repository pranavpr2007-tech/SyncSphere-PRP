import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft, Calendar, IndianRupee, Trophy, Users, Link2, Bell, BellOff,
  Flag, CheckCircle2, XCircle, EyeOff, Shield, ImageOff, ExternalLink,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useEvent, useReminder } from '../hooks/useEvents';
import TagChip from '../components/events/TagChip';
import ReportModal from '../components/events/ReportModal';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { event, loading } = useEvent(id ?? '');
  const { hasReminder, toggle: toggleReminder, loading: reminderLoading } = useReminder(id ?? '');
  const [showReport, setShowReport] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin';

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="skeleton w-20 h-8 rounded-xl" />
        <div className="skeleton w-full aspect-video rounded-xl" />
        <div className="skeleton h-8 w-3/4 rounded" />
        <div className="skeleton h-4 w-1/2 rounded" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-[var(--text-secondary)]">Event not found.</p>
        <button onClick={() => navigate('/feed')} className="btn-gold mt-4 px-6 py-2.5">
          Back to Feed
        </button>
      </div>
    );
  }

  const handleVerify = async () => {
    setActionLoading(true);
    await supabase.from('events').update({ state: 'verified' }).eq('id', event.id);
    // +2 reputation to poster
    await supabase.rpc('increment_reputation', { target_id: event.posted_by, delta: 2 });
    // Notify poster
    await supabase.from('notifications').insert({
      user_id: event.posted_by,
      type: 'event_verified',
      title: 'Event Verified ✓',
      body: `"${event.title}" has been verified by faculty.`,
      data: { event_id: event.id },
    });
    toast.success('Event verified! +2 reputation for poster.');
    navigate('/feed');
    setActionLoading(false);
  };

  const handleRemove = async () => {
    if (!confirm(`Remove "${event.title}"? This will penalize the poster's reputation.`)) return;
    setActionLoading(true);
    await supabase.from('events').update({ state: 'removed' }).eq('id', event.id);
    // -3 reputation to poster
    await supabase.rpc('increment_reputation', { target_id: event.posted_by, delta: -3 });
    await supabase.from('notifications').insert({
      user_id: event.posted_by,
      type: 'event_removed',
      title: 'Event Removed',
      body: `"${event.title}" was removed by a faculty member.`,
      data: { event_id: event.id },
    });
    toast.success('Event removed.');
    navigate('/feed');
    setActionLoading(false);
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--gold)] transition-colors text-sm font-medium"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* Poster */}
      <div className="w-full aspect-video rounded-2xl overflow-hidden bg-[var(--surface-raised)] border border-[var(--border)]">
        {event.poster_url && !imgError ? (
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] gap-3">
            <ImageOff size={40} strokeWidth={1} opacity={0.4} />
            <span className="text-sm opacity-50">No poster uploaded</span>
          </div>
        )}
      </div>

      {/* State banners */}
      {event.state === 'verified' && (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3">
          <CheckCircle2 size={18} className="text-green-400 shrink-0" />
          <p className="text-green-400 text-sm font-semibold">This event has been verified by faculty</p>
        </div>
      )}
      {event.state === 'auto_hidden' && isFacultyOrAdmin && (
        <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
          <EyeOff size={18} className="text-red-400 shrink-0" />
          <p className="text-red-400 text-sm font-semibold">Hidden by moderation — pending review</p>
        </div>
      )}

      {/* Anonymous identity reveal for faculty */}
      {isFacultyOrAdmin && event.is_anonymous && (
        <div className={`flex items-start gap-2 rounded-xl px-4 py-3 border ${
          event.report_count > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-[var(--surface-raised)] border-[var(--border)]'
        }`}>
          <Shield size={18} className={event.report_count > 0 ? 'text-amber-400' : 'text-[var(--text-secondary)]'} />
          <div>
            {event.report_count > 0 ? (
              <p className="text-amber-400 text-sm">
                <span className="font-semibold">Anonymous post</span> · Real identity:{' '}
                <strong>{event.posted_by_name}</strong>
              </p>
            ) : (
              <p className="text-[var(--text-secondary)] text-sm">
                <span className="font-semibold">Anonymous post</span> · Identity protected (no reports yet)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Main info */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 space-y-4">
        {/* Title */}
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)] leading-snug">
          {event.title}
        </h1>

        {/* Posted by */}
        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <span>Posted by</span>
          <span className="font-semibold text-[var(--text-primary)]">{event.display_name}</span>
          {event.posted_by_role !== 'student' && (
            <span className="text-[11px] bg-[var(--gold)]/15 text-[var(--gold)] px-2 py-0.5 rounded-full font-semibold">
              {event.posted_by_role === 'faculty' ? 'Faculty' : 'Admin'}
            </span>
          )}
          <span className="ml-auto text-xs">{format(new Date(event.created_at), 'd MMM yyyy')}</span>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          {event.datetime && (
            <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
              <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center shrink-0">
                <Calendar size={16} className="text-[var(--gold)]" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Date & Time</p>
                <p className="text-[var(--text-primary)] font-medium">{format(new Date(event.datetime), 'EEE, d MMM yyyy · h:mm a')}</p>
              </div>
            </div>
          )}
          <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
            <div className="w-8 h-8 rounded-lg bg-[var(--gold)]/10 flex items-center justify-center shrink-0">
              <IndianRupee size={16} className="text-[var(--gold)]" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Registration Fee</p>
              <p className={`font-medium ${event.registration_fee === 0 ? 'text-green-400' : 'text-[var(--text-primary)]'}`}>
                {event.registration_fee === 0 ? 'Free Entry' : `₹${event.registration_fee}`}
              </p>
            </div>
          </div>
          {event.prize_pool && (
            <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Trophy size={16} className="text-amber-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Prize Pool</p>
                <p className="text-[var(--text-primary)] font-medium">{event.prize_pool}</p>
              </div>
            </div>
          )}
          {event.eligibility && (
            <div className="flex items-center gap-2.5 text-[var(--text-secondary)]">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Users size={16} className="text-blue-400" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider opacity-60">Eligibility</p>
                <p className="text-[var(--text-primary)] font-medium">{event.eligibility}</p>
              </div>
            </div>
          )}
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-secondary)] opacity-60 mb-2">About</h3>
            <p className="text-[var(--text-primary)] text-sm leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Tags */}
        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {event.tags.map(tag => <TagChip key={tag} tag={tag} size="md" />)}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-3">
        {/* Register */}
        {event.registration_link && (
          <a
            href={event.registration_link}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold w-full py-3 text-base flex items-center justify-center gap-2"
          >
            <Link2 size={16} />
            Register for Event
            <ExternalLink size={14} />
          </a>
        )}

        {/* Reminder toggle */}
        <button
          onClick={() => toggleReminder(event)}
          disabled={reminderLoading}
          className={`w-full py-3 rounded-full font-semibold text-sm border flex items-center justify-center gap-2 transition-all
            ${hasReminder
              ? 'bg-[var(--gold)]/10 border-[var(--gold)] text-[var(--gold)]'
              : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/50'
            }`}
        >
          {hasReminder ? <Bell size={16} /> : <BellOff size={16} />}
          {hasReminder ? 'Reminder Set ✓' : 'Set Reminder 🔔'}
        </button>

        {/* Faculty actions */}
        {isFacultyOrAdmin && event.state !== 'verified' && event.state !== 'removed' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleVerify}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-full border-2 border-green-500 text-green-400 font-semibold text-sm hover:bg-green-500/10 transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={16} /> Verify Event
            </button>
            <button
              onClick={handleRemove}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 py-3 rounded-full border-2 border-red-500 text-red-400 font-semibold text-sm hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              <XCircle size={16} /> Remove Event
            </button>
          </div>
        )}

        {/* Report button (students only) */}
        {profile?.role === 'student' && (
          <button
            onClick={() => setShowReport(true)}
            className="btn-danger w-full py-2.5 text-sm flex items-center justify-center gap-2 mt-1"
          >
            <Flag size={15} /> Report Event
          </button>
        )}
      </div>

      {/* Report modal */}
      {showReport && (
        <ReportModal
          event={event}
          onClose={() => setShowReport(false)}
        />
      )}
    </div>
  );
}
