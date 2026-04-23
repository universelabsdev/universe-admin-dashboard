import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { ClerkProvider, SignedIn, SignedOut } from "@clerk/clerk-react";

import { ThemeProvider } from "@/components/theme-provider";
import ProtectedLayout from "@/layouts/ProtectedLayout";
import Login from "@/pages/auth/Login";
import SignUp from "@/pages/auth/SignUp";
import Dashboard from "@/pages/admin/Dashboard";
import BuildingsPage from "@/pages/admin/buildings/page";
import UserDirectoryPage from "@/pages/admin/identity/directory/page";
import UserDetailPage from '@/pages/admin/identity/directory/[id]/page';
import RoleManagementPage from '@/pages/admin/identity/rbac/page';
import NetworkManagementPage from '@/pages/admin/identity/network/page';
import DigitalIdManagementPage from '@/pages/admin/identity/digital-id/page';
import AcademicManagerPage from "@/pages/admin/academic/manager/page";
import ElectionCenterPage from "@/pages/admin/governance/elections/page";
import VotingCenterPage from "@/pages/user/voting/page";
import ModerationQueuePage from "@/pages/admin/safety/moderation/page";
import KillSwitchPage from "@/pages/admin/system/kill-switch/page";
import PlaceholderPage from "@/pages/PlaceholderPage";
import UserProfilePage from "@/pages/user/profile/page";
import SettingsPage from "@/pages/user/settings/page";
import OnboardingPage from "@/pages/auth/Onboarding";
import { CheckAndSyncUser } from "@/components/CheckAndSyncUser";
import { useUser } from "@/hooks/useUser";

class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-4 text-center bg-background">
          <h1 className="text-2xl font-bold text-destructive mb-2 font-heading">Something went wrong</h1>
          <p className="text-muted-foreground mb-4">The application encountered an unexpected error.</p>
          <pre className="p-4 bg-muted rounded-2xl text-xs overflow-auto max-w-full text-left border border-border">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button 
            className="mt-6 px-6 py-2.5 bg-primary text-primary-foreground rounded-full font-medium shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.location.reload()}
          >
            Reload Application
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function AdminRoleGuard({ children }: { children: React.ReactNode }) {
  const { user, clerkUser, loading, error } = useUser();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Verifying Administrative Access...</p>
      </div>
    );
  }

  const dbRole = user?.role?.toLowerCase();
  const clerkMetadataRole = (clerkUser?.publicMetadata as any)?.role?.toLowerCase();
  const isAdmin = dbRole === "admin" || clerkMetadataRole === "admin";
  const userEmail = user?.email || clerkUser?.primaryEmailAddress?.emailAddress || "Unknown Email";

  if (!isAdmin) {
    console.log("[AdminRoleGuard] Access Denied:", { dbRole, clerkMetadataRole, email: userEmail });
    return (
      <div className="flex flex-col items-center justify-center h-screen p-6 text-center bg-background">
        <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mb-6">
          <span className="material-symbols-rounded text-destructive text-4xl">lock</span>
        </div>
        <h1 className="text-3xl font-black text-foreground mb-2">Access Denied</h1>
        <div className="bg-muted/50 p-6 rounded-3xl border border-border mb-8 max-w-md w-full">
          <p className="text-muted-foreground mb-4">
            The UniVerse Admin Workspace is restricted to authorized personnel. 
          </p>
          <div className="space-y-2 text-left bg-card p-4 rounded-2xl border border-border shadow-sm">
             <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-bold uppercase">Account</span>
                <span className="text-foreground font-medium">{userEmail}</span>
             </div>
             <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-bold uppercase">Detected Role</span>
                <span className="text-destructive font-black uppercase">{dbRole || clerkMetadataRole || "No Role"}</span>
             </div>
             {error && (
               <div className="flex justify-between text-xs pt-2 border-t border-border mt-2">
                  <span className="text-muted-foreground font-bold uppercase">Auth Error</span>
                  <span className="text-red-500 font-medium truncate ml-4">{(error as any).message}</span>
               </div>
             )}
          </div>
        </div>
        <div className="flex gap-4">
          <button 
            className="px-8 py-3 bg-primary text-primary-foreground rounded-full font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={() => window.location.href = 'https://universe-mobile-web.vercel.app'}
          >
            Return to UniVerse Web
          </button>
          <button 
            className="px-8 py-3 bg-muted text-foreground rounded-full font-bold hover:bg-muted/80 transition-all"
            onClick={() => window.location.reload()}
          >
            Retry Sync
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SignedIn>
        <CheckAndSyncUser>
          <AdminRoleGuard>
            {children}
          </AdminRoleGuard>
        </CheckAndSyncUser>
      </SignedIn>
      <SignedOut>
        <Navigate to="/login" replace />
      </SignedOut>
    </>
  );
}

