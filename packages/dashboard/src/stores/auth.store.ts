import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'user' | 'viewer';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,

        login: async (username: string, password: string): Promise<boolean> => {
          set({ isLoading: true, error: null });
          try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
              set({ isLoading: false, error: data.error || 'Login failed' });
              return false;
            }

            set({
              user: data.data.user,
              token: data.data.token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
            });
            return true;
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Network error',
            });
            return false;
          }
        },

        logout: async (): Promise<void> => {
          try {
            await fetch(`${API_BASE}/api/auth/logout`, {
              method: 'POST',
              credentials: 'include',
            });
          } catch {
            // Ignore logout errors
          } finally {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              error: null,
            });
          }
        },

        checkAuth: async (): Promise<void> => {
          const { token } = get();
          if (!token) {
            set({ isAuthenticated: false });
            return;
          }

          set({ isLoading: true });
          try {
            const response = await fetch(`${API_BASE}/api/auth/me`, {
              headers: { Authorization: `Bearer ${token}` },
              credentials: 'include',
            });

            if (!response.ok) {
              set({ user: null, token: null, isAuthenticated: false, isLoading: false });
              return;
            }

            const data = await response.json();
            set({
              user: data.data.user,
              isAuthenticated: true,
              isLoading: false,
            });
          } catch {
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              isLoading: false,
            });
          }
        },

        clearError: () => set({ error: null }),
      }),
      {
        name: 'rms-auth',
        partialize: (state) => ({ token: state.token, user: state.user }),
      }
    )
  )
);
