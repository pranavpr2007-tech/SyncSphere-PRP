import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppShell from './components/layout/AppShell';
import FullPageLoader from './components/ui/FullPageLoader';
import { useAuth } from './contexts/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ApplyFacultyPage from './pages/ApplyFacultyPage';
import FeedPage from './pages/FeedPage';
import EventDetailPage from './pages/EventDetailPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import ChatPage from './pages/ChatPage';
import TeamsPage from './pages/TeamsPage';
import ModerationPage from './pages/ModerationPage';
import StudentsPage from './pages/StudentsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import FacultyApprovalPage from './pages/admin/FacultyApprovalPage';
import AllBansPage from './pages/admin/AllBansPage';
import SystemConfigPage from './pages/admin/SystemConfigPage';

function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <FullPageLoader />;

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/apply-faculty" element={<ApplyFacultyPage />} />

      {/* Authenticated shell */}
      <Route
        element={
          <ProtectedRoute roles={['student', 'faculty', 'admin']}>
            <AppShell />
          </ProtectedRoute>
        }
      >
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/events/:id" element={<EventDetailPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/chat/:roomId" element={<ChatPage />} />
        <Route path="/teams" element={<TeamsPage />} />

        {/* Faculty + Admin */}
        <Route
          path="/moderation"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <ModerationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute roles={['faculty', 'admin']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/faculty-approval"
          element={
            <ProtectedRoute roles={['admin']}>
              <FacultyApprovalPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/bans"
          element={
            <ProtectedRoute roles={['admin']}>
              <AllBansPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/config"
          element={
            <ProtectedRoute roles={['admin']}>
              <SystemConfigPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/feed" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
