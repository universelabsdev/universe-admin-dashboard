import React from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "@/hooks/useUser";

interface RoleProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export function RoleProtectedRoute({ children, allowedRoles }: RoleProtectedRouteProps) {
  const { user, loading } = useUser();
  const [timedOut, setTimedOut] = React.useState(false);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) setTimedOut(true);
    }, 5000); // 5 second timeout
    return () => clearTimeout(timer);
  }, [loading]);

  if (loading && !timedOut) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const userRole = user?.role || "student";

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
