import { useState } from 'react';
import { X, Ban, AlertTriangle, Info, ShieldAlert, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import type { Event, ReportReason } from '../../types';

const REASONS: { value: ReportReason; label: string; icon: React.ElementType; desc: string }[] = [
  { value: 'spam', label: 'Spam', icon: Ban, desc: 'Repetitive or promotional content' },
  { value: 'inappropriate', label: 'Inappropriate Content', icon: ShieldAlert, desc: 'Offensive or harmful material' },
  { value: 'false_info', label: 'False Information', icon: Info, desc: 'Misleading or incorrect details' },
  { value: 'offensive', label: 'Offensive', icon: AlertTriangle, desc: 'Abusive or hurtful language' },
  { value: 'other', label: 'Other', icon: FileText, desc: 'Something else not listed above' },
];

const REPORT_THRESHOLD = 5;

interface Props {
  event: Event;
  onClose: () => void;
}

export default function ReportModal({ event, onClose }: Props) {
  const { profile } = useAuth();
  const [selected, setSelected] = useState<ReportReason | null>(null);
  const [loading, setLoading] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useState(() => {
    if (!profile) return;
    supabase
      .from('reports')
      .select('id')
      .eq('event_id', event.id)
      .eq('reporter_id', profile.id)
      .maybeSingle()
      .then(({ data }) => { if (data) setAlreadyReported(true); });
  });

  const handleSubmit = async () => {
    if (!selected || !profile) return;
    setLoading(true);

    const { error } = await supabase.from('reports').insert({
      event_id: event.id,
      reporter_id: profile.id,
      reporter_name: profile.full_name,
      reason: selected,
      reporter_weight: profile.reporter_weight,
    });

    if (error?.code === '23505') {
      setAlreadyReported(true);
      setLoading(false);
      return;
    }

    if (error) {
      toast.error('Failed to submit report. Please try again.');
      setLoading(false);
      return;
    }

    // Update weighted report score
    const newScore = event.weighted_report_score + profile.reporter_weight;
    const newCount = event.report_count + 1;
    const updates: Record<string, unknown> = {
      report_count: newCount,
      weighted_report_score: newScore,
    };

    // Auto-hide if threshold reached
    if (newScore >= REPORT_THRESHOLD) {
      updates.state = 'auto_hidden';
      // Notify faculty
      const { data: faculty } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'faculty')
        .limit(10);
      if (faculty) {
        const notifs = faculty.map((f: { id: string }) => ({
          user_id: f.id,
          type: 'report_submitted',
          title: '⚠ Event Auto-Hidden',
          body: `"${event.title}" was auto-hidden after reaching the report threshold.`,
          data: { event_id: event.id },
        }));
        await supabase.from('notifications').insert(notifs);
      }
    }

    await supabase.from('events').update(updates).eq('id', event.id);
    setSubmitted(true);
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Report Event</h2>
            <p className="text-[var(--text-secondary)] text-xs mt-0.5">
              Your identity will not be revealed to other students.
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 size={32} className="text-green-400" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] mb-1">Report Submitted</h3>
            <p className="text-[var(--text-secondary)] text-sm">Thank you for helping keep the campus safe.</p>
            <button onClick={onClose} className="btn-gold mt-5 px-8 py-2.5">Done</button>
          </div>
        ) : alreadyReported ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <AlertTriangle size={32} className="text-amber-400" />
            </div>
            <h3 className="font-serif text-lg font-bold text-[var(--text-primary)] mb-1">Already Reported</h3>
            <p className="text-[var(--text-secondary)] text-sm">You've already reported this event. Our team will review it.</p>
            <button onClick={onClose} className="btn-outline-gold mt-5 px-8 py-2.5">Close</button>
          </div>
        ) : (
          <>
            <p className="text-[var(--text-primary)] text-sm font-medium mb-3">
              Why are you reporting "{event.title}"?
            </p>
            <div className="space-y-2">
              {REASONS.map(({ value, label, icon: Icon, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelected(value)}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all
                    ${selected === value
                      ? 'border-[var(--gold)] bg-[var(--gold)]/10'
                      : 'border-[var(--border)] hover:border-[var(--gold)]/40'
                    }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0
                    ${selected === value ? 'bg-[var(--gold)]/20 text-[var(--gold)]' : 'bg-[var(--surface-raised)] text-[var(--text-secondary)]'}`}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${selected === value ? 'text-[var(--gold)]' : 'text-[var(--text-primary)]'}`}>
                      {label}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!selected || loading}
              className="btn-gold w-full py-3 mt-4 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Submitting...
                </span>
              ) : 'Submit Report'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
