import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Send, MessageSquare, Hash, Users, ArrowLeft, Plus, X,
  MoreVertical, Smile, Image as ImageIcon,
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ChatRoom, ChatMessage } from '../types';
import AvatarCircle from '../components/ui/AvatarCircle';

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useChatRooms() {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('chat_rooms')
      .select('*')
      .order('created_at', { ascending: false });
    setRooms((data ?? []) as ChatRoom[]);
    setLoading(false);
  }, [profile]);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!profile) return;
    const ch = supabase.channel('chat_rooms_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, fetch)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [profile, fetch]);

  return { rooms, loading, refetch: fetch };
}

function useChatMessages(roomId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) { setMessages([]); setLoading(false); return; }
    setLoading(true);
    supabase
      .from('chat_messages')
      .select('*')
      .eq('room_id', roomId)
      .eq('deleted', false)
      .order('created_at', { ascending: true })
      .limit(200)
      .then(({ data }) => {
        setMessages((data ?? []) as ChatMessage[]);
        setLoading(false);
      });
  }, [roomId]);

  useEffect(() => {
    if (!roomId) return;
    const ch = supabase.channel(`messages:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [roomId]);

  return { messages, loading };
}

// ─── Format date separator ────────────────────────────────────────────────────
function formatDaySeparator(date: Date): string {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return format(date, 'MMMM d, yyyy');
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isOwn }: { msg: ChatMessage; isOwn: boolean }) {
  return (
    <div className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isOwn && <AvatarCircle name={msg.sender_name} size="xs" />}
      <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[75%]`}>
        {!isOwn && (
          <p className="text-[10px] font-semibold text-[var(--text-secondary)] mb-1 px-1">
            {msg.sender_name}
            {msg.sender_role !== 'student' && (
              <span className="ml-1 text-[var(--gold)] opacity-80">{msg.sender_role}</span>
            )}
          </p>
        )}
        <div className={isOwn ? 'chat-bubble-own' : 'chat-bubble-other'}>
          <p className="text-sm leading-relaxed break-words">{msg.content}</p>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 px-1 opacity-60">
          {format(new Date(msg.created_at), 'h:mm a')}
        </p>
      </div>
    </div>
  );
}

