import { useApiClient } from '@/lib/api-client';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { useEffect } from 'react';

export function useUser() {
  const api = useApiClient();
  const { isSignedIn, isLoaded } = useAuth();
  const { user: clerkUser } = useClerkUser();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);

  const { data: user, isLoading: loading, error, refetch } = useQuery({
    queryKey: ['user', 'me'],
    queryFn: async () => {
      console.log("[useUser] Fetching /users/me...");
      try {
        const response = await api.get('/users/me');
        console.log("[useUser] /users/me response:", response);
        const userData = (response as any).data || response;
        console.log("[useUser] Extracted userData:", userData);
        return userData;
      } catch (err) {
        console.error("[useUser] Error fetching /users/me:", err);
        throw err;
      }
    },
    enabled: isLoaded && !!isSignedIn,
    retry: false, // Don't retry on 401
  });

  useEffect(() => {
    console.log("[useUser] Auth State:", { isLoaded, isSignedIn, clerkUser: clerkUser?.id });
    if (user) {
      console.log("[useUser] Syncing user to store:", user.role);
      login(user);
    } else if (isLoaded && !isSignedIn) {
      console.log("[useUser] Logging out (not signed in)");
      logout();
    }
  }, [user, isSignedIn, isLoaded, login, logout, clerkUser]);

  return { user, clerkUser, loading: !isLoaded || loading, error, refetch };
}
