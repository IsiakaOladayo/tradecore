import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token:    null,
      business: null,

      login: async (email, password) => {
        const res = await fetch(`${API}/api/auth/login`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        set({ token: data.token, business: data.business });
        return data;
      },

      register: async (payload) => {
        const res = await fetch(`${API}/api/auth/register`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        set({ token: data.token, business: data.business });
        return data;
      },

      logout: () => set({ token: null, business: null }),
    }),
    { name: 'tradecore-auth' }
  )
);

// API helper — attaches JWT to every request
export async function api(path, options = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
