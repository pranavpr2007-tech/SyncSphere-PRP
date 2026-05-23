import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { CheckCircle2, AlertTriangle, EyeOff, Calendar, Trophy, IndianRupee, ImageOff } from 'lucide-react';
import type { Event } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import TagChip from './TagChip';

interface Props {
  event: Event;
}

export default function EventCard({ event }: Props) {
  const { profile } = useAuth();
  const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin';
  const [imgError, setImgError] = useState(false);

  const formattedDate = event.datetime
    ? format(new Date(event.datetime), 'EEE, d MMM yyyy · h:mm a')
    : null;

  return (
    <Link
      to={`/events/${event.id}`}
      className="card block overflow-hidden hover:no-underline group"
    >
      {/* Poster image */}
      <div className="relative w-full aspect-video bg-[var(--surface-raised)] overflow-hidden">
        {event.poster_url && !imgError ? (
          <img
            src={event.poster_url}
            alt={event.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-[var(--text-secondary)] gap-2">
            <ImageOff size={32} strokeWidth={1} opacity={0.4} />
            <span className="text-xs opacity-50">No poster</span>
          </div>
        )}

        {/* State badges */}
        {event.state === 'verified' && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-green-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
            <CheckCircle2 size={12} />
            Verified
          </div>
        )}
        {event.state === 'auto_hidden' && isFacultyOrAdmin && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-red-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
            <EyeOff size={12} />
            Hidden
          </div>
        )}
        {event.report_count > 0 && profile?.role === 'student' && event.state !== 'auto_hidden' && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 bg-amber-500 text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-lg">
            <AlertTriangle size={12} />
            {event.report_count} Report{event.report_count > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-serif font-bold text-[var(--text-primary)] text-base leading-snug line-clamp-2 mb-1.5">
          {event.title}
        </h3>

        {/* Posted by */}
        <p className="text-[var(--text-secondary)] text-xs mb-2.5">
          by <span className="font-medium text-[var(--text-primary)]">{event.display_name}</span>
          {event.posted_by_role !== 'student' && (
            <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-[var(--gold)]/15 text-[var(--gold)] px-1.5 py-0.5 rounded-full font-semibold">
              {event.posted_by_role === 'faculty' ? 'Faculty' : 'Admin'}
            </span>
          )}
        </p>

        {/* Date */}
        {formattedDate && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] mb-2.5">
            <Calendar size={12} />
            <span>{formattedDate}</span>
          </div>
        )}

        {/* Prize & Fee row */}
        <div className="flex items-center gap-3 mb-3 text-xs">
          {event.registration_fee === 0 ? (
            <span className="text-green-400 font-semibold flex items-center gap-1">
              <IndianRupee size={11} /> Free Entry
            </span>
          ) : (
            <span className="text-[var(--text-secondary)] flex items-center gap-1">
              <IndianRupee size={11} /> {event.registration_fee}
            </span>
          )}
          {event.prize_pool && (
            <span className="text-amber-400 flex items-center gap-1 font-medium">
              <Trophy size={11} /> {event.prize_pool}
            </span>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5">
          {event.tags.map(tag => (
            <TagChip key={tag} tag={tag} />
          ))}
        </div>
      </div>
    </Link>
  );
}

// Must import useState for imgError
import { useState } from 'react';