export default function App() {
  if (!PUBLISHABLE_KEY) {
    return (
      <div className="flex items-center justify-center h-screen bg-destructive/10">
        <div className="p-8 bg-card rounded-3xl shadow-2xl border border-destructive/20 text-center max-w-md">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-rounded text-destructive text-3xl">error</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2 font-heading">Configuration Error</h2>
          <p className="text-muted-foreground mb-6">Missing <code>VITE_CLERK_PUBLISHABLE_KEY</code>. Please check your <code>.env</code> file.</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <ClerkProvider 
        publishableKey={PUBLISHABLE_KEY}
        signInUrl="/login"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        afterSignUpUrl="/onboarding"
      >
        <ThemeProvider defaultTheme="system" storageKey="universe-theme">
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
            <Routes>
              <Route path="/login/*" element={
                <SignedOut>
                  <Login />
                </SignedOut>
              } />
              <Route path="/sign-up/*" element={
                <SignedOut>
                  <SignUp />
                </SignedOut>
              } />
              <Route path="/sign-in/*" element={<Navigate to="/login" replace />} />
              <Route path="/sign-up/*" element={<Navigate to="/login" replace />} />

            <Route
              path="/onboarding"
              element={
                <SignedIn>
                   <OnboardingPage />
                </SignedIn>
              }
            />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <ProtectedLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              
              {/* Profile & Settings (Still Admin context) */}
              <Route path="user/profile" element={<UserProfilePage />} />
              <Route path="user/settings" element={<SettingsPage />} />

              {/* Identity Module */}
              <Route path="admin/identity/directory" element={<UserDirectoryPage />} />
              <Route path="admin/identity/directory/:id" element={<UserDetailPage />} />
              <Route path="admin/identity/network" element={<NetworkManagementPage />} />
              <Route path="admin/identity/rbac" element={<RoleManagementPage />} />
              <Route path="admin/identity/digital-id" element={<DigitalIdManagementPage />} />

              {/* Academic & Campus Infrastructure */}
              <Route path="admin/campus/buildings" element={<BuildingsPage />} />
              <Route path="admin/academic/manager" element={<AcademicManagerPage />} />
              <Route path="admin/academic/registrar" element={<PlaceholderPage title="Registrar (Enrollment)" description="Manage student enrollments, waitlists, and course capacities." />} />
              <Route path="admin/academic/scheduling" element={<PlaceholderPage title="Scheduling" description="Resolve room conflicts and optimize the master university timetable." />} />

              {/* Organizations & Elections */}
              <Route path="admin/governance/clubs" element={<PlaceholderPage title="Clubs & Guilds" description="Approve new student organizations, manage budgets, and oversee faculty advisors." />} />
              <Route path="admin/governance/elections" element={<ElectionCenterPage />} />
              <Route path="user/voting" element={<VotingCenterPage />} />

              {/* Moderation & Safety */}
              <Route path="admin/safety/moderation" element={<ModerationQueuePage />} />
              <Route path="admin/safety/crisis" element={<PlaceholderPage title="Crisis Response" description="Activate emergency protocols, broadcast campus-wide alerts, and coordinate with campus security." />} />
              <Route path="admin/safety/filters" element={<PlaceholderPage title="Content Filters" description="Configure automated keyword blocking and AI-driven toxicity detection rules." />} />

              {/* Communications & Economy */}
              <Route path="admin/engagement/announcements" element={<PlaceholderPage title="Announcements" description="Draft and publish official university communications to specific cohorts or the entire student body." />} />
              <Route path="admin/engagement/marketplace" element={<PlaceholderPage title="Marketplace Admin" description="Monitor transactions, resolve disputes, and manage prohibited item lists." />} />
              <Route path="admin/engagement/gamification" element={<PlaceholderPage title="Gamification" description="Configure XP rewards, achievement badges, and leaderboard rules." />} />

              {/* System & Realtime */}
              <Route path="admin/system/kill-switch" element={<KillSwitchPage />} />
              <Route path="admin/system/state" element={<PlaceholderPage title="Universe State" description="View real-time metrics on active WebSocket connections, cache hit rates, and database load." />} />
              <Route path="admin/system/devices" element={<PlaceholderPage title="Device Registry" description="Manage trusted devices, revoke active sessions, and monitor login anomalies." />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
      </ThemeProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}
