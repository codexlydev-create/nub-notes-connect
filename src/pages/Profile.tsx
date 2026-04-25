import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, IdCard, User as UserIcon, BadgeCheck, Lock, ShieldAlert, KeyRound, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Profile() {
  const { user, updateProfile, changePassword, requestEmailChange, confirmEmailChange } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", studentId: "" });
  const [emailSaving, setEmailSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    if (!user) { navigate("/login", { replace: true }); return; }
    setForm({ name: user.name, email: user.email, studentId: user.studentId });
  }, [user, navigate]);

  if (!user) return null;

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name: form.name, studentId: form.studentId });
      // If email changed, trigger an email-change verification flow.
      if (user && form.email && form.email !== user.email) {
        setEmailSaving(true);
        await requestEmailChange(form.email);
        toast.success(`Verification code sent to ${form.email}`);
        setOtpSent(true);
      } else {
        toast.success("Profile updated");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Could not update profile");
    } finally {
      setSaving(false);
      setEmailSaving(false);
    }
  };

  const sendOtp = async () => {
    try {
      if (!user?.pendingEmail) { toast.error("Save a new email first"); return; }
      await requestEmailChange(user.pendingEmail);
      setOtpSent(true);
      toast.success(`Code sent to ${user.pendingEmail}`);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not send code");
    }
  };

  const confirmOtp = async () => {
    try {
      await confirmEmailChange(otp);
      toast.success("Email verified");
      setOtp(""); setOtpSent(false);
    } catch (err: any) {
      toast.error(err?.message ?? "Invalid code");
    }
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) { toast.error("New password must be at least 6 characters"); return; }
    if (pw.next !== pw.confirm) { toast.error("Passwords do not match"); return; }
    setPwSaving(true);
    try {
      await changePassword(pw.current, pw.next);
      toast.success("Password changed");
      setPw({ current: "", next: "", confirm: "" });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not change password");
    } finally {
      setPwSaving(false);
    }
  };

  const initials = user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-card border border-border shadow-elegant p-6 md:p-8 mb-6"
      >
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-elegant">
            {initials}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{user.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span className="truncate">{user.email}</span>
              {user.emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  <BadgeCheck className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  <ShieldAlert className="w-3 h-3" /> Unverified
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="rounded-3xl bg-card border border-border shadow-card p-6 md:p-8 mb-6"
      >
        <h2 className="text-lg font-bold mb-1">Account details</h2>
        <p className="text-sm text-muted-foreground mb-5">Update your personal information.</p>

        {user.pendingEmail && (
          <div className="mb-5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-4 text-sm">
            <div className="flex gap-3">
              <ShieldAlert className="w-5 h-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-foreground">Verify your new email</div>
                <div className="text-muted-foreground mt-0.5">
                  You requested to change your email to <span className="font-medium text-foreground">{user.pendingEmail}</span>. Until you verify it, you still have to log in with{" "}
                  <span className="font-medium text-foreground">"{user.email}"</span>. The new address won't be saved to your account until verification is complete.
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={saveProfile} className="space-y-4">
          <LabeledInput icon={UserIcon} label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <LabeledInput icon={IdCard} label="Student ID" value={form.studentId} onChange={(v) => setForm({ ...form, studentId: v })} />
          <div>
            <Label>Email address</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full pl-10 pr-28 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {user.emailVerified && form.email === user.email ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {user.pendingEmail && form.email === user.pendingEmail ? "Pending" : "Unverified"}
                  </span>
                )}
              </div>
            </div>
            {(!user.emailVerified || user.pendingEmail) && (form.email === user.email || form.email === user.pendingEmail) && (
              <div className="mt-3 rounded-xl border border-border p-3 bg-muted/30">
                {!otpSent ? (
                  <button type="button" onClick={sendOtp} className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-2">
                    <KeyRound className="w-4 h-4" /> {user.pendingEmail ? `Send code to ${user.pendingEmail}` : "Send verification code"}
                  </button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit code"
                      className="flex-1 min-w-[140px] px-3 py-2 rounded-lg border border-border bg-background text-sm outline-none focus:border-primary"
                    />
                    <button type="button" onClick={confirmOtp} className="px-4 py-2 rounded-lg bg-gradient-primary text-primary-foreground text-sm font-semibold">Verify</button>
                    <button type="button" onClick={sendOtp} className="text-xs text-primary font-medium hover:underline">Resend</button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button disabled={saving} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 disabled:opacity-60">
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="rounded-3xl bg-card border border-border shadow-card p-6 md:p-8"
      >
        <h2 className="text-lg font-bold mb-1">Change password</h2>
        <p className="text-sm text-muted-foreground mb-5">Enter your current password to change it.</p>
        <form onSubmit={savePassword} className="space-y-4">
          <PwInput icon={Lock} label="Current password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} show={showPw} setShow={setShowPw} />
          <PwInput icon={Lock} label="New password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} show={showPw} setShow={setShowPw} />
          <PwInput icon={Lock} label="Confirm new password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} show={showPw} setShow={setShowPw} />
          <div className="flex justify-end">
            <button disabled={pwSaving} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 disabled:opacity-60">
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{children}</label>;
}

function LabeledInput({ icon: Icon, label, value, onChange }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
        />
      </div>
    </div>
  );
}

function PwInput({ icon: Icon, label, value, onChange, show, setShow }: any) {
  return (
    <div>
      <Label>{label}</Label>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
        />
        <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}