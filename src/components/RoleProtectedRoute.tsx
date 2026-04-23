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
      <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
        <div className="relative">
          <div className="h-20 w-20 rounded-full border-t-2 border-r-2 border-primary animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="material-symbols-rounded text-white filled text-xl">rocket_launch</span>
            </div>
          </div>
        </div>
        <p className="mt-6 text-slate-400 font-black tracking-widest uppercase text-[10px] animate-pulse">Initializing Interface...</p>
      </div>
    );
  }

  const userRole = user?.role || "student";

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
