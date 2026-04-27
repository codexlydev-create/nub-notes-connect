import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, GraduationCap, Mail, Lock, User, IdCard, ArrowRight, KeyRound, Building2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { taxonomyApi } from "@/lib/taxonomyApi";
import { DEPARTMENTS as SEED_DEPTS } from "@/data/seed";

type Mode = "login" | "register" | "forgot" | "verify";

const registerSchema = z.object({
  name: z.string().trim().min(2, "Name too short").max(80),
  email: z.string().trim().email("Invalid email"),
  studentId: z.string().trim().min(3, "Student ID required").max(40),
  department: z.string().trim().min(1, "Please select your department").max(120),
  password: z.string().min(6, "At least 6 characters").max(100),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { path: ["confirm"], message: "Passwords do not match" });

export default function Auth({ mode: initial = "login" as Mode }: { mode?: Mode }) {
  const [mode, setMode] = useState<Mode>(initial);
  const { login, beginRegister, completeRegister, resendOtp, sendResetOtp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", studentId: "", department: "", password: "", confirm: "", otp: "" });
  const [loading, setLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState<string>("");
  const [departments, setDepartments] = useState<string[]>(SEED_DEPTS);

  useEffect(() => {
    taxonomyApi.list().then((t) => setDepartments(t.departments)).catch(() => {});
  }, []);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        await login(form.email, form.password);
        toast.success("Welcome back!");
        navigate("/dashboard");
      } else if (mode === "register") {
        const parsed = registerSchema.safeParse(form);
        if (!parsed.success) { toast.error(parsed.error.errors[0].message); return; }
        await beginRegister({ name: form.name, email: form.email, studentId: form.studentId, password: form.password });
        setPendingEmail(form.email);
        toast.success(`OTP sent to ${form.email}`);
        setMode("verify");
      } else if (mode === "verify") {
        if (!form.otp || form.otp.length < 4) { toast.error("Enter the 6-digit OTP"); return; }
        await completeRegister({
          name: form.name, email: pendingEmail || form.email,
          studentId: form.studentId, department: form.department,
          password: form.password, otp: form.otp,
        });
        toast.success("Email verified — welcome!");
        navigate("/dashboard");
      } else {
        // forgot: requires email + otp + new password
        if (!form.email || form.password.length < 6 || form.otp.length !== 6) {
          toast.error("Email, 6-digit OTP and new password (min 6 chars) required");
          return;
        }
        await resetPassword(form.email, form.otp, form.password);
        toast.success("Password reset. You can now sign in.");
        setMode("login");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card border border-border shadow-elegant p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-elegant">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <div className="font-bold text-lg">Note Share</div>
              <div className="text-xs text-muted-foreground">
                {mode === "login" ? "Welcome back"
                  : mode === "register" ? "Create your account"
                  : mode === "verify" ? "Verify your email"
                  : "Reset your password"}
              </div>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div key="reg-fields" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 overflow-hidden">
                  <Input icon={User} placeholder="Full name" value={form.name} onChange={(v) => set("name", v)} />
                  <Input icon={IdCard} placeholder="Student ID (e.g. NUB-CSE-2401)" value={form.studentId} onChange={(v) => set("studentId", v)} />
                  <SelectField icon={Building2} value={form.department} onChange={(v) => set("department", v)}>
                    <option value="">Select your department</option>
                    {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                  </SelectField>
                </motion.div>
              )}
            </AnimatePresence>

            {mode !== "verify" && (
              <>
                <Input icon={Mail} type="email" placeholder="Email" value={form.email} onChange={(v) => set("email", v)} />
                <Input icon={Lock} type={show ? "text" : "password"} placeholder={mode === "forgot" ? "New password" : "Password"} value={form.password} onChange={(v) => set("password", v)}
                  trailing={<button type="button" onClick={() => setShow((s) => !s)} className="text-muted-foreground hover:text-foreground">{show ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>}
                />
              </>
            )}

            {mode === "verify" && (
              <>
                <div className="text-xs text-muted-foreground text-center">
                  We sent a 6-digit code to <span className="font-semibold text-foreground">{pendingEmail}</span>.
                </div>
                <Input icon={KeyRound} placeholder="Enter 6-digit OTP" value={form.otp} onChange={(v) => set("otp", v)} />
                <div className="text-right">
                  <button type="button" onClick={async () => { try { await resendOtp(pendingEmail); } catch (e: any) { toast.error(e?.message); } }} className="text-xs text-primary font-medium hover:underline">Resend code</button>
                </div>
              </>
            )}

            <AnimatePresence>
              {mode === "register" && (
                <motion.div key="confirm" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                  <Input icon={Lock} type={show ? "text" : "password"} placeholder="Confirm password" value={form.confirm} onChange={(v) => set("confirm", v)} />
                </motion.div>
              )}
            </AnimatePresence>

            {mode === "login" && (
              <div className="text-right">
                <button type="button" onClick={() => setMode("forgot")} className="text-xs text-primary font-medium hover:underline">Forgot password?</button>
              </div>
            )}

            {mode === "forgot" && (
              <div className="space-y-3">
                <Input icon={KeyRound} placeholder="6-digit code from your email" value={form.otp} onChange={(v) => set("otp", v)} />
                <button
                  type="button"
                  onClick={async () => { try { await sendResetOtp(form.email); toast.success(`Reset code sent to ${form.email}`); } catch (e: any) { toast.error(e?.message ?? "Could not send code"); } }}
                  className="text-xs text-primary font-medium hover:underline"
                >Send / resend reset code</button>
              </div>
            )}

            <button
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading ? "Please wait…"
                : mode === "login" ? "Sign In"
                : mode === "register" ? "Send OTP"
                : mode === "verify" ? "Verify & continue"
                : "Reset password"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-muted-foreground">
            {mode === "login" && <>New here? <button className="text-primary font-semibold hover:underline" onClick={() => setMode("register")}>Create an account</button></>}
            {mode === "register" && <>Already have an account? <button className="text-primary font-semibold hover:underline" onClick={() => setMode("login")}>Sign in</button></>}
            {mode === "verify" && <><button className="text-primary font-semibold hover:underline" onClick={() => setMode("register")}>← Use a different email</button></>}
            {mode === "forgot" && <><button className="text-primary font-semibold hover:underline" onClick={() => setMode("login")}>Back to sign in</button></>}
          </div>
        </motion.div>

        <div className="text-center text-xs text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← Back to home</Link>
        </div>
      </div>
    </div>
  );
}

function Input({ icon: Icon, trailing, type = "text", ...p }: any) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <input
        type={type}
        value={p.value}
        onChange={(e) => p.onChange(e.target.value)}
        placeholder={p.placeholder}
        className="w-full pl-10 pr-10 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
      />
      {trailing && <div className="absolute right-3.5 top-1/2 -translate-y-1/2">{trailing}</div>}
    </div>
  );
}

function SelectField({ icon: Icon, value, onChange, children }: { icon: any; value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full pl-10 pr-3 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition appearance-none"
      >
        {children}
      </select>
    </div>
  );
}