// ─── Create Room Modal ────────────────────────────────────────────────────────
function CreateRoomModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!profile || !name.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.from('chat_rooms').insert({
      name: name.trim(),
      description: description.trim(),
      type: 'general',
      created_by: profile.id,
    }).select().single();

    if (!error && data) {
      // Join the room
      await supabase.from('chat_members').insert({
        room_id: data.id,
        user_id: profile.id,
        user_name: profile.full_name,
        role: 'admin',
      });
      // System message
      await supabase.from('chat_messages').insert({
        room_id: data.id,
        sender_id: profile.id,
        sender_name: 'System',
        sender_role: 'student',
        content: `${profile.full_name} created this room`,
        message_type: 'system',
        edited: false,
        deleted: false,
      });
      toast.success(`Room "${name}" created!`);
      onCreated();
      onClose();
    } else {
      toast.error('Failed to create room');
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">New Chat Room</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">Room Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. HackFest 2025 Discussion" className="input-field" maxLength={60} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">Description</label>
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="What's this room about?" className="input-field" maxLength={120} />
          </div>
          <button onClick={handleCreate} disabled={!name.trim() || loading} className="btn-gold w-full py-3 disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Room Chat View ───────────────────────────────────────────────────────────
function RoomView({ roomId, room, onBack }: { roomId: string; room: ChatRoom; onBack: () => void }) {
  const { profile } = useAuth();
  const { messages, loading } = useChatMessages(roomId);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const RATE_LIMIT_MS = 3000;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!profile || !text.trim()) return;
    const now = Date.now();
    if (now - lastSent < RATE_LIMIT_MS) {
      toast.error(`Please wait ${Math.ceil((RATE_LIMIT_MS - (now - lastSent)) / 1000)}s before sending again`);
      return;
    }
    setSending(true);
    const content = text.trim();
    setText('');
    setLastSent(now);

    const { error } = await supabase.from('chat_messages').insert({
      room_id: roomId,
      sender_id: profile.id,
      sender_name: profile.full_name,
      sender_role: profile.role,
      content,
      message_type: 'text',
      edited: false,
      deleted: false,
    });

    if (error) {
      toast.error('Failed to send message');
      setText(content);
    }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  // Group messages by date
  type DateGroup = { date: string; messages: ChatMessage[] };
  const grouped: DateGroup[] = [];
  messages.forEach(msg => {
    const d = format(new Date(msg.created_at), 'yyyy-MM-dd');
    const last = grouped[grouped.length - 1];
    if (last?.date === d) { last.messages.push(msg); }
    else { grouped.push({ date: d, messages: [msg] }); }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-10rem)] lg:h-[calc(100vh-8rem)]">
      {/* Room header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
        <button onClick={onBack} className="w-8 h-8 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--gold)] lg:hidden">
          <ArrowLeft size={18} />
        </button>
        <div className="w-9 h-9 rounded-xl bg-[var(--gold)]/15 flex items-center justify-center">
          <Hash size={18} className="text-[var(--gold)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{room.name}</p>
          {room.description && <p className="text-xs text-[var(--text-secondary)] truncate">{room.description}</p>}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-[var(--border)] border-t-[var(--gold)] rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <MessageSquare size={32} strokeWidth={1} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No messages yet. Say hello! 👋</p>
          </div>
        ) : (
          <>
            {grouped.map(({ date, messages: msgs }) => (
              <div key={date} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                    {formatDaySeparator(new Date(date))}
                  </span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>
                {msgs.map(msg => {
                  if (msg.message_type === 'system') {
                    return (
                      <p key={msg.id} className="text-center text-xs text-[var(--text-secondary)] opacity-50 italic">
                        {msg.content}
                      </p>
                    );
                  }
                  return (
                    <MessageBubble key={msg.id} msg={msg} isOwn={msg.sender_id === profile?.id} />
                  );
                })}
              </div>
            ))}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 border-t border-[var(--border)]">
        <div className="flex items-end gap-2 bg-[var(--surface-raised)] rounded-2xl border border-[var(--border)] px-3 py-2.5">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] max-h-32 scrollbar-thin"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={sendMessage}
            disabled={!text.trim() || sending}
            className="w-8 h-8 rounded-xl flex items-center justify-center bg-[var(--gold)] text-black disabled:opacity-40 transition-opacity hover:opacity-90"
          >
            <Send size={15} strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 text-center opacity-50">
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

// ─── Main ChatPage ────────────────────────────────────────────────────────────
export default function ChatPage() {
  const { roomId } = useParams<{ roomId?: string }>();
  const navigate = useNavigate();
  const { rooms, loading, refetch } = useChatRooms();
  const [showCreate, setShowCreate] = useState(false);

  const activeRoom = rooms.find(r => r.id === roomId);

  const handleSelectRoom = (id: string) => navigate(`/chat/${id}`);
  const handleBack = () => navigate('/chat');

  return (
    <div className="animate-fade-in">
      {/* Desktop: two-panel layout */}
      <div className="hidden lg:flex gap-5 h-[calc(100vh-8rem)]">
        {/* Rooms sidebar */}
        <div className="w-72 shrink-0 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h1 className="font-serif text-xl font-bold text-[var(--text-primary)]">Messages</h1>
            <button onClick={() => setShowCreate(true)} className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center hover:bg-[var(--gold)]/20 transition-colors">
              <Plus size={18} />
            </button>
          </div>
          <RoomList rooms={rooms} loading={loading} activeId={roomId} onSelect={handleSelectRoom} />
        </div>

        {/* Chat area */}
        <div className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
          {activeRoom ? (
            <RoomView roomId={activeRoom.id} room={activeRoom} onBack={handleBack} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <MessageSquare size={48} strokeWidth={1} className="text-[var(--text-secondary)] mb-3 opacity-30" />
              <p className="text-[var(--text-secondary)]">Select a room to start chatting</p>
            </div>
          )}
        </div>
      </div>

      {/* Mobile: single view */}
      <div className="lg:hidden">
        {roomId && activeRoom ? (
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4">
            <RoomView roomId={activeRoom.id} room={activeRoom} onBack={handleBack} />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Messages</h1>
              <button onClick={() => setShowCreate(true)} className="w-9 h-9 rounded-xl bg-[var(--gold)]/10 text-[var(--gold)] flex items-center justify-center hover:bg-[var(--gold)]/20 transition-colors">
                <Plus size={18} />
              </button>
            </div>
            <RoomList rooms={rooms} loading={loading} activeId={roomId} onSelect={handleSelectRoom} />
          </div>
        )}
      </div>

      {showCreate && <CreateRoomModal onClose={() => setShowCreate(false)} onCreated={refetch} />}
    </div>
  );
}

function RoomList({ rooms, loading, activeId, onSelect }: {
  rooms: ChatRoom[]; loading: boolean; activeId?: string; onSelect: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="skeleton h-16 rounded-xl" />
        ))}
      </div>
    );
  }

  if (rooms.length === 0) {
    return (
      <div className="text-center py-8 text-[var(--text-secondary)]">
        <Hash size={24} className="mx-auto mb-2 opacity-30" />
        <p className="text-sm">No chat rooms yet</p>
        <p className="text-xs mt-1 opacity-60">Create one to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 overflow-y-auto scrollbar-thin">
      {rooms.map(room => (
        <button
          key={room.id}
          onClick={() => onSelect(room.id)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors
            ${activeId === room.id
              ? 'bg-[var(--gold)]/10 text-[var(--gold)]'
              : 'hover:bg-[var(--gold)]/5 text-[var(--text-primary)]'
            }`}
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0
            ${activeId === room.id ? 'bg-[var(--gold)]/20' : 'bg-[var(--surface-raised)]'}`}>
            {room.type === 'team' ? <Users size={16} className="text-[var(--gold)]" /> : <Hash size={16} className="text-[var(--gold)]" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{room.name}</p>
            {room.description && <p className="text-xs text-[var(--text-secondary)] truncate opacity-70">{room.description}</p>}
          </div>
        </button>
      ))}
    </div>
  );
}
