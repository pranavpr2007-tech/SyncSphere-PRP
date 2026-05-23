import { NavLink } from 'react-router-dom';
import { LayoutGrid, Calendar, MessageSquare, UsersRound, MoreHorizontal, Bell, User, ShieldCheck, Users, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useUnreadCount } from '../../hooks/useNotifications';

export default function BottomNav() {
  const { profile, signOut } = useAuth();
  const unreadCount = useUnreadCount();
  const [moreOpen, setMoreOpen] = useState(false);

  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  const item = (to: string, Icon: React.ElementType, label: string, badge?: number) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200 relative
        ${isActive ? 'text-[var(--gold)]' : 'text-[var(--text-secondary)]'}`
      }
    >
      <div className="relative">
        <Icon size={22} strokeWidth={1.8} />
        {badge != null && badge > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </div>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );

  return (
    <>
      {/* More overlay */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="absolute bottom-20 left-4 right-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 shadow-2xl animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-3 px-2">
              More Options
            </p>
            <div className="space-y-1">
              <NavLink to="/profile" onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--gold)]/5 text-[var(--text-primary)] transition-colors">
                <User size={18} /> <span className="text-sm">My Profile</span>
              </NavLink>
              <NavLink to="/notifications" onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--gold)]/5 text-[var(--text-primary)] transition-colors">
                <Bell size={18} />
                <span className="text-sm">Notifications</span>
                {unreadCount > 0 && <span className="ml-auto bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>}
              </NavLink>
              {isFacultyOrAdmin && <>
                <NavLink to="/moderation" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--gold)]/5 text-[var(--text-primary)] transition-colors">
                  <ShieldCheck size={18} /> <span className="text-sm">Moderation</span>
                </NavLink>
                <NavLink to="/students" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--gold)]/5 text-[var(--text-primary)] transition-colors">
                  <Users size={18} /> <span className="text-sm">Students</span>
                </NavLink>
              </>}
              {isAdmin && (
                <NavLink to="/admin" onClick={() => setMoreOpen(false)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[var(--gold)]/5 text-[var(--text-primary)] transition-colors">
                  <LayoutDashboard size={18} /> <span className="text-sm">Admin Dashboard</span>
                </NavLink>
              )}
              <button
                onClick={signOut}
                className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors w-full text-left"
              >
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] safe-area-pb">
        <div className="flex items-center justify-around px-2 py-1 max-w-lg mx-auto">
          {item('/feed', LayoutGrid, 'Feed')}
          {item('/calendar', Calendar, 'Calendar')}
          {item('/chat', MessageSquare, 'Chat')}
          {item('/teams', UsersRound, 'Teams')}
          <button
            onClick={() => setMoreOpen(v => !v)}
            className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl text-[var(--text-secondary)] transition-colors"
          >
            <MoreHorizontal size={22} strokeWidth={1.8} />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}
