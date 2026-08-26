import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import type { ReflexRole } from '../lib/types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allow?: ReflexRole[];
}

export function ProtectedRoute({ children, allow }: ProtectedRouteProps) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-[var(--color-muted-foreground)]">
        <Loader2 className="animate-spin" size={20} aria-hidden="true" />
        <span className="sr-only">Loading</span>
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;
  if (allow && profile && !allow.includes(profile.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}
