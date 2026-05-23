import { useNavigate } from 'react-router-dom';
import {
  Bell, CheckCircle2, XCircle, Flag, AlertTriangle, Ban as BanIcon,
  Unlock, UserCheck, Clock, Users, PartyPopper, CheckCheck,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNotifications } from '../hooks/useNotifications';
import type { Notification, NotificationType } from '../types';
import { ListItemSkeleton } from '../components/ui/SkeletonCard';

const TYPE_CONFIG: Record<NotificationType, { Icon: React.ElementType; color: string }> = {
  event_verified:   { Icon: CheckCircle2, color: 'text-green-400' },
  event_removed:    { Icon: XCircle,      color: 'text-red-400' },
  report_submitted: { Icon: Flag,         color: 'text-amber-400' },
  report_reviewed:  { Icon: AlertTriangle,color: 'text-amber-400' },
  ban_issued:       { Icon: BanIcon,       color: 'text-red-400' },
  ban_lifted:       { Icon: Unlock,        color: 'text-green-400' },
  faculty_approved: { Icon: UserCheck,     color: 'text-blue-400' },
  reminder_24h:     { Icon: Clock,         color: 'text-[var(--gold)]' },
  reminder_1h:      { Icon: Bell,          color: 'text-[var(--gold)]' },
  team_invite:      { Icon: Users,         color: 'text-purple-400' },
  team_joined:      { Icon: Users,         color: 'text-green-400' },
  team_request:     { Icon: Users,         color: 'text-blue-400' },
};

function NotifCard({ notif, onRead }: { notif: Notification; onRead: (id: string) => void }) {
  const navigate = useNavigate();
  const config = TYPE_CONFIG[notif.type] ?? { Icon: Bell, color: 'text-[var(--gold)]' };
  const { Icon, color } = config;

  const handleClick = () => {
    onRead(notif.id);
    const data = notif.data as Record<string, string>;
    if (data.event_id) navigate(`/events/${data.event_id}`);
    else if (data.team_id) navigate('/teams');
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border transition-all text-left hover:opacity-90
        ${notif.read
          ? 'bg-[var(--surface)] border-[var(--border)] opacity-70'
          : 'bg-[var(--surface)] border-[var(--gold)]/40 border-l-2 border-l-[var(--gold)] shadow-sm'
        }`}
    >
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-[var(--surface-raised)]`}>
        <Icon size={18} className={color} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${notif.read ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
          {notif.title}
        </p>
        <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">{notif.body}</p>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 opacity-60">
          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-[var(--gold)] shrink-0 mt-1.5" />
      )}
    </button>
  );
}

export default function NotificationsPage() {
  const { notifications, loading, markAllRead, markRead } = useNotifications();
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-5 animate-fade-in max-w-xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-[var(--text-secondary)] text-sm mt-0.5">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-[var(--gold)] text-sm font-semibold hover:opacity-80 transition-opacity"
          >
            <CheckCheck size={15} />
            Mark all read
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <ListItemSkeleton key={i} />)}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-4">
            <PartyPopper size={32} className="text-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-2">All caught up!</h3>
          <p className="text-[var(--text-secondary)] text-sm">You're all caught up! 🎉</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <NotifCard key={n.id} notif={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
