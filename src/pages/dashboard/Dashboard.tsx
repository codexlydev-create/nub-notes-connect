import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, Eye, ThumbsUp, ThumbsDown, Bookmark, X, Upload, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { notesApi } from "@/lib/notesApi";
import { Skeleton } from "@/components/ui/skeleton";
import { DEPARTMENTS, COURSES_BY_DEPT } from "@/data/seed";
import type { Note } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = () => {
    setLoading(true);
    notesApi.myUploads().then((r) => setItems(r.items)).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  if (authLoading) {
    return <div className="space-y-4"><Skeleton className="h-12 w-64" /><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}</div></div>;
  }
  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">You need to sign in</h2>
        <p className="text-muted-foreground mb-4">Login to access your dashboard.</p>
        <button onClick={() => navigate("/login")} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Sign in</button>
      </div>
    );
  }

  const stats = useMemo(() => [
    { l: "My notes", v: items.length },
    { l: "Total views", v: items.reduce((a, n) => a + n.views, 0) },
    { l: "Likes", v: items.reduce((a, n) => a + n.likes, 0) },
    { l: "Saves", v: items.reduce((a, n) => a + n.saves, 0) },
  ], [items]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your uploads, {user.name.split(" ")[0]}.</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90">
          <Plus className="w-4 h-4" /> Upload Notes
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl bg-card border border-border p-4 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="text-2xl font-bold text-gradient mt-1">{loading ? <Skeleton className="h-7 w-12" /> : s.v}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4"><FileText className="w-7 h-7 text-muted-foreground" /></div>
          <div className="font-semibold mb-1">No uploads yet</div>
          <div className="text-sm text-muted-foreground mb-4">Share your first slide or hand-notes with the community.</div>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Upload now</button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((n) => (
            <div key={n.id} className="rounded-2xl bg-card border border-border p-5 shadow-card">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-1 rounded-lg bg-gradient-primary text-primary-foreground text-[11px] font-bold">{n.courseCode}</span>
                <span className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-[10px] font-semibold">{n.type}</span>
              </div>
              <h3 className="font-semibold leading-snug mb-3 line-clamp-2">{n.title}</h3>
              <div className="grid grid-cols-4 gap-1 text-[11px] text-muted-foreground mb-4">
                <Stat icon={Eye} v={n.views} /><Stat icon={ThumbsUp} v={n.likes} /><Stat icon={ThumbsDown} v={n.dislikes} /><Stat icon={Bookmark} v={n.saves} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setEditing(n); setShowModal(true); }} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium">
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button onClick={() => setConfirmDelete(n)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <UploadModal existing={editing} onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); refresh(); }} />
        )}
        {confirmDelete && (
          <ConfirmDeleteModal note={confirmDelete} loading={deleting} onCancel={() => setConfirmDelete(null)}
            onConfirm={async () => {
              setDeleting(true);
              try { await notesApi.remove(confirmDelete.id); toast.success("Note deleted"); setConfirmDelete(null); refresh(); }
              catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
              finally { setDeleting(false); }
            }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, v }: any) {
  return <div className="flex items-center gap-1"><Icon className="w-3 h-3" /> {v}</div>;
}

function ConfirmDeleteModal({ note, loading, onCancel, onConfirm }: { note: Note; loading: boolean; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-card border border-border shadow-elegant p-6">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center"><Trash2 className="w-5 h-5" /></div>
          <div><h3 className="text-lg font-bold mb-1">Delete this note?</h3><p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">"{note.title}"</span> will be permanently removed.</p></div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} disabled={loading} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium disabled:opacity-60">Cancel</button>
          <button onClick={onConfirm} disabled={loading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 text-sm font-semibold disabled:opacity-60">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Yes, delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UploadModal({ existing, onClose, onSaved }: { existing: Note | null; onClose: () => void; onSaved: () => void }) {
  const initialDept = existing?.department ?? DEPARTMENTS[0];
  const initialCourseList = COURSES_BY_DEPT[initialDept] ?? [];
  const isCustomDept = !!existing && !DEPARTMENTS.includes(existing.department);
  const isCustomCourse = !!existing && initialCourseList.length > 0 && !initialCourseList.includes(existing.course);
  const [deptChoice, setDeptChoice] = useState(isCustomDept ? "Others" : initialDept);
  const [courseChoice, setCourseChoice] = useState(isCustomDept || isCustomCourse ? "Others" : (existing?.course ?? initialCourseList[0] ?? ""));
  const [f, setF] = useState({
    title: existing?.title ?? "", department: existing?.department ?? initialDept,
    course: existing?.course ?? initialCourseList[0] ?? "",
    courseCode: existing?.courseCode ?? "", description: existing?.description ?? "",
    type: (existing?.type ?? "Slide") as "Slide" | "Hand Notes",
  });
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const courses = deptChoice === "Others" ? [] : (COURSES_BY_DEPT[deptChoice] ?? []);
  const MAX_BYTES = 25 * 1024 * 1024;

  const handleDept = (v: string) => {
    setDeptChoice(v);
    if (v === "Others") { setF((p) => ({ ...p, department: "", course: "" })); setCourseChoice("Others"); }
    else { const first = COURSES_BY_DEPT[v]?.[0] ?? ""; setF((p) => ({ ...p, department: v, course: first })); setCourseChoice(first); }
  };
  const handleCourse = (v: string) => { setCourseChoice(v); setF((p) => ({ ...p, course: v === "Others" ? "" : v })); };

  const onFile = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") { toast.error("PDF files only"); return; }
    if (file.size > MAX_BYTES) { toast.error("Max 25 MB"); return; }
    setFile(file);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title || !f.courseCode || !f.department.trim() || !f.course.trim() || !f.description.trim()) { toast.error("Please fill all required fields"); return; }
    if (!existing && !file) { toast.error("PDF file is required"); return; }
    setSubmitting(true);
    try {
      if (existing) {
        await notesApi.update(existing.id, f);
        toast.success("Updated");
      } else {
        const fd = new FormData();
        Object.entries(f).forEach(([k, v]) => fd.append(k, String(v)));
        if (file) fd.append("file", file);
        await notesApi.create(fd);
        toast.success("Uploaded!");
      }
      onSaved();
    } catch (err: any) {
      toast.error(err?.message ?? "Save failed");
    } finally { setSubmitting(false); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.95, y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="w-full max-w-xl rounded-3xl bg-card border border-border shadow-elegant p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{existing ? "Edit note" : "Upload notes"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Field label="Title"><input className="inp" required value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Department">
              <select className="inp" required value={deptChoice} onChange={(e) => handleDept(e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}<option value="Others">Others</option>
              </select>
              {deptChoice === "Others" && <input className="inp mt-2" required placeholder="Department name" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />}
            </Field>
            <Field label="Course">
              <select className="inp" required value={courseChoice} onChange={(e) => handleCourse(e.target.value)} disabled={deptChoice !== "Others" && courses.length === 0}>
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}<option value="Others">Others</option>
              </select>
              {courseChoice === "Others" && <input className="inp mt-2" required placeholder="Course name" value={f.course} onChange={(e) => setF({ ...f, course: e.target.value })} />}
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Course Code"><input className="inp" required placeholder="CSE 2101" value={f.courseCode} onChange={(e) => setF({ ...f, courseCode: e.target.value })} /></Field>
            <Field label="Type">
              <select className="inp" required value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as any })}>
                <option>Slide</option><option>Hand Notes</option>
              </select>
            </Field>
          </div>
          <Field label="Description"><textarea className="inp min-h-[90px]" required value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
          {!existing && (
            <Field label="File (PDF)">
              <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer">
                <Upload className="w-5 h-5 text-muted-foreground" />
                <div className="text-sm flex-1 min-w-0"><div className="font-medium truncate">{file ? file.name : "Click to upload PDF"}</div><div className="text-xs text-muted-foreground">PDF only · max 25 MB{file ? ` · ${(file.size / 1024).toFixed(0)} KB` : ""}</div></div>
                <input type="file" accept="application/pdf" required={!existing} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
              </label>
            </Field>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium disabled:opacity-60">Cancel</button>
            <button disabled={submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 text-sm disabled:opacity-60">
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {existing ? "Save changes" : "Upload"}
            </button>
          </div>
        </form>
        <style>{`.inp { width:100%; padding:0.6rem 0.9rem; border-radius: 0.75rem; border:1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 0.875rem; outline: none; }
        .inp:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }`}</style>
      </motion.div>
    </motion.div>
  );
}

function Field({ label, children }: any) {
  return <div><label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>{children}</div>;
}