import { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useMultiAuth } from '@/contexts/MultiAuthContext';

export const MultiProtectedRoute = ({ 
  children, 
  requireAdmin = false, 
  requireEmployee = false, 
  requireTrader = false,
  requireClient = false 
}) => {
  const { loading, isAdmin, isEmployee, isTrader, isClient, activeRole } = useMultiAuth();

  // Memoize auth checks to prevent infinite re-renders
  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const hasAnyAuth = useMemo(() => {
    return isAdmin() || isEmployee() || isTrader() || isClient();
  }, [isAdmin, isEmployee, isTrader, isClient]);

  // Check both that user has the role AND it's the active role
  // If activeRole is not set yet (initial load), allow if user has the role
  // If activeRole is set, require it to match the required role
  const isAdminUser = useMemo(() => {
    if (!isAdmin()) return false;
    return !activeRole || activeRole === 'admin';
  }, [isAdmin, activeRole]);
  
  const isEmployeeUser = useMemo(() => {
    if (!isEmployee()) return false;
    // If activeRole is set, it must be 'employee'. If not set, allow if they have employee auth.
    return !activeRole || activeRole === 'employee';
  }, [isEmployee, activeRole]);
  
  const isTraderUser = useMemo(() => {
    if (!isTrader()) return false;
    return !activeRole || activeRole === 'trader';
  }, [isTrader, activeRole]);
  
  const isClientUser = useMemo(() => {
    if (!isClient()) return false;
    return !activeRole || activeRole === 'client';
  }, [isClient, activeRole]);

  // Helper to get correct dashboard route based on activeRole - memoized
  // MUST be before early returns to maintain hook order
  const getCorrectDashboard = useMemo(() => {
    if (activeRole === 'admin' && isAdmin()) return "/stockship/admin/dashboard";
    if (activeRole === 'employee' && isEmployee()) return "/stockship/employee/dashboard";
    if (activeRole === 'trader' && isTrader()) return "/stockship/trader/dashboard";
    if (activeRole === 'client' && isClient()) return "/";
    // Fallback: check all roles
    if (isAdmin()) return "/stockship/admin/dashboard";
    if (isTrader()) return "/stockship/trader/dashboard";
    if (isEmployee()) return "/stockship/employee/dashboard";
    if (isClient()) return "/";
    return "/multi-login";
  }, [activeRole, isAdmin, isEmployee, isTrader, isClient]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasAnyAuth) {
    return <Navigate to="/multi-login" replace />;
  }

  // Check specific role requirements
  if (requireAdmin && !isAdminUser) {
    // Redirect to correct dashboard instead of showing error
    return <Navigate to={getCorrectDashboard} replace />;
  }

  if (requireEmployee && !isEmployeeUser) {
    // Redirect to correct dashboard instead of showing error
    return <Navigate to={getCorrectDashboard} replace />;
  }

  if (requireTrader && !isTraderUser) {
    // Redirect to correct dashboard instead of showing error
    return <Navigate to={getCorrectDashboard} replace />;
  }

  if (requireClient && !isClientUser) {
    // Redirect to correct dashboard instead of showing error
    return <Navigate to={getCorrectDashboard} replace />;
  }

  return <>{children}</>;
};

