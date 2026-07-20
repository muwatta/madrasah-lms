import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';
import LoadingSpinner from './LoadingSpinner';
import type { ReactNode } from 'react';

const ROLE_DASHBOARDS: Record<User['role'], string> = {
  student: '/student/dashboard',
  ustaadh: '/teacher/dashboard',
  parent: '/parent/dashboard',
  mudeer: '/admin/dashboard',
  idaarah: '/board/dashboard',
};

interface ProtectedRouteProps {
  allowedRoles?: User['role'][];
  children?: ReactNode;
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={ROLE_DASHBOARDS[user.role] || '/login'} replace />;
  }

  return children || <Outlet />;
}
