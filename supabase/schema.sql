-- ============================================================
-- SyncSphere Events — Supabase PostgreSQL Schema
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── PROFILES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email         text UNIQUE NOT NULL,
  full_name     text NOT NULL DEFAULT '',
  usn           text NOT NULL DEFAULT '',
  branch        text NOT NULL DEFAULT '',
  year          integer NOT NULL DEFAULT 1,
  phone         text NOT NULL DEFAULT '',
  role          text NOT NULL DEFAULT 'student'
                  CHECK (role IN ('student','faculty','faculty_pending','admin')),
  reputation_score    integer NOT NULL DEFAULT 0,
  reporter_weight     float   NOT NULL DEFAULT 1.0,
  daily_post_count    integer NOT NULL DEFAULT 0,
  daily_post_date     date,
  is_active     boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, usn, branch, year, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'usn', ''),
    COALESCE(NEW.raw_user_meta_data->>'branch', ''),
    COALESCE((NEW.raw_user_meta_data->>'year')::integer, 1),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─── EVENTS ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS events (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 text NOT NULL,
  description           text NOT NULL DEFAULT '',
  poster_url            text,
  datetime              timestamptz,
  registration_fee      numeric NOT NULL DEFAULT 0,
  registration_link     text,
  eligibility           text,
  prize_pool            text,
  tags                  text[] NOT NULL DEFAULT '{}',
  state                 text NOT NULL DEFAULT 'active'
                          CHECK (state IN ('active','verified','auto_hidden','removed')),
  posted_by             uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  posted_by_name        text NOT NULL DEFAULT '',
  posted_by_role        text NOT NULL DEFAULT 'student',
  is_anonymous          boolean NOT NULL DEFAULT false,
  display_name          text NOT NULL DEFAULT '',
  report_count          integer NOT NULL DEFAULT 0,
  weighted_report_score float   NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_state ON events(state);
CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_tags ON events USING GIN(tags);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS events_updated_at ON events;
CREATE TRIGGER events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ─── REPORTS ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  reporter_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  reporter_name   text NOT NULL DEFAULT '',
  reason          text NOT NULL CHECK (reason IN ('spam','inappropriate','false_info','offensive','other')),
  reporter_weight float NOT NULL DEFAULT 1.0,
  reviewed_by     uuid REFERENCES profiles,
  review_result   text CHECK (review_result IN ('valid','false')),
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(event_id, reporter_id)
);

-- ─── BANS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bans (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  student_name    text NOT NULL DEFAULT '',
  student_usn     text NOT NULL DEFAULT '',
  issued_by       uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  issued_by_name  text NOT NULL DEFAULT '',
  reason          text NOT NULL,
  start_date      timestamptz NOT NULL DEFAULT now(),
  end_date        timestamptz,
  is_active       boolean NOT NULL DEFAULT true,
  unban_notes     text,
  unbanned_by     uuid REFERENCES profiles,
  unbanned_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- ─── REMINDERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  event_id        uuid NOT NULL REFERENCES events ON DELETE CASCADE,
  event_title     text NOT NULL DEFAULT '',
  event_datetime  timestamptz,
  notified_24h    boolean NOT NULL DEFAULT false,
  notified_1h     boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_id)
);

-- ─── NOTIFICATIONS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  type        text NOT NULL,
  title       text NOT NULL DEFAULT '',
  body        text NOT NULL DEFAULT '',
  data        jsonb NOT NULL DEFAULT '{}',
  read        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, read);

-- ─── CHAT ROOMS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_rooms (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  event_id    uuid REFERENCES events ON DELETE SET NULL,
  team_id     uuid,
  type        text NOT NULL DEFAULT 'general'
                CHECK (type IN ('event','team','general')),
  created_by  uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── CHAT MEMBERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id     uuid NOT NULL REFERENCES chat_rooms ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  user_name   text NOT NULL DEFAULT '',
  joined_at   timestamptz NOT NULL DEFAULT now(),
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('admin','member')),
  UNIQUE(room_id, user_id)
);

-- ─── CHAT MESSAGES ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id       uuid NOT NULL REFERENCES chat_rooms ON DELETE CASCADE,
  sender_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  sender_name   text NOT NULL DEFAULT '',
  sender_role   text NOT NULL DEFAULT 'student',
  content       text NOT NULL,
  message_type  text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text','image','system')),
  edited        boolean NOT NULL DEFAULT false,
  deleted       boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id, created_at);

