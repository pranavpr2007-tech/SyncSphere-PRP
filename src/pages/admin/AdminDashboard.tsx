import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard, Calendar, Flag, Ban, Users, UserCheck,
  EyeOff, ChevronRight, TrendingUp,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Stats {
  activeEventsToday: number;
  openReportsWeek: number;
  activeBans: number;
  totalStudents: number;
  pendingFaculty: number;
  anonymousPostsToday: number;
}

function StatCard({ icon: Icon, label, value, color, to }: {
  icon: React.ElementType; label: string; value: number; color: string; to?: string;
}) {
  const content = (
    <div className={`bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-5 hover:border-[var(--gold)]/40 transition-all group`}>
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon size={20} className="text-current" />
      </div>
      <p className="text-3xl font-bold font-serif text-[var(--text-primary)] mb-1">{value.toLocaleString()}</p>
      <p className="text-xs text-[var(--text-secondary)]">{label}</p>
      {to && <ChevronRight size={14} className="text-[var(--gold)] mt-2 opacity-0 group-hover:opacity-100 transition-opacity" />}
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeEventsToday: 0, openReportsWeek: 0, activeBans: 0,
    totalStudents: 0, pendingFaculty: 0, anonymousPostsToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { count: activeEvents },
        { count: openReports },
        { count: activeBans },
        { count: totalStudents },
        { count: pendingFaculty },
        { count: anonToday },
      ] = await Promise.all([
        supabase.from('events').select('*', { count: 'exact', head: true })
          .in('state', ['active', 'verified'])
          .gte('created_at', today),
        supabase.from('reports').select('*', { count: 'exact', head: true })
          .is('review_result', null)
          .gte('created_at', weekAgo),
        supabase.from('bans').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'faculty_pending'),
        supabase.from('events').select('*', { count: 'exact', head: true })
          .eq('is_anonymous', true)
          .gte('created_at', today),
      ]);

      setStats({
        activeEventsToday: activeEvents ?? 0,
        openReportsWeek: openReports ?? 0,
        activeBans: activeBans ?? 0,
        totalStudents: totalStudents ?? 0,
        pendingFaculty: pendingFaculty ?? 0,
        anonymousPostsToday: anonToday ?? 0,
      });
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
          <LayoutDashboard size={20} className="text-[var(--gold)]" />
        </div>
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Admin Dashboard</h1>
          <p className="text-[var(--text-secondary)] text-sm">System overview</p>
        </div>
      </div>

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard icon={Calendar} label="Events today" value={stats.activeEventsToday} color="bg-blue-500/15 text-blue-400" />
          <StatCard icon={Flag} label="Open reports this week" value={stats.openReportsWeek} color="bg-red-500/15 text-red-400" to="/moderation" />
          <StatCard icon={Ban} label="Active bans" value={stats.activeBans} color="bg-orange-500/15 text-orange-400" to="/admin/bans" />
          <StatCard icon={Users} label="Total students" value={stats.totalStudents} color="bg-green-500/15 text-green-400" to="/students" />
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <h2 className="font-serif font-bold text-[var(--text-primary)]">Quick Actions</h2>

        <div className="space-y-2">
          <Link to="/admin/faculty-approval"
            className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)]/40 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 flex items-center justify-center">
                <UserCheck size={18} className="text-[var(--gold)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">Faculty Approvals</p>
                <p className="text-xs text-[var(--text-secondary)]">Review pending applications</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {stats.pendingFaculty > 0 && (
                <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.pendingFaculty}
                </span>
              )}
              <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--gold)]" />
            </div>
          </Link>

          <Link to="/admin/bans"
            className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)]/40 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Ban size={18} className="text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">All Bans History</p>
                <p className="text-xs text-[var(--text-secondary)]">View and manage all bans</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--gold)]" />
          </Link>

          <Link to="/admin/config"
            className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl hover:border-[var(--gold)]/40 transition-all group">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <TrendingUp size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">System Configuration</p>
                <p className="text-xs text-[var(--text-secondary)]">Thresholds, limits, settings</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-secondary)] group-hover:text-[var(--gold)]" />
          </Link>

          <div className="flex items-center justify-between p-4 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gray-500/10 flex items-center justify-center">
                <EyeOff size={18} className="text-[var(--text-secondary)]" />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-sm">Anonymous posts today</p>
                <p className="text-xs text-[var(--text-secondary)]">Posted without real name shown</p>
              </div>
            </div>
            <span className="font-bold text-[var(--text-primary)]">{stats.anonymousPostsToday}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
