import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/store";
import type { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (data: { name: string; email: string; studentId: string; password: string }) => Promise<User>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => setUser(authApi.current()), []);

  const login: AuthCtx["login"] = async (email, password) => {
    const u = authApi.login(email, password);
    setUser(u);
    return u;
  };
  const register: AuthCtx["register"] = async (data) => {
    const u = authApi.register(data);
    setUser(u);
    return u;
  };
  const logout = () => {
    authApi.logout();
    setUser(null);
  };
  const resetPassword: AuthCtx["resetPassword"] = async (email, newPassword) => {
    authApi.resetPassword(email, newPassword);
  };

  return <Ctx.Provider value={{ user, login, register, logout, resetPassword }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}