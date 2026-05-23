import { useState, useEffect, useCallback } from 'react';
import { UserCheck, Check, X, Mail, Hash, BookOpen, Calendar, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import type { Profile } from '../../types';
import AvatarCircle from '../../components/ui/AvatarCircle';

export default function FacultyApprovalPage() {
  const [applicants, setApplicants] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'faculty_pending')
      .order('created_at', { ascending: true });
    setApplicants((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const handleApprove = async (applicant: Profile) => {
    setActionId(applicant.id);
    await supabase.from('profiles').update({ role: 'faculty' }).eq('id', applicant.id);
    await supabase.from('notifications').insert({
      user_id: applicant.id,
      type: 'faculty_approved',
      title: 'Faculty Application Approved! 🎉',
      body: 'Congratulations! Your faculty application has been approved. You can now access faculty features.',
      data: {},
    });
    toast.success(`${applicant.full_name} approved as faculty!`);
    setActionId(null);
    fetch();
  };

  const handleReject = async (applicant: Profile) => {
    if (!confirm(`Reject application from ${applicant.full_name}? This will delete their account.`)) return;
    setActionId(applicant.id);
    // Delete the profile and auth user (service role required for auth deletion)
    await supabase.from('profiles').delete().eq('id', applicant.id);
    toast.success(`${applicant.full_name}'s application rejected.`);
    setActionId(null);
    fetch();
  };

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
          <UserCheck size={20} className="text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Faculty Approvals</h1>
          <p className="text-[var(--text-secondary)] text-sm">{applicants.length} pending application{applicants.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}
        </div>
      ) : applicants.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
            <UserCheck size={28} className="text-green-400" />
          </div>
          <h3 className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-1">No pending applications</h3>
          <p className="text-[var(--text-secondary)] text-sm">All faculty applications have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {applicants.map(applicant => (
            <div key={applicant.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5">
              <div className="flex items-start gap-4 mb-4">
                <AvatarCircle name={applicant.full_name} size="lg" />
                <div className="flex-1 min-w-0">
                  <h3 className="font-serif font-bold text-[var(--text-primary)] text-lg">{applicant.full_name}</h3>
                  <div className="mt-2 space-y-1.5">
                    {[
                      { icon: Mail, text: applicant.email },
                      { icon: BookOpen, text: `Department: ${applicant.branch}` },
                      { icon: Hash, text: `Employee ID: ${applicant.usn || '—'}` },
                      { icon: Calendar, text: `Applied: ${format(new Date(applicant.created_at), 'd MMM yyyy, h:mm a')}` },
                    ].map(({ icon: Icon, text }) => (
                      <div key={text} className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
                        <Icon size={13} className="text-[var(--gold)] shrink-0" />
                        <span>{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => handleApprove(applicant)}
                  disabled={actionId === applicant.id}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 font-semibold text-sm hover:bg-green-500/20 transition-colors disabled:opacity-40"
                >
                  <Check size={16} /> Approve
                </button>
                <button
                  onClick={() => handleReject(applicant)}
                  disabled={actionId === applicant.id}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 transition-colors disabled:opacity-40"
                >
                  <X size={16} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
