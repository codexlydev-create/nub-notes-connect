import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi } from "@/lib/store";
import type { User } from "@/lib/types";
import { toast } from "sonner";

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  /** Step 1 of registration: generates & "sends" an OTP to the email. Returns the pending registration id. */
  beginRegister: (data: { name: string; email: string; studentId: string; password: string }) => Promise<{ email: string }>;
  /** Step 2: verifies the OTP, creates the account, and signs the user in. */
  completeRegister: (email: string, otp: string) => Promise<User>;
  /** Re-send OTP for a pending registration. */
  resendOtp: (email: string) => Promise<void>;
  logout: () => void;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  updateProfile: (patch: { name?: string; email?: string; studentId?: string }) => Promise<User>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  confirmEmailVerification: (otp: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

type Pending = { name: string; email: string; studentId: string; password: string; otp: string; expiresAt: number };
const PENDING_KEY = "ns_pending_reg";
const EMAIL_OTP_KEY = "ns_email_otp";

function genOtp() { return String(Math.floor(100000 + Math.random() * 900000)); }
function readPending(): Pending[] { try { return JSON.parse(localStorage.getItem(PENDING_KEY) ?? "[]"); } catch { return []; } }
function writePending(p: Pending[]) { localStorage.setItem(PENDING_KEY, JSON.stringify(p)); }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => setUser(authApi.current()), []);

  const login: AuthCtx["login"] = async (email, password) => {
    const u = authApi.login(email, password);
    setUser(u);
    return u;
  };
  const beginRegister: AuthCtx["beginRegister"] = async (data) => {
    // Ensure email isn't already registered (checked later too, but fail fast)
    const existing = readPending().filter((p) => p.email !== data.email);
    const otp = genOtp();
    existing.push({ ...data, otp, expiresAt: Date.now() + 10 * 60_000 });
    writePending(existing);
    // Simulated email: surface OTP so the user can proceed in this demo
    toast.success(`OTP sent to ${data.email}`, { description: `Demo code: ${otp}`, duration: 10000 });
    // eslint-disable-next-line no-console
    console.info(`[OTP] ${data.email}: ${otp}`);
    return { email: data.email };
  };
  const completeRegister: AuthCtx["completeRegister"] = async (email, otp) => {
    const all = readPending();
    const p = all.find((x) => x.email === email);
    if (!p) throw new Error("No pending registration for this email");
    if (Date.now() > p.expiresAt) throw new Error("OTP expired — please request a new one");
    if (p.otp !== otp.trim()) throw new Error("Invalid OTP");
    const u = authApi.register({ name: p.name, email: p.email, studentId: p.studentId, password: p.password });
    writePending(all.filter((x) => x.email !== email));
    setUser(u);
    return u;
  };
  const resendOtp: AuthCtx["resendOtp"] = async (email) => {
    const all = readPending();
    const i = all.findIndex((x) => x.email === email);
    if (i === -1) throw new Error("No pending registration — please sign up again");
    const otp = genOtp();
    all[i].otp = otp;
    all[i].expiresAt = Date.now() + 10 * 60_000;
    writePending(all);
    toast.success(`OTP resent`, { description: `Demo code: ${otp}`, duration: 10000 });
    console.info(`[OTP resend] ${email}: ${otp}`);
  };
  const logout = () => {
    authApi.logout();
    setUser(null);
  };
  const resetPassword: AuthCtx["resetPassword"] = async (email, newPassword) => {
    authApi.resetPassword(email, newPassword);
  };
  const updateProfile: AuthCtx["updateProfile"] = async (patch) => {
    if (!user) throw new Error("Not signed in");
    const u = authApi.updateProfile(user.id, patch);
    setUser(u);
    return u;
  };
  const changePassword: AuthCtx["changePassword"] = async (cur, next) => {
    if (!user) throw new Error("Not signed in");
    authApi.changePassword(user.id, cur, next);
  };
  const sendEmailVerification: AuthCtx["sendEmailVerification"] = async () => {
    if (!user) throw new Error("Not signed in");
    const otp = genOtp();
    const map = JSON.parse(localStorage.getItem(EMAIL_OTP_KEY) ?? "{}");
    map[user.id] = { otp, expiresAt: Date.now() + 10 * 60_000 };
    localStorage.setItem(EMAIL_OTP_KEY, JSON.stringify(map));
    const target = user.pendingEmail ?? user.email;
    toast.success(`Verification code sent to ${target}`, { description: `Demo code: ${otp}`, duration: 10000 });
    console.info(`[Verify OTP] ${target}: ${otp}`);
  };
  const confirmEmailVerification: AuthCtx["confirmEmailVerification"] = async (otp) => {
    if (!user) throw new Error("Not signed in");
    const map = JSON.parse(localStorage.getItem(EMAIL_OTP_KEY) ?? "{}");
    const entry = map[user.id];
    if (!entry) throw new Error("No pending verification — request a code first");
    if (Date.now() > entry.expiresAt) throw new Error("Code expired — request a new one");
    if (entry.otp !== otp.trim()) throw new Error("Invalid code");
    authApi.verifyEmail(user.id);
    delete map[user.id];
    localStorage.setItem(EMAIL_OTP_KEY, JSON.stringify(map));
    setUser(authApi.current());
  };

  return (
    <Ctx.Provider
      value={{
        user, login, beginRegister, completeRegister, resendOtp, logout, resetPassword,
        updateProfile, changePassword, sendEmailVerification, confirmEmailVerification,
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