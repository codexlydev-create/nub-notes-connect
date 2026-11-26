import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, IdCard, User as UserIcon, BadgeCheck, Lock, ShieldAlert, KeyRound, Eye, EyeOff, Building2, Camera, Trash2, Loader2, ExternalLink, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { taxonomyApi } from "@/lib/taxonomyApi";
import { DEPARTMENTS } from "@/data/seed";
import UserAvatar from "@/components/UserAvatar";
import { uploadsApi, putToPresignedUrl } from "@/lib/uploadsApi";
import { publicContactSchema } from "@/lib/communitySchemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const AVATAR_MAX_BYTES = 1 * 1024 * 1024;
const AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export default function Profile() {
  const { user, loading: authLoading, updateProfile, deleteAvatar, changePassword, requestEmailChange, confirmEmailChange } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", studentId: "", department: "" });
  const [departments, setDepartments] = useState<string[]>([...DEPARTMENTS].sort());
  const [customDept, setCustomDept] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [contactForm, setContactForm] = useState({ platformName: "", platformUrl: "" });
  const [contactEditing, setContactEditing] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);

  // Only redirect once auth has finished hydrating — otherwise a refresh
  // briefly shows `user === null` and kicks the user to /login.
  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    setForm({
      name: user.name,
      email: user.email,
      studentId: user.studentId,
      department: user.department ?? "",
    });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    taxonomyApi.list()
      .then((t) => setDepartments(t.departments))
      .catch(() => {});
  }, []);

  if (authLoading || !user) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-sm text-muted-foreground">
        Loading your profile…
      </div>
    );
  }

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const isOtherDept = form.department === "__other__";
    const finalDepartment = isOtherDept ? customDept.trim() : form.department;
    if (isOtherDept && !finalDepartment) {
      toast.error("Please enter your department name");
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        studentId: form.studentId,
        department: finalDepartment,
      });
      // Persist newly entered department to taxonomy.
      if (isOtherDept && finalDepartment) {
        try { await taxonomyApi.add({ kind: "department", name: finalDepartment }); } catch {}
        setCustomDept("");
        setForm((f) => ({ ...f, department: finalDepartment }));
      }
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

  const editPublicContact = () => {
    setContactForm({
      platformName: user.publicContact?.platformName ?? "",
      platformUrl: user.publicContact?.platformUrl ?? "",
    });
    setContactEditing(true);
  };

  const cancelPublicContact = () => {
    setContactForm({
      platformName: user.publicContact?.platformName ?? "",
      platformUrl: user.publicContact?.platformUrl ?? "",
    });
    setContactEditing(false);
  };

  const savePublicContact = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = publicContactSchema.safeParse(contactForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check the public contact details");
      return;
    }
    setContactSaving(true);
    try {
      await updateProfile({ publicContact: parsed.data });
      setContactEditing(false);
      toast.success("Public contact saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not save public contact");
    } finally {
      setContactSaving(false);
    }
  };

  const removePublicContact = async () => {
    if (!user.publicContact || !window.confirm("Remove your public contact link?")) return;
    setContactSaving(true);
    try {
      await updateProfile({ publicContact: null });
      setContactEditing(false);
      setContactForm({ platformName: "", platformUrl: "" });
      toast.success("Public contact removed");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not remove public contact");
    } finally {
      setContactSaving(false);
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

  async function handlePickPhoto(file: File | null) {
    if (!file || !user) return;
    if (!AVATAR_TYPES.has(file.type)) {
      return toast.error("Please choose a JPG, PNG or WebP image");
    }
    if (file.size > AVATAR_MAX_BYTES) {
      return toast.error("Image must be 1 MB or smaller");
    }
    setPhotoBusy(true);
    try {
      const { uploadUrl, fileUrl, key } = await uploadsApi.presignAvatar({
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });
      await putToPresignedUrl(uploadUrl, file);
      await updateProfile({ avatarUrl: fileUrl, avatarKey: key });
      toast.success("Profile photo updated");
    } catch (err: any) {
      toast.error(err?.message || "Could not upload photo");
    } finally {
      setPhotoBusy(false);
      if (photoRef.current) photoRef.current.value = "";
    }
  }

  async function handleDeletePhoto() {
    if (!user?.avatarUrl) return;
    setPhotoBusy(true);
    try {
      await deleteAvatar();
      toast.success("Profile photo removed");
    } catch (err: any) {
      toast.error(err?.message || "Could not remove photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-card border border-border shadow-elegant p-6 md:p-8 mb-6"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative shrink-0">
            <UserAvatar
              name={user.name}
              photoUrl={user.avatarUrl}
              rounded="2xl"
              className="w-20 h-20 shadow-elegant"
              textClass="text-2xl"
            />
            <button
              type="button"
              onClick={() => photoRef.current?.click()}
              disabled={photoBusy}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground border-2 border-card flex items-center justify-center shadow-soft hover:opacity-90 disabled:opacity-60"
              aria-label="Change profile photo"
              title="Change profile photo"
            >
              {photoBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            </button>
            <input
              ref={photoRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => handlePickPhoto(e.target.files?.[0] ?? null)}
            />
          </div>
          <div className="min-w-0 flex-1">
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
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                disabled={photoBusy}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-muted disabled:opacity-60"
              >
                <Camera className="w-3.5 h-3.5" /> {user.avatarUrl ? "Change photo" : "Upload photo"}
              </button>
              {user.avatarUrl && (
                <button
                  type="button"
                  onClick={handleDeletePhoto}
                  disabled={photoBusy}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-semibold text-destructive hover:bg-destructive/10 disabled:opacity-60"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              )}
              <span className="text-[11px] text-muted-foreground">JPG/PNG/WebP · max 1 MB · 400×400+ recommended</span>
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
            <Label>Department</Label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <select
                value={departments.includes(form.department) || form.department === "" || form.department === "__other__" ? form.department : "__other__"}
                onChange={(e) => {
                  const v = e.target.value;
                  setForm({ ...form, department: v });
                  if (v !== "__other__") setCustomDept("");
                  else if (!departments.includes(form.department) && form.department) setCustomDept(form.department);
                }}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition appearance-none"
              >
                <option value="">Select department</option>
                {departments.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="__other__">Others (enter manually)</option>
              </select>
            </div>
            {form.department === "__other__" && (
              <input
                value={customDept}
                onChange={(e) => setCustomDept(e.target.value)}
                placeholder="Enter your department"
                maxLength={120}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-border bg-background text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
              />
            )}
          </div>
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
        className="rounded-3xl bg-card border border-border shadow-card p-6 md:p-8 mb-6"
      >
        <h2 className="text-lg font-bold mb-1">Public contact</h2>
        <p className="text-sm text-muted-foreground mb-5">This link is visible to everyone on the Contributors page.</p>
        {contactEditing ? (
          <form onSubmit={savePublicContact} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="public-platform-name" className="text-sm font-medium">Platform name</label>
              <Input id="public-platform-name" value={contactForm.platformName} maxLength={60} required placeholder="e.g. LinkedIn" onChange={(event) => setContactForm((current) => ({ ...current, platformName: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <label htmlFor="public-platform-url" className="text-sm font-medium">Platform URL</label>
              <Input id="public-platform-url" type="url" value={contactForm.platformUrl} maxLength={2048} required placeholder="https://…" onChange={(event) => setContactForm((current) => ({ ...current, platformUrl: event.target.value }))} />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button type="button" variant="outline" onClick={cancelPublicContact} disabled={contactSaving}>Cancel</Button>
              <Button type="submit" disabled={contactSaving}>
                {contactSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {contactSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        ) : user.publicContact ? (
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <a href={user.publicContact.platformUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-2 font-medium text-primary hover:underline">
              <span className="truncate">{user.publicContact.platformName}</span>
              <ExternalLink className="h-4 w-4 shrink-0" />
            </a>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={editPublicContact}><Pencil /> Edit</Button>
              <Button type="button" variant="outline" className="text-destructive" onClick={() => void removePublicContact()} disabled={contactSaving}>
                {contactSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />} Remove
              </Button>
            </div>
          </div>
        ) : (
          <Button type="button" variant="outline" onClick={editPublicContact}>Add public contact</Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
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