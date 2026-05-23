import { Link, useNavigate } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useUnreadCount } from '../../hooks/useNotifications';
import SyncSphereLogo from '../ui/SyncSphereLogo';
import ThemeToggle from '../ui/ThemeToggle';
import AvatarCircle from '../ui/AvatarCircle';

export default function TopBar() {
  const { profile } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const unreadCount = useUnreadCount();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-40 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-md bg-opacity-90">
      <div className="flex items-center justify-between px-4 py-3 max-w-5xl mx-auto lg:max-w-none">
        {/* Left: Logo (mobile only) */}
        <div className="lg:hidden">
          <SyncSphereLogo size="sm" />
        </div>

        {/* Center title (mobile) / Empty (desktop) */}
        <div className="hidden lg:block" />

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle isDark={isDark} onToggle={toggleTheme} />

          <button
            onClick={() => navigate('/notifications')}
            className="relative w-10 h-10 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] transition-colors"
            aria-label="Notifications"
          >
            <Bell size={20} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <AvatarCircle name={profile?.full_name ?? '?'} size="sm" />
          </Link>
        </div>
      </div>
    </header>
  );
}
