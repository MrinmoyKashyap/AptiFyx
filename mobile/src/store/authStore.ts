import { create } from 'zustand';
import { User, Provider, UserRole } from '../types';

interface AuthState {
  token: string | null;
  role: UserRole | null;
  user: User | null;
  provider: Provider | null;
  isAuthenticated: boolean;

  setAuth: (token: string, role: UserRole, data: User | Provider) => void;
  updateUser: (data: Partial<User>) => void;
  updateProvider: (data: Partial<Provider>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  role: null,
  user: null,
  provider: null,
  isAuthenticated: false,

  setAuth: (token, role, data) =>
    set({
      token,
      role,
      isAuthenticated: true,
      user: role === 'customer' ? (data as User) : null,
      provider: role === 'provider' ? (data as Provider) : null,
    }),

  updateUser: (data) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...data } : null,
    })),

  updateProvider: (data) =>
    set((state) => ({
      provider: state.provider ? { ...state.provider, ...data } : null,
    })),

  logout: () =>
    set({
      token: null,
      role: null,
      user: null,
      provider: null,
      isAuthenticated: false,
    }),
}));
