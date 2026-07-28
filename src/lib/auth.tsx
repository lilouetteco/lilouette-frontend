import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type AuthUser, apiLogin, apiRegister } from "@/lib/api";

const TOKEN_KEY = "lilouette.auth.token";

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, turnstileToken: string) => Promise<void>;
  logout: () => void;
  persist: (access_token: string, u: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY);
    if (stored) {
      try {
        const { access_token, user: u, expiresAt } = JSON.parse(stored);
        if (expiresAt && Date.now() > expiresAt) {
          localStorage.removeItem(TOKEN_KEY);
        } else {
          setToken(access_token);
          setUser(u);
        }
      } catch {
        localStorage.removeItem(TOKEN_KEY);
      }
    }
  }, []);

  const persist = (access_token: string, u: AuthUser) => {
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 1 day
    localStorage.setItem(TOKEN_KEY, JSON.stringify({ access_token, user: u, expiresAt }));
    setToken(access_token);
    setUser(u);
  };

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    persist(res.access_token, res.user);
  };

  const register = async (name: string, email: string, password: string, turnstileToken: string) => {
    await apiRegister(name, email, password, turnstileToken);
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const isAdmin = user?.is_admin ?? false;

  return (
    <AuthContext.Provider value={{ user, token, isAdmin, login, register, logout, persist }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}