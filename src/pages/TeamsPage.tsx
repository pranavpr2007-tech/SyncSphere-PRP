import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Plus, X, UserPlus, Check, ChevronRight, Crown,
  Zap, Target, Search, Filter, MessageSquare,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { Team, TeamMember, TeamRequest } from '../types';
import AvatarCircle from '../components/ui/AvatarCircle';

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('teams')
      .select('*, members:team_members(*)')
      .in('status', ['recruiting', 'full'])
      .order('created_at', { ascending: false });
    setTeams((data ?? []) as Team[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);
  return { teams, loading, refetch: fetch };
}

// ─── Create Team Modal ────────────────────────────────────────────────────────
function CreateTeamModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { profile } = useAuth();
  const [form, setForm] = useState({
    name: '', description: '', maxMembers: '4', eventTitle: '', skills: '',
  });
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!profile || !form.name.trim()) return;
    setLoading(true);

    const skills = form.skills.split(',').map(s => s.trim()).filter(Boolean);

    // Create team chat room first
    const { data: roomData } = await supabase.from('chat_rooms').insert({
      name: `${form.name} · Team Chat`,
      description: `Private chat for team ${form.name}`,
      type: 'team',
      created_by: profile.id,
    }).select().single();

    const { data: team, error } = await supabase.from('teams').insert({
      name: form.name.trim(),
      description: form.description.trim(),
      event_title: form.eventTitle.trim() || null,
      required_skills: skills,
      max_members: parseInt(form.maxMembers) || 4,
      current_members: 1,
      status: 'recruiting',
      created_by: profile.id,
      created_by_name: profile.full_name,
      chat_room_id: roomData?.id ?? null,
    }).select().single();

    if (!error && team) {
      // Add creator as leader
      await supabase.from('team_members').insert({
        team_id: team.id,
        user_id: profile.id,
        user_name: profile.full_name,
        user_branch: profile.branch,
        user_year: profile.year,
        role: 'leader',
      });

      // Join the team chat room
      if (roomData) {
        await supabase.from('chat_members').insert({
          room_id: roomData.id,
          user_id: profile.id,
          user_name: profile.full_name,
          role: 'admin',
        });
        // System msg
        await supabase.from('chat_messages').insert({
          room_id: roomData.id,
          sender_id: profile.id,
          sender_name: 'System',
          sender_role: 'student',
          content: `${profile.full_name} created the team "${form.name}"`,
          message_type: 'system',
          edited: false,
          deleted: false,
        });
      }

      toast.success(`Team "${form.name}" created! 🎉`);
      onCreated();
      onClose();
    } else {
      toast.error('Failed to create team');
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl font-bold text-[var(--text-primary)]">Create Team</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-[var(--gold)]/10 text-[var(--text-secondary)]">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-3.5">
          {[
            { label: 'Team Name *', key: 'name', placeholder: 'e.g. Code Warriors' },
            { label: 'For Event', key: 'eventTitle', placeholder: 'e.g. HackFest 2025 (optional)' },
            { label: 'Description', key: 'description', placeholder: 'What are you building?' },
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">{label}</label>
              <input
                type="text"
                value={(form as Record<string, string>)[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder}
                className="input-field"
              />
            </div>
          ))}

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
              Required Skills (comma-separated)
            </label>
            <input
              type="text"
              value={form.skills}
              onChange={e => setForm(f => ({ ...f, skills: e.target.value }))}
              placeholder="React, ML, Backend, UI/UX..."
              className="input-field"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5 block">
              Max Members
            </label>
            <div className="flex gap-2">
              {[2, 3, 4, 5, 6].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, maxMembers: String(n) }))}
                  className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all
                    ${form.maxMembers === String(n)
                      ? 'border-[var(--gold)] bg-[var(--gold)] text-black'
                      : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/50'
                    }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleCreate}
            disabled={!form.name.trim() || loading}
            className="btn-gold w-full py-3 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Team 🚀'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────
