import { NavLink } from 'react-router-dom';
import {
  LayoutGrid, Calendar, Bell, User, MessageSquare, Users,
  ShieldCheck, UserCheck, LayoutDashboard, UserCog, Ban,
  Settings, LogOut, UsersRound,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import SyncSphereLogo from '../ui/SyncSphereLogo';
import ThemeToggle from '../ui/ThemeToggle';
import AvatarCircle from '../ui/AvatarCircle';

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const unreadCount = useUnreadCount();

  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin';
  const isAdmin = profile?.role === 'admin';

  const navItem = (
    to: string,
    Icon: React.ElementType,
    label: string,
    badge?: number
  ) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative
        ${isActive
          ? 'bg-[var(--gold)]/10 text-[var(--gold)] font-semibold'
          : 'text-[var(--text-secondary)] hover:bg-[var(--gold)]/5 hover:text-[var(--text-primary)]'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.8} />
      <span className="text-sm">{label}</span>
      {badge != null && badge > 0 && (
        <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className="h-full flex flex-col bg-[var(--surface)] border-r border-[var(--border)] px-3 py-4">
      {/* Logo */}
      <div className="px-2 mb-6">
        <SyncSphereLogo size="md" />
      </div>

      {/* Main nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto scrollbar-thin">
        {navItem('/feed', LayoutGrid, 'Event Feed')}
        {navItem('/calendar', Calendar, 'Calendar')}
        {navItem('/notifications', Bell, 'Notifications', unreadCount)}
        {navItem('/chat', MessageSquare, 'Chat')}
        {navItem('/teams', UsersRound, 'Teams')}
        {navItem('/profile', User, 'My Profile')}

        {isFacultyOrAdmin && (
          <div className="pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] px-4 mb-1">
              Moderation
            </p>
            {navItem('/moderation', ShieldCheck, 'Mod Queue')}
            {navItem('/students', Users, 'Students')}
          </div>
        )}

        {isAdmin && (
          <div className="pt-3 pb-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)] px-4 mb-1">
              Admin
            </p>
            {navItem('/admin', LayoutDashboard, 'Dashboard')}
            {navItem('/admin/faculty-approval', UserCheck, 'Faculty Approval')}
            {navItem('/admin/bans', Ban, 'All Bans')}
            {navItem('/admin/config', Settings, 'System Config')}
          </div>
        )}
      </nav>

      {/* User + theme at bottom */}
      <div className="border-t border-[var(--border)] pt-3 mt-3 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2">
          <AvatarCircle name={profile?.full_name ?? '?'} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{profile?.full_name}</p>
            <p className="text-xs text-[var(--text-secondary)] capitalize">{profile?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-2">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors flex-1"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
