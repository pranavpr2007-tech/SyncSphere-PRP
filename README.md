# 🌟 SyncSphere Events

> *Sync People. Create Memories.* — Campus Event Management Platform for VVCE

A production-grade, full-stack college event management web application built with **React + TypeScript + Supabase + Tailwind CSS**.

---

## ✨ Features

### Core
- 🔐 **Authentication** — Student registration (.ac.in only), Faculty applications, Admin control
- 📅 **Event Feed** — Real-time event cards with tag filtering, skeleton loading, and FAB
- 📅 **Calendar** — Month-view with color-coded event dots, conflict detection, remind-me toggles
- 📸 **Event Creation** — Image upload with client-side compression, anonymous posting toggle
- 🔔 **Notifications** — Real-time push notifications with deep linking

### Social & Collaboration
- 💬 **Chat System** — Real-time chat rooms (general, event-linked, team-private), rate limiting, message grouping
- 👥 **Team Formation** — Create/join teams for hackathons, skill matching, join requests with notifications

### Moderation & Safety
- 🚩 **Report System** — Weighted report scoring, auto-hide on threshold, one-report-per-user enforcement
- 🛡️ **Moderation Queue** — Faculty review dashboard with approve/remove + reputation updates
- 🚫 **Ban System** — Duration bans with unban restrictions (only issuer or admin can unban)
- ⭐ **Reputation System** — Score-based daily post limits, reporter weight tracking

### Admin
- 📊 **Admin Dashboard** — Live stats: events today, open reports, active bans, student count
- ✅ **Faculty Approval** — Review and approve/reject faculty applications
- 📋 **All Bans** — Full ban history with admin unban powers
- ⚙️ **System Config** — Editable thresholds, limits, and rate controls

### UI/UX
- 🌙 **Dark / Light Mode** — Deep dark green + warm cream themes, persisted to localStorage
- 📱 **Mobile-First** — Bottom nav on mobile, sidebar on desktop, fluid responsive layout
- ⚡ **Micro-animations** — Scale hover, slide-up modals, shimmer skeletons, bounce loaders
- 🎨 **Professional Design** — Playfair Display + DM Sans, gold brand color, Saturn-ring logo SVG

---

## 🚀 Quick Start

### 1. Clone & Install
```bash
git clone <your-repo>
cd SyncSphere
npm install
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Open the **SQL Editor** and run `supabase/schema.sql`
3. Copy your project URL and anon key

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your Supabase credentials
```

### 4. Run Development Server
```bash
npm run dev
# Opens at http://localhost:5173
```

### 5. Build for Production
```bash
npm run build
npm run preview
```

---

## 🏗️ Project Structure

```
SyncSphere/
├── src/
│   ├── components/
│   │   ├── events/          # EventCard, CreateEventModal, ReportModal, TagChip
│   │   ├── layout/          # AppShell, Sidebar, TopBar, BottomNav, ProtectedRoute
│   │   └── ui/              # SyncSphereLogo, AvatarCircle, ThemeToggle, Skeletons, Loader
│   ├── contexts/
│   │   ├── AuthContext.tsx   # Supabase auth + profile
│   │   └── ThemeContext.tsx  # Dark/light mode
│   ├── hooks/
│   │   ├── useEvents.ts      # Events + reminders
│   │   └── useNotifications.ts # Notifications + unread count
│   ├── lib/
│   │   └── supabase.ts       # Supabase client + storage helpers
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ApplyFacultyPage.tsx
│   │   ├── FeedPage.tsx
│   │   ├── EventDetailPage.tsx
│   │   ├── CalendarPage.tsx
│   │   ├── NotificationsPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ChatPage.tsx       # Full real-time chat
│   │   ├── TeamsPage.tsx      # Team formation
│   │   ├── ModerationPage.tsx
│   │   ├── StudentsPage.tsx
│   │   └── admin/
│   │       ├── AdminDashboard.tsx
│   │       ├── FacultyApprovalPage.tsx
│   │       ├── AllBansPage.tsx
│   │       └── SystemConfigPage.tsx
│   ├── types/
│   │   └── index.ts          # All TypeScript types
│   ├── App.tsx               # Router + route guards
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles + Tailwind
├── supabase/
│   └── schema.sql            # Full DB schema + RLS + RPCs
├── .env.example
├── tailwind.config.js
├── vite.config.ts
└── tsconfig.json
```

---

## 🎨 Design Tokens

| Mode | Background | Surface | Gold | Emerald |
|------|-----------|---------|------|---------|
| Light | `#F2EDE4` cream | `#FFFFFF` | `#B8870B` | `#1C5631` |
| Dark | `#0D1F14` deep green | `#162A1C` | `#D4A320` | `#2D7A46` |

**Fonts**: Playfair Display (headings) · DM Sans (body)

---

## 👥 User Roles

| Role | Registration | Capabilities |
|------|-------------|--------------|
| `student` | Self-register (.ac.in) | Post events, report, chat, teams, calendar |
| `faculty` | Admin approval required | + Verify/remove events, manage students, bans |
| `admin` | Set directly in DB | + Approve faculty, system config, all bans |

---

## 🔧 Key Business Rules

1. **Email domain**: Only `.ac.in` addresses for students
2. **Anonymous posting**: Students only — identity stored but revealed to faculty on reports
3. **Auto-hide**: Event hidden when `weighted_report_score ≥ 5`
4. **Daily limits**: Based on reputation score (1–15 posts/day)
5. **Ban restriction**: Only issuing faculty OR admin can lift a ban
6. **Daily reset**: Post count resets at midnight IST

---

## 📊 Reputation System

| Event | Change |
|-------|--------|
| Event verified | +2 |
| Event removed | -3 |
| Report confirmed valid | +1 (reporter), -2 (poster) |
| Report found false | -1 (reporter) |

Reporter weight: starts at 1.0, range 0.1–2.0

---

*Built for VVCE Campus — SyncSphere v2.0*
