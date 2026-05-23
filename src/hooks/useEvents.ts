import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Event, EventTag } from '../types';

export function useEvents(tagFilter?: EventTag | null) {
  const { profile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });

    // Role-based visibility
    const isFacultyOrAdmin = profile?.role === 'faculty' || profile?.role === 'admin';
    if (!isFacultyOrAdmin) {
      query = query.in('state', ['active', 'verified']);
    } else {
      query = query.in('state', ['active', 'verified', 'auto_hidden']);
    }

    if (tagFilter) {
      query = query.contains('tags', [tagFilter]);
    }

    const { data } = await query.limit(100);
    setEvents((data ?? []) as Event[]);
    setLoading(false);
  }, [profile, tagFilter]);

  useEffect(() => { fetch(); }, [fetch]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('events_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, () => {
        fetch();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetch]);

  return { events, loading, refetch: fetch };
}

export function useEvent(id: string) {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setEvent(data as Event | null);
        setLoading(false);
      });
  }, [id]);

  return { event, loading };
}

export function useReminder(eventId: string) {
  const { profile } = useAuth();
  const [hasReminder, setHasReminder] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('reminders')
      .select('id')
      .eq('user_id', profile.id)
      .eq('event_id', eventId)
      .maybeSingle()
      .then(({ data }) => setHasReminder(!!data));
  }, [profile, eventId]);

  const toggle = async (event: Event) => {
    if (!profile) return;
    setLoading(true);
    if (hasReminder) {
      await supabase
        .from('reminders')
        .delete()
        .eq('user_id', profile.id)
        .eq('event_id', eventId);
      setHasReminder(false);
    } else {
      await supabase.from('reminders').insert({
        user_id: profile.id,
        event_id: eventId,
        event_title: event.title,
        event_datetime: event.datetime,
      });
      setHasReminder(true);
    }
    setLoading(false);
  };

  return { hasReminder, toggle, loading };
}
