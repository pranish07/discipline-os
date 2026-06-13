import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  session: null,
  loading: true,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  signOut: () => {
    localStorage.removeItem('auth.token');
    localStorage.removeItem('auth.refresh_token');
    set({ user: null, session: null });
  },
}));
