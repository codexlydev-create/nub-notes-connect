import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { User } from "@/lib/types";
import { api, ApiError, getToken, setToken } from "@/lib/api";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  /** Step 1: send signup OTP to email. */
  beginRegister: (data: { name: string; email: string; studentId: string; password: string }) => Promise<{ email: string }>;
  /** Step 2: verify OTP and create the account. */
  completeRegister: (data: { name: string; email: string; studentId: string; department?: string; password: string; otp: string }) => Promise<User>;
  /** Re-send signup OTP. */
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  /** Send a password-reset OTP to the email. */
  sendResetOtp: (email: string) => Promise<void>;
  /** Verify the reset OTP and set the new password. */
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  updateProfile: (patch: { name?: string; studentId?: string; department?: string; avatarUrl?: string; avatarKey?: string }) => Promise<User>;
  /** Remove the user's avatar. */
  deleteAvatar: () => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  /** Request OTP to a NEW email; the user keeps using their old email until verified. */
  requestEmailChange: (newEmail: string) => Promise<void>;
  /** Confirm pending email change with OTP. */
  confirmEmailChange: (otp: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!getToken()) { setUser(null); return; }
    try {
      const r = await api<{ user: User }>("/api/auth/me", { auth: true });
      setUser(r.user);
    } catch (e) {
      // ONLY clear the token on a true 401 — keep it through transient
      // network / 5xx / cold-start errors so the user stays logged in.
      if (e instanceof ApiError && e.status === 401) {
        setToken(null);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const login: AuthCtx["login"] = async (email, password) => {
    const r = await api<{ token: string; user: User }>("/api/auth/login", {
      method: "POST", body: { email, password },
    });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };

  const beginRegister: AuthCtx["beginRegister"] = async (data) => {
    await api("/api/auth/send-otp", {
      method: "POST", body: { email: data.email, purpose: "signup" },
    });
    return { email: data.email };
  };

  const completeRegister: AuthCtx["completeRegister"] = async (data) => {
    // 1. verify OTP → otpToken
    const v = await api<{ otpToken: string }>("/api/auth/verify-otp", {
      method: "POST", body: { email: data.email, code: data.otp, purpose: "signup" },
    });
    // 2. create account + sign in
    const r = await api<{ token: string; user: User }>("/api/auth/signup", {
      method: "POST",
      body: {
        name: data.name,
        email: data.email,
        password: data.password,
        studentId: data.studentId,
        department: data.department || "",
        otpToken: v.otpToken,
      },
    });
    setToken(r.token);
    setUser(r.user);
    return r.user;
  };

  const resendOtp: AuthCtx["resendOtp"] = async (email) => {
    await api("/api/auth/send-otp", { method: "POST", body: { email, purpose: "signup" } });
  };

  const sendResetOtp: AuthCtx["sendResetOtp"] = async (email) => {
    await api("/api/auth/send-otp", { method: "POST", body: { email, purpose: "reset" } });
  };

  const resetPassword: AuthCtx["resetPassword"] = async (email, otp, newPassword) => {
    const v = await api<{ otpToken: string }>("/api/auth/verify-otp", {
      method: "POST", body: { email, code: otp, purpose: "reset" },
    });
    await api("/api/auth/reset-password", {
      method: "POST", body: { email, newPassword, otpToken: v.otpToken },
    });
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const updateProfile: AuthCtx["updateProfile"] = async (patch) => {
    const r = await api<{ user: User }>("/api/users/me", {
      method: "PATCH", body: patch, auth: true,
    });
    setUser(r.user);
    return r.user;
  };

  const deleteAvatar: AuthCtx["deleteAvatar"] = async () => {
    const r = await api<{ user: User }>("/api/users/me/avatar", {
      method: "DELETE", auth: true,
    });
    setUser(r.user);
    return r.user;
  };

  const changePassword: AuthCtx["changePassword"] = async (cur, next) => {
    await api("/api/auth/change-password", {
      method: "POST", body: { currentPassword: cur, newPassword: next }, auth: true,
    });
  };

  const requestEmailChange: AuthCtx["requestEmailChange"] = async (newEmail) => {
    const r = await api<{ user: User }>("/api/auth/request-email-change", {
      method: "POST", body: { newEmail }, auth: true,
    });
    setUser(r.user);
  };

  const confirmEmailChange: AuthCtx["confirmEmailChange"] = async (otp) => {
    const r = await api<{ user: User }>("/api/auth/confirm-email-change", {
      method: "POST", body: { code: otp }, auth: true,
    });
    setUser(r.user);
  };

  return (
    <Ctx.Provider
      value={{
        user, loading, login, beginRegister, completeRegister, resendOtp, logout,
        sendResetOtp, resetPassword, updateProfile, deleteAvatar, changePassword,
        requestEmailChange, confirmEmailChange, refresh,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}