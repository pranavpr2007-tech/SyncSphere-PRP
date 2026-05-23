import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isSameMonth, isToday, startOfWeek, endOfWeek, addMonths, subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Zap, Bell } from 'lucide-react';
import { useEvents } from '../hooks/useEvents';
import { useReminder } from '../hooks/useEvents';
import type { Event, EventTag } from '../types';

const TAG_COLORS: Record<EventTag, string> = {
  tech: '#3B82F6',
  cultural: '#A855F7',
  sports: '#22C55E',
  academic: '#F97316',
  workshop: '#EAB308',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(new Date());
  const { events, loading } = useEvents();

  // Build a map of date -> events
  const eventsByDate = useMemo(() => {
    const map = new Map<string, Event[]>();
    events.forEach(ev => {
      if (!ev.datetime) return;
      const key = format(new Date(ev.datetime), 'yyyy-MM-dd');
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    });
    return map;
  }, [events]);

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const selectedEvents = useMemo(() => {
    if (!selectedDay) return [];
    return eventsByDate.get(format(selectedDay, 'yyyy-MM-dd')) ?? [];
  }, [selectedDay, eventsByDate]);

  // Detect conflicts (events on same day within 2h of each other)
  const hasConflict = (dayEvents: Event[]): boolean => {
    if (dayEvents.length < 2) return false;
    const times = dayEvents
      .filter(e => e.datetime)
      .map(e => new Date(e.datetime!).getTime())
      .sort((a, b) => a - b);
    for (let i = 1; i < times.length; i++) {
      if (times[i] - times[i - 1] < 2 * 60 * 60 * 1000) return true;
    }
    return false;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Calendar</h1>
        <div className="flex items-center gap-1">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-[var(--text-primary)] min-w-[130px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--gold)]/10 hover:text-[var(--gold)] transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--border)]">
          {WEEKDAYS.map(d => (
            <div key={d} className="text-center py-2.5 text-xs font-semibold text-[var(--text-secondary)]">
              {d}
            </div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const key = format(day, 'yyyy-MM-dd');
            const dayEvents = eventsByDate.get(key) ?? [];
            const inMonth = isSameMonth(day, currentMonth);
            const selected = selectedDay && isSameDay(day, selectedDay);
            const today = isToday(day);
            const conflict = hasConflict(dayEvents);

            // Get up to 3 unique tag colors
            const dots = [...new Set(dayEvents.flatMap(e => e.tags))].slice(0, 3);
            const extraDots = dayEvents.length > 3 ? dayEvents.length - 3 : 0;

            return (
              <button
                key={i}
                onClick={() => setSelectedDay(day)}
                className={`relative flex flex-col items-center py-2.5 px-1 min-h-[64px] border-b border-r border-[var(--border)] last:border-r-0 transition-colors
                  ${!inMonth ? 'opacity-30' : ''}
                  ${selected ? 'bg-[var(--gold)]/10' : 'hover:bg-[var(--gold)]/5'}
                `}
              >
                {/* Day number */}
                <span className={`text-sm font-medium w-7 h-7 rounded-full flex items-center justify-center
                  ${today ? 'bg-[var(--gold)] text-black font-bold' : selected ? 'text-[var(--gold)] font-bold' : 'text-[var(--text-primary)]'}`}
                >
                  {format(day, 'd')}
                </span>

                {/* Conflict indicator */}
                {conflict && (
                  <Zap size={9} className="text-orange-400 absolute top-1 right-1" />
                )}

                {/* Event dots */}
                {dots.length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {dots.map((tag, di) => (
                      <span
                        key={di}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: TAG_COLORS[tag] }}
                      />
                    ))}
                    {extraDots > 0 && (
                      <span className="text-[8px] text-[var(--text-secondary)] font-bold">+{extraDots}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day events */}
      {selectedDay && (
        <div className="space-y-3 animate-slide-down">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold text-[var(--text-primary)]">
              {format(selectedDay, 'EEEE, d MMMM yyyy')}
            </h2>
            <span className="text-xs text-[var(--text-secondary)] bg-[var(--surface)] border border-[var(--border)] rounded-full px-3 py-1">
              {selectedEvents.length} event{selectedEvents.length !== 1 ? 's' : ''}
            </span>
          </div>

          {loading ? (
            <div className="skeleton h-20 rounded-xl" />
          ) : selectedEvents.length === 0 ? (
            <div className="text-center py-8 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
              <p className="text-[var(--text-secondary)] text-sm">No events scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedEvents.map((ev, i) => (
                <DayEventRow key={ev.id} event={ev} showConflict={i > 0 && selectedEvents.length > 1} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DayEventRow({ event, showConflict }: { event: Event; showConflict: boolean }) {
  const { hasReminder, toggle } = useReminder(event.id);

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3.5 space-y-2">
      {showConflict && (
        <div className="flex items-center gap-1.5 text-orange-400 text-xs font-medium">
          <Zap size={12} /> Time conflict with previous event
        </div>
      )}
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {event.datetime && (
              <span className="text-xs text-[var(--text-secondary)] font-medium">
                {format(new Date(event.datetime), 'h:mm a')}
              </span>
            )}
            {event.tags.slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] font-bold" style={{ color: TAG_COLORS[tag] }}>
                {tag}
              </span>
            ))}
          </div>
          <Link
            to={`/events/${event.id}`}
            className="font-semibold text-[var(--text-primary)] text-sm hover:text-[var(--gold)] transition-colors line-clamp-1"
          >
            {event.title}
          </Link>
        </div>
        <button
          onClick={() => toggle(event)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0
            ${hasReminder ? 'text-[var(--gold)] bg-[var(--gold)]/10' : 'text-[var(--text-secondary)] hover:text-[var(--gold)] hover:bg-[var(--gold)]/5'}`}
          aria-label={hasReminder ? 'Remove reminder' : 'Set reminder'}
        >
          <Bell size={15} fill={hasReminder ? 'currentColor' : 'none'} />
        </button>
      </div>
    </div>
  );
}