-- ─── TEAMS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  description      text NOT NULL DEFAULT '',
  event_id         uuid REFERENCES events ON DELETE SET NULL,
  event_title      text,
  required_skills  text[] NOT NULL DEFAULT '{}',
  max_members      integer NOT NULL DEFAULT 4,
  current_members  integer NOT NULL DEFAULT 0,
  status           text NOT NULL DEFAULT 'recruiting'
                     CHECK (status IN ('recruiting','full','closed')),
  created_by       uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  created_by_name  text NOT NULL DEFAULT '',
  chat_room_id     uuid REFERENCES chat_rooms ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ─── TEAM MEMBERS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_members (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  user_name   text NOT NULL DEFAULT '',
  user_branch text NOT NULL DEFAULT '',
  user_year   integer NOT NULL DEFAULT 1,
  role        text NOT NULL DEFAULT 'member' CHECK (role IN ('leader','member')),
  joined_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- ─── TEAM REQUESTS ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS team_requests (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid NOT NULL REFERENCES teams ON DELETE CASCADE,
  team_name   text NOT NULL DEFAULT '',
  user_id     uuid NOT NULL REFERENCES profiles ON DELETE CASCADE,
  user_name   text NOT NULL DEFAULT '',
  user_branch text NOT NULL DEFAULT '',
  message     text NOT NULL DEFAULT '',
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── APP CONFIG ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS app_config (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_threshold    integer NOT NULL DEFAULT 5,
  max_daily_posts     integer NOT NULL DEFAULT 20,
  min_daily_posts     integer NOT NULL DEFAULT 1,
  ban_threshold       integer NOT NULL DEFAULT 10,
  chat_rate_limit_ms  integer NOT NULL DEFAULT 3000,
  auto_delete_days    integer NOT NULL DEFAULT 7,
  updated_at          timestamptz NOT NULL DEFAULT now(),
  updated_by          uuid REFERENCES profiles
);

-- Insert default config
INSERT INTO app_config (report_threshold, max_daily_posts, min_daily_posts, ban_threshold, chat_rate_limit_ms, auto_delete_days)
VALUES (5, 20, 1, 10, 3000, 7)
ON CONFLICT DO NOTHING;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports       ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans          ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders     ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_rooms    ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams         ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config    ENABLE ROW LEVEL SECURITY;

-- Helper: get caller role
CREATE OR REPLACE FUNCTION caller_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── profiles ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert" ON profiles;
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- ─── events ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "events_select" ON events;
CREATE POLICY "events_select" ON events FOR SELECT TO authenticated USING (
  CASE caller_role()
    WHEN 'faculty' THEN state IN ('active','verified','auto_hidden')
    WHEN 'admin'   THEN true
    ELSE state IN ('active','verified')
  END
);

DROP POLICY IF EXISTS "events_insert" ON events;
CREATE POLICY "events_insert" ON events FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = posted_by);

DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE TO authenticated
  USING (
    auth.uid() = posted_by AND
    created_at > now() - interval '1 hour'
    OR caller_role() IN ('faculty','admin')
  );

-- ─── reports ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "reports_insert" ON reports;
CREATE POLICY "reports_insert" ON reports FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "reports_select_faculty" ON reports;
CREATE POLICY "reports_select_faculty" ON reports FOR SELECT TO authenticated
  USING (caller_role() IN ('faculty','admin'));

-- ─── bans ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "bans_select" ON bans;
CREATE POLICY "bans_select" ON bans FOR SELECT TO authenticated
  USING (
    caller_role() IN ('faculty','admin') OR
    auth.uid() = student_id
  );

DROP POLICY IF EXISTS "bans_insert_faculty" ON bans;
CREATE POLICY "bans_insert_faculty" ON bans FOR INSERT TO authenticated
  WITH CHECK (caller_role() IN ('faculty','admin'));

DROP POLICY IF EXISTS "bans_update" ON bans;
CREATE POLICY "bans_update" ON bans FOR UPDATE TO authenticated
  USING (caller_role() IN ('faculty','admin'));

-- ─── reminders ────────────────────────────────────────────────
DROP POLICY IF EXISTS "reminders_own" ON reminders;
CREATE POLICY "reminders_own" ON reminders FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ─── notifications ────────────────────────────────────────────
DROP POLICY IF EXISTS "notifs_own" ON notifications;
CREATE POLICY "notifs_own" ON notifications FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifs_insert_any" ON notifications;
CREATE POLICY "notifs_insert_any" ON notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- ─── chat_rooms ───────────────────────────────────────────────
DROP POLICY IF EXISTS "rooms_select" ON chat_rooms;
CREATE POLICY "rooms_select" ON chat_rooms FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "rooms_insert" ON chat_rooms;
CREATE POLICY "rooms_insert" ON chat_rooms FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- ─── chat_members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "members_select" ON chat_members;
CREATE POLICY "members_select" ON chat_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "members_insert" ON chat_members;
CREATE POLICY "members_insert" ON chat_members FOR INSERT TO authenticated WITH CHECK (true);

-- ─── chat_messages ────────────────────────────────────────────
DROP POLICY IF EXISTS "messages_select" ON chat_messages;
CREATE POLICY "messages_select" ON chat_messages FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "messages_insert" ON chat_messages;
CREATE POLICY "messages_insert" ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id OR sender_name = 'System');

