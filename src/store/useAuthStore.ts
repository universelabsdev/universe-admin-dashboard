import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatar?: string | null;
  imageUrl?: string | null;
  role: string;
  globalRoleId?: string;
  permissions?: string[];
  isVerified?: boolean;
  branchId?: string;
  departmentId?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    console.log("[useAuthStore] Logging in user:", { id: user.id, role: user.role });
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    console.log("[useAuthStore] Logging out");
    set({ user: null, isAuthenticated: false });
  },
}));
