import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types';

interface Props {
  children: React.ReactNode;
  roles?: UserRole[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { session, profile } = useAuth();

  if (!session) return <Navigate to="/login" replace />;

  // If profile not yet loaded or is pending faculty, still allow basic routing
  if (profile && profile.role === 'faculty_pending') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-page px-4">
        <div className="bg-surface border border-themed rounded-2xl p-8 max-w-sm w-full text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-serif text-xl font-bold text-themed-primary mb-2">Application Pending</h2>
          <p className="text-themed-secondary text-sm mb-4">
            Your faculty application is under review. The admin will approve it within 24 hours.
          </p>
          <p className="text-gold font-semibold text-sm">{profile.email}</p>
        </div>
      </div>
    );
  }

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
