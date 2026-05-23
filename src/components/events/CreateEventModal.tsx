import { useState, useRef } from 'react';
import { X, Upload, Eye, EyeOff, ImageIcon, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { v4 as uuid } from 'crypto';
import { supabase, uploadEventPoster, compressImage } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { getDailyPostLimit } from '../../types';
import type { EventTag } from '../../types';

// Simple uuid substitute
function genId() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

const TAGS: EventTag[] = ['tech', 'cultural', 'sports', 'academic', 'workshop'];
const TAG_LABELS: Record<EventTag, string> = {
  tech: 'Tech', cultural: 'Cultural', sports: 'Sports', academic: 'Academic', workshop: 'Workshop',
};

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateEventModal({ onClose, onSuccess }: Props) {
  const { profile } = useAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [selectedTags, setSelectedTags] = useState<EventTag[]>([]);

  const [form, setForm] = useState({
    title: '', description: '', date: '', time: '',
    fee: '0', regLink: '', eligibility: '', prizePool: '',
  });

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [key]: e.target.value }));

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    const compressed = await compressImage(file, 500);
    setPosterFile(compressed);
    setPosterPreview(URL.createObjectURL(compressed));
  };

  const toggleTag = (tag: EventTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!form.title.trim()) { toast.error('Event title is required'); return; }

    setLoading(true);

    // Check active ban
    const { data: ban } = await supabase
      .from('bans')
      .select('id, reason, end_date')
      .eq('student_id', profile.id)
      .eq('is_active', true)
      .maybeSingle();

    if (ban) {
      const until = ban.end_date ? `until ${new Date(ban.end_date).toLocaleDateString()}` : 'permanently';
      toast.error(`You are banned from posting ${until}. Reason: ${ban.reason}`);
      setLoading(false);
      return;
    }

    // Check daily post limit
    const today = new Date().toISOString().split('T')[0];
    const limit = getDailyPostLimit(profile.reputation_score);
    const currentCount = profile.daily_post_date === today ? profile.daily_post_count : 0;

    if (currentCount >= limit) {
      toast.error(`Daily post limit reached (${limit}/day). Resets at midnight.`);
      setLoading(false);
      return;
    }

    const eventId = genId();
    let posterUrl: string | null = null;

    if (posterFile) {
      try {
        posterUrl = await uploadEventPoster(profile.id, eventId, posterFile);
      } catch {
        toast.error('Failed to upload poster. Continuing without image.');
      }
    }

    const datetime = form.date && form.time ? `${form.date}T${form.time}:00` : null;

    const { error } = await supabase.from('events').insert({
      id: eventId,
      title: form.title.trim(),
      description: form.description.trim(),
      poster_url: posterUrl,
      datetime,
      registration_fee: parseFloat(form.fee) || 0,
      registration_link: form.regLink.trim() || null,
      eligibility: form.eligibility.trim() || null,
      prize_pool: form.prizePool.trim() || null,
      tags: selectedTags,
      state: 'active',
      posted_by: profile.id,
      posted_by_name: profile.full_name,
      posted_by_role: profile.role,
      is_anonymous: isAnonymous && profile.role === 'student',
      display_name: isAnonymous && profile.role === 'student' ? 'Anonymous Student' : profile.full_name,
    });

    if (error) {
      toast.error('Failed to post event. Please try again.');
    } else {
      // Update daily count
      await supabase.from('profiles').update({
        daily_post_count: currentCount + 1,
        daily_post_date: today,
      }).eq('id', profile.id);

      toast.success('Event posted successfully! 🎉');
      onSuccess();
      onClose();
    }

    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content w-full max-w-lg" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Post New Event</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)] transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto max-h-[70vh] pr-1 scrollbar-thin">
          {/* Poster upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className={`relative w-full aspect-video rounded-xl border-2 border-dashed cursor-pointer overflow-hidden transition-colors
              ${posterPreview ? 'border-[var(--gold)]' : 'border-[var(--border)] hover:border-[var(--gold)]/50'}`}
          >
            {posterPreview ? (
              <>
                <img src={posterPreview} alt="Preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Upload size={24} className="text-white" />
                  <span className="text-white text-sm ml-2">Change image</span>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--text-secondary)]">
                <ImageIcon size={28} strokeWidth={1.5} />
                <p className="text-sm font-medium">Click or drag to upload poster</p>
                <p className="text-xs opacity-60">PNG, JPG up to 500KB (auto-compressed)</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

          {/* Title */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">
              Event Title *
            </label>
            <input type="text" value={form.title} onChange={set('title')} placeholder="e.g. HackFest 2025" className="input-field" maxLength={100} />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Description</span>
              <span className={form.description.length > 900 ? 'text-red-400' : ''}>{form.description.length}/1000</span>
            </label>
            <textarea value={form.description} onChange={set('description')} placeholder="Describe your event..." rows={3}
              className="input-field resize-none" maxLength={1000} />
          </div>

          {/* Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Date</label>
              <input type="date" value={form.date} onChange={set('date')} className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Time</label>
              <input type="time" value={form.time} onChange={set('time')} className="input-field" />
            </div>
          </div>

          {/* Fee + Reg Link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Registration Fee (₹)</label>
              <input type="number" value={form.fee} onChange={set('fee')} min="0" placeholder="0 = Free" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Reg Link</label>
              <input type="url" value={form.regLink} onChange={set('regLink')} placeholder="https://..." className="input-field" />
            </div>
          </div>

          {/* Eligibility + Prize Pool */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Eligibility</label>
              <input type="text" value={form.eligibility} onChange={set('eligibility')} placeholder="All branches, 2nd+" className="input-field" />
            </div>
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1.5 block">Prize Pool</label>
              <input type="text" value={form.prizePool} onChange={set('prizePool')} placeholder="₹50,000 cash" className="input-field" />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2">
              {TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-all
                    ${selectedTags.includes(tag)
                      ? 'border-[var(--gold)] bg-[var(--gold)] text-black'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/60'
                    }`}
                >
                  {TAG_LABELS[tag]}
                </button>
              ))}
            </div>
          </div>

          {/* Anonymous toggle (students only) */}
          {profile?.role === 'student' && (
            <div className="flex items-start gap-3 bg-[var(--surface-raised)] rounded-xl p-3.5 border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setIsAnonymous(v => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 mt-0.5
                  ${isAnonymous ? 'bg-[var(--gold)]' : 'bg-[var(--border)]'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform
                    ${isAnonymous ? 'translate-x-5' : ''}`}
                />
              </button>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">Post Anonymously</p>
                {isAnonymous && (
                  <p className="text-xs text-amber-400 mt-0.5 flex items-center gap-1">
                    <AlertCircle size={11} />
                    Other students won't see your name. Faculty can see your identity if reported.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3 text-base">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Posting...
              </span>
            ) : 'Post Event 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
