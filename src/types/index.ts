// ─── User / Auth ─────────────────────────────────────────────────────────────
export type UserRole = 'student' | 'faculty' | 'faculty_pending' | 'admin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  usn: string;
  branch: string;
  year: number;
  phone: string;
  role: UserRole;
  reputation_score: number;
  reporter_weight: number;
  daily_post_count: number;
  daily_post_date: string | null;
  is_active: boolean;
  created_at: string;
}

// ─── Events ───────────────────────────────────────────────────────────────────
export type EventTag = 'tech' | 'cultural' | 'sports' | 'academic' | 'workshop';
export type EventState = 'active' | 'verified' | 'auto_hidden' | 'removed';

export interface Event {
  id: string;
  title: string;
  description: string;
  poster_url: string | null;
  datetime: string | null;
  registration_fee: number;
  registration_link: string | null;
  eligibility: string | null;
  prize_pool: string | null;
  tags: EventTag[];
  state: EventState;
  posted_by: string;
  posted_by_name: string;
  posted_by_role: UserRole;
  is_anonymous: boolean;
  display_name: string;
  report_count: number;
  weighted_report_score: number;
  created_at: string;
  updated_at: string;
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export type ReportReason = 'spam' | 'inappropriate' | 'false_info' | 'offensive' | 'other';

export interface Report {
  id: string;
  event_id: string;
  reporter_id: string;
  reporter_name: string;
  reason: ReportReason;
  reporter_weight: number;
  reviewed_by: string | null;
  review_result: 'valid' | 'false' | null;
  created_at: string;
}

// ─── Bans ─────────────────────────────────────────────────────────────────────
export interface Ban {
  id: string;
  student_id: string;
  student_name: string;
  student_usn: string;
  issued_by: string;
  issued_by_name: string;
  reason: string;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  unban_notes: string | null;
  unbanned_by: string | null;
  unbanned_at: string | null;
  created_at: string;
}

// ─── Reminders ────────────────────────────────────────────────────────────────
export interface Reminder {
  id: string;
  user_id: string;
  event_id: string;
  event_title: string;
  event_datetime: string;
  notified_24h: boolean;
  notified_1h: boolean;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────
export type NotificationType =
  | 'event_verified'
  | 'event_removed'
  | 'report_submitted'
  | 'report_reviewed'
  | 'ban_issued'
  | 'ban_lifted'
  | 'faculty_approved'
  | 'reminder_24h'
  | 'reminder_1h'
  | 'team_invite'
  | 'team_joined'
  | 'team_request';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export interface ChatRoom {
  id: string;
  name: string;
  description: string;
  event_id: string | null;
  team_id: string | null;
  type: 'event' | 'team' | 'general';
  created_by: string;
  created_at: string;
  member_count?: number;
  last_message?: ChatMessage | null;
}

export interface ChatMessage {
  id: string;
  room_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  content: string;
  message_type: 'text' | 'image' | 'system';
  edited: boolean;
  deleted: boolean;
  created_at: string;
}

export interface ChatMember {
  id: string;
  room_id: string;
  user_id: string;
  user_name: string;
  joined_at: string;
  role: 'admin' | 'member';
}

// ─── Team Formation ───────────────────────────────────────────────────────────
export type TeamStatus = 'recruiting' | 'full' | 'closed';

export interface Team {
  id: string;
  name: string;
  description: string;
  event_id: string | null;
  event_title: string | null;
  required_skills: string[];
  max_members: number;
  current_members: number;
  status: TeamStatus;
  created_by: string;
  created_by_name: string;
  chat_room_id: string | null;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  user_name: string;
  user_branch: string;
  user_year: number;
  role: 'leader' | 'member';
  joined_at: string;
}

export interface TeamRequest {
  id: string;
  team_id: string;
  team_name: string;
  user_id: string;
  user_name: string;
  user_branch: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
}

// ─── App Config ───────────────────────────────────────────────────────────────
export interface AppConfig {
  id: string;
  report_threshold: number;
  max_daily_posts: number;
  min_daily_posts: number;
  ban_threshold: number;
  chat_rate_limit_ms: number;
  auto_delete_days: number;
  updated_at: string;
  updated_by: string | null;
}

// ─── Reputation Tier ──────────────────────────────────────────────────────────
export type ReputationTier = 'new' | 'trusted' | 'highly_trusted' | 'flagged' | 'restricted';

export function getReputationTier(score: number): ReputationTier {
  if (score >= 30) return 'highly_trusted';
  if (score >= 10) return 'trusted';
  if (score >= 0)  return 'new';
  if (score >= -10) return 'flagged';
  return 'restricted';
}

export function getDailyPostLimit(score: number): number {
  if (score >= 30) return 15;
  if (score >= 10) return 10;
  if (score >= 0)  return 5;
  if (score >= -10) return 3;
  return 1;
}