-- ─── teams ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "teams_select" ON teams;
CREATE POLICY "teams_select" ON teams FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "teams_insert" ON teams;
CREATE POLICY "teams_insert" ON teams FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "teams_update" ON teams;
CREATE POLICY "teams_update" ON teams FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR caller_role() = 'admin');

-- ─── team_members ─────────────────────────────────────────────
DROP POLICY IF EXISTS "team_members_select" ON team_members;
CREATE POLICY "team_members_select" ON team_members FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "team_members_insert" ON team_members;
CREATE POLICY "team_members_insert" ON team_members FOR INSERT TO authenticated WITH CHECK (true);

-- ─── team_requests ────────────────────────────────────────────
DROP POLICY IF EXISTS "team_requests_select" ON team_requests;
CREATE POLICY "team_requests_select" ON team_requests FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND teams.created_by = auth.uid()) OR
    caller_role() = 'admin'
  );

DROP POLICY IF EXISTS "team_requests_insert" ON team_requests;
CREATE POLICY "team_requests_insert" ON team_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "team_requests_update" ON team_requests;
CREATE POLICY "team_requests_update" ON team_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM teams WHERE teams.id = team_id AND teams.created_by = auth.uid()));

-- ─── app_config ───────────────────────────────────────────────
DROP POLICY IF EXISTS "config_select" ON app_config;
CREATE POLICY "config_select" ON app_config FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "config_write_admin" ON app_config;
CREATE POLICY "config_write_admin" ON app_config FOR ALL TO authenticated
  USING (caller_role() = 'admin') WITH CHECK (caller_role() = 'admin');

-- ============================================================
-- RPC FUNCTIONS
-- ============================================================

-- Increment reputation score (capped by role)
CREATE OR REPLACE FUNCTION increment_reputation(target_id uuid, delta integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET reputation_score = GREATEST(-50, reputation_score + delta)
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Adjust reporter weight (clamped 0.1 – 2.0)
CREATE OR REPLACE FUNCTION adjust_reporter_weight(target_id uuid, delta float)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET reporter_weight = GREATEST(0.1, LEAST(2.0, reporter_weight + delta))
  WHERE id = target_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment team member count
CREATE OR REPLACE FUNCTION increment_team_members(t_id uuid)
RETURNS void AS $$
DECLARE
  new_count integer;
  max_count integer;
BEGIN
  SELECT current_members + 1, max_members INTO new_count, max_count
  FROM teams WHERE id = t_id;

  UPDATE teams SET
    current_members = new_count,
    status = CASE WHEN new_count >= max_count THEN 'full' ELSE 'recruiting' END
  WHERE id = t_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- STORAGE BUCKET
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('event-posters', 'event-posters', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "event_posters_read" ON storage.objects;
CREATE POLICY "event_posters_read" ON storage.objects FOR SELECT USING (bucket_id = 'event-posters');

DROP POLICY IF EXISTS "event_posters_upload" ON storage.objects;
CREATE POLICY "event_posters_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'event-posters');

-- ============================================================
-- ENABLE REALTIME
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE events;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE teams;
ALTER PUBLICATION supabase_realtime ADD TABLE team_requests;

-- ============================================================
-- SEED DATA (demo)
-- ============================================================
-- NOTE: Run this AFTER creating real users via auth

-- Sample events (replace posted_by with real user UUIDs)
-- INSERT INTO events (title, description, tags, state, posted_by, posted_by_name, posted_by_role, display_name, registration_fee, prize_pool, datetime)
-- VALUES
--   ('HackFest 2025', '36-hour hackathon open to all branches. Build something amazing!', ARRAY['tech','workshop'], 'verified', '<user-uuid>', 'Dr. Ramesh', 'faculty', 'Dr. Ramesh', 0, '₹50,000 cash prize', now() + interval '7 days'),
--   ('Cultural Fiesta 2025', 'Annual cultural fest with dance, music and drama events.', ARRAY['cultural'], 'active', '<user-uuid>', 'Anonymous Student', 'student', 'Anonymous Student', 100, NULL, now() + interval '14 days'),
--   ('AI Workshop: Build Your First LLM App', 'Hands-on workshop on building LLM applications.', ARRAY['tech','workshop'], 'active', '<user-uuid>', 'Pranav Kumar', 'student', 'Pranav Kumar', 0, NULL, now() + interval '3 days'),
--   ('Cricket Premier League', 'Inter-department cricket tournament.', ARRAY['sports'], 'active', '<user-uuid>', 'Pranav Kumar', 'student', 'Pranav Kumar', 50, '₹5,000 prize', now() + interval '10 days'),
--   ('NAAC Accreditation Seminar', 'Academic seminar on NAAC preparation strategies.', ARRAY['academic'], 'active', '<user-uuid>', 'Dr. Ramesh', 'faculty', 'Dr. Ramesh', 0, NULL, now() + interval '5 days');

-- ============================================================
-- DONE — SyncSphere schema deployed successfully!
-- ============================================================