function TeamCard({ team, onRefetch }: { team: Team; onRefetch: () => void }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [requesting, setRequesting] = useState(false);
  const [hasRequested, setHasRequested] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const members = team.members ?? [];
    setIsMember(members.some(m => m.user_id === profile.id));
    supabase
      .from('team_requests')
      .select('id')
      .eq('team_id', team.id)
      .eq('user_id', profile.id)
      .eq('status', 'pending')
      .maybeSingle()
      .then(({ data }) => setHasRequested(!!data));
  }, [profile, team]);

  const handleRequest = async () => {
    if (!profile) return;
    setRequesting(true);
    const { error } = await supabase.from('team_requests').insert({
      team_id: team.id,
      team_name: team.name,
      user_id: profile.id,
      user_name: profile.full_name,
      user_branch: profile.branch,
      message: `Hi! I'd love to join ${team.name}. I'm a ${profile.year}${['st','nd','rd','th'][Math.min(profile.year-1,3)]} year ${profile.branch} student.`,
      status: 'pending',
    });

    if (!error) {
      // Notify team leader
      await supabase.from('notifications').insert({
        user_id: team.created_by,
        type: 'team_request',
        title: 'New Team Join Request',
        body: `${profile.full_name} wants to join "${team.name}"`,
        data: { team_id: team.id },
      });
      setHasRequested(true);
      toast.success('Request sent!');
    } else {
      toast.error('Failed to send request');
    }
    setRequesting(false);
  };

  const isFull = team.current_members >= team.max_members;
  const isLeader = team.created_by === profile?.id;

  return (
    <div className="card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h3 className="font-serif font-bold text-[var(--text-primary)] text-base truncate">{team.name}</h3>
            {isLeader && <Crown size={14} className="text-[var(--gold)] shrink-0" />}
          </div>
          {team.event_title && (
            <p className="text-xs text-[var(--gold)] font-medium">For: {team.event_title}</p>
          )}
        </div>
        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0
          ${isFull ? 'bg-red-500/15 text-red-400' : 'bg-green-500/15 text-green-400'}`}>
          {isFull ? 'Full' : 'Open'}
        </span>
      </div>

      {team.description && (
        <p className="text-sm text-[var(--text-secondary)] line-clamp-2">{team.description}</p>
      )}

      {/* Skills */}
      {team.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {team.required_skills.map(skill => (
            <span key={skill} className="text-xs bg-[var(--surface-raised)] text-[var(--text-secondary)] border border-[var(--border)] px-2.5 py-1 rounded-full">
              {skill}
            </span>
          ))}
        </div>
      )}

      {/* Members */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Members</p>
          <span className="text-xs text-[var(--text-secondary)]">{team.current_members}/{team.max_members}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(team.members ?? []).slice(0, 5).map(m => (
            <div key={m.id} className="relative" title={m.user_name}>
              <AvatarCircle name={m.user_name} size="sm" />
              {m.role === 'leader' && (
                <Crown size={8} className="absolute -top-0.5 -right-0.5 text-[var(--gold)]" />
              )}
            </div>
          ))}
          {team.current_members > 5 && (
            <span className="text-xs text-[var(--text-secondary)] ml-1">+{team.current_members - 5}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-[var(--surface-raised)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-[var(--gold)] transition-all"
          style={{ width: `${(team.current_members / team.max_members) * 100}%` }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        {isMember ? (
          <>
            <button
              onClick={() => team.chat_room_id && navigate(`/chat/${team.chat_room_id}`)}
              disabled={!team.chat_room_id}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--gold)] text-[var(--gold)] text-sm font-semibold hover:bg-[var(--gold)]/10 transition-colors"
            >
              <MessageSquare size={15} /> Team Chat
            </button>
          </>
        ) : hasRequested ? (
          <div className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full border border-[var(--border)] text-[var(--text-secondary)] text-sm font-semibold">
            <Check size={15} className="text-green-400" /> Request Sent
          </div>
        ) : (
          <button
            onClick={handleRequest}
            disabled={isFull || requesting}
            className="btn-gold flex-1 py-2.5 text-sm disabled:opacity-50"
          >
            {requesting ? '...' : (
              <><UserPlus size={15} /> Request to Join</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Team Requests Panel ──────────────────────────────────────────────────────
function TeamRequestsPanel({ teamId, teamName }: { teamId: string; teamName: string }) {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<TeamRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    const { data } = await supabase
      .from('team_requests')
      .select('*')
      .eq('team_id', teamId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setRequests((data ?? []) as TeamRequest[]);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = async (req: TeamRequest) => {
    // Add member to team
    await supabase.from('team_members').insert({
      team_id: req.team_id,
      user_id: req.user_id,
      user_name: req.user_name,
      user_branch: req.user_branch,
      role: 'member',
    });
    await supabase.from('team_requests').update({ status: 'accepted' }).eq('id', req.id);
    await supabase.rpc('increment_team_members', { t_id: req.team_id });
    await supabase.from('notifications').insert({
      user_id: req.user_id,
      type: 'team_joined',
      title: `Joined team "${teamName}"! 🎉`,
      body: `Your request was accepted. Welcome to the team!`,
      data: { team_id: req.team_id },
    });
    toast.success(`${req.user_name} added to team!`);
    fetchRequests();
  };

  const handleReject = async (req: TeamRequest) => {
    await supabase.from('team_requests').update({ status: 'rejected' }).eq('id', req.id);
    await supabase.from('notifications').insert({
      user_id: req.user_id,
      type: 'team_request',
      title: `Team request update`,
      body: `Your request to join "${teamName}" was not accepted this time.`,
      data: { team_id: req.team_id },
    });
    fetchRequests();
  };

  if (loading) return <div className="skeleton h-16 rounded-xl" />;
  if (requests.length === 0) return (
    <p className="text-xs text-[var(--text-secondary)] text-center py-3 opacity-60">No pending join requests</p>
  );

  return (
    <div className="space-y-2">
      {requests.map(req => (
        <div key={req.id} className="flex items-center gap-3 bg-[var(--surface-raised)] rounded-xl p-3 border border-[var(--border)]">
          <AvatarCircle name={req.user_name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{req.user_name}</p>
            <p className="text-xs text-[var(--text-secondary)]">{req.user_branch}</p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => handleAccept(req)}
              className="w-8 h-8 rounded-xl bg-green-500/10 text-green-400 flex items-center justify-center hover:bg-green-500/20 transition-colors">
              <Check size={14} />
            </button>
            <button onClick={() => handleReject(req)}
              className="w-8 h-8 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main TeamsPage ───────────────────────────────────────────────────────────
export default function TeamsPage() {
  const { profile } = useAuth();
  const { teams, loading, refetch } = useTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'recruiting' | 'full'>('all');

  const myTeams = teams.filter(t =>
    t.members?.some(m => m.user_id === profile?.id)
  );
  const otherTeams = teams.filter(t =>
    !t.members?.some(m => m.user_id === profile?.id)
  );

  const filterTeams = (arr: Team[]) =>
    arr.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        (t.event_title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        t.required_skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
      const matchStatus = filterStatus === 'all' || t.status === filterStatus;
      return matchSearch && matchStatus;
    });

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[var(--text-primary)]">Team Formation</h1>
          <p className="text-[var(--text-secondary)] text-sm mt-0.5">Find your squad for hackathons & projects</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gold px-4 py-2 text-sm"
        >
          <Plus size={16} /> New Team
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search teams or skills..."
            className="input-field pl-10 py-2.5 text-sm"
          />
        </div>
        <div className="flex gap-1">
          {(['all', 'recruiting', 'full'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2.5 rounded-xl text-xs font-semibold border transition-all capitalize
                ${filterStatus === s
                  ? 'bg-[var(--gold)] text-black border-[var(--gold)]'
                  : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold)]/50'
                }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}
        </div>
      ) : (
        <>
          {/* My Teams */}
          {myTeams.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Crown size={16} className="text-[var(--gold)]" /> My Teams
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filterTeams(myTeams).map(team => (
                  <div key={team.id} className="space-y-2">
                    <TeamCard team={team} onRefetch={refetch} />
                    {team.created_by === profile?.id && (
                      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-3">
                        <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2">Join Requests</p>
                        <TeamRequestsPanel teamId={team.id} teamName={team.name} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Teams */}
          <div className="space-y-3">
            {myTeams.length > 0 && (
              <h2 className="font-serif font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Target size={16} className="text-[var(--gold)]" /> Other Teams
              </h2>
            )}
            {filterTeams(otherTeams).length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-[var(--gold)]/10 flex items-center justify-center mx-auto mb-3">
                  <Users size={28} className="text-[var(--gold)]" strokeWidth={1.5} />
                </div>
                <p className="font-serif text-lg font-semibold text-[var(--text-primary)] mb-1">
                  {search ? 'No teams match your search' : 'No teams yet'}
                </p>
                <p className="text-[var(--text-secondary)] text-sm mb-4">
                  {search ? 'Try different keywords' : 'Create a team and find your squadmates!'}
                </p>
                <button onClick={() => setShowCreate(true)} className="btn-gold px-6 py-2.5">
                  <Plus size={15} /> Create Team
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filterTeams(otherTeams).map(team => (
                  <TeamCard key={team.id} team={team} onRefetch={refetch} />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {showCreate && (
        <CreateTeamModal onClose={() => setShowCreate(false)} onCreated={refetch} />
      )}
    </div>
  );
}
