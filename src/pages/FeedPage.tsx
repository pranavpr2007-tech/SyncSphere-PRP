import { useState } from 'react';
import { Plus, RefreshCw, Calendar, Sparkles } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import EventCard from '../components/events/EventCard';
import { EventCardSkeleton } from '../components/ui/SkeletonCard';
import CreateEventModal from '../components/events/CreateEventModal';
import type { EventTag } from '../types';

const TAGS: { label: string; value: EventTag | null }[] = [
  { label: 'All', value: null },
  { label: 'Tech', value: 'tech' },
  { label: 'Cultural', value: 'cultural' },
  { label: 'Sports', value: 'sports' },
  { label: 'Academic', value: 'academic' },
  { label: 'Workshop', value: 'workshop' },
];

export default function FeedPage() {
  const [activeTag, setActiveTag] = useState<EventTag | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const { events, loading, refetch } = useEvents(activeTag);

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">
            Event Feed
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">
            Discover what's happening on campus
          </p>
        </div>
        <button
          onClick={refetch}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] transition-colors"
          aria-label="Refresh feed"
        >
          <RefreshCw size={16} strokeWidth={2} />
        </button>
      </div>

      {/* Tag filters */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin -mx-1 px-1">
        {TAGS.map(({ label, value }) => {
          const isActive = activeTag === value;
          return (
            <button
              key={label}
              onClick={() => setActiveTag(value)}
              className={`shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border
                ${isActive
                  ? 'bg-[var(--gold)] text-black border-[var(--gold)] shadow-gold'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)] hover:text-[var(--gold)] bg-transparent'
                }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Events grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mb-4">
            <Calendar size={32} className="text-[var(--gold)]" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-xl font-semibold text-[var(--text-primary)] mb-2">
            {activeTag ? `No ${activeTag} events yet` : 'No events yet'}
          </h3>
          <p className="text-[var(--text-secondary)] text-sm mb-6">
            {activeTag
              ? 'Try a different tag or be the first to post!'
              : 'Be the first to post an event! 🎉'
            }
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gold px-6 py-2.5"
          >
            <Plus size={16} /> Post Event
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
            <Sparkles size={13} className="text-[var(--gold)]" />
            <span>{events.length} event{events.length !== 1 ? 's' : ''} found</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {events.map(event => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </>
      )}

      {/* FAB */}
      <button
        onClick={() => setShowCreate(true)}
        className="fixed bottom-24 right-5 lg:bottom-8 lg:right-8 w-14 h-14 rounded-full btn-gold shadow-gold flex items-center justify-center z-30 hover:scale-110 transition-transform duration-200"
        aria-label="Create event"
      >
        <Plus size={22} strokeWidth={2.5} />
      </button>

      {/* Create event modal */}
      {showCreate && (
        <CreateEventModal onClose={() => setShowCreate(false)} onSuccess={refetch} />
      )}
    </div>
  );
}
