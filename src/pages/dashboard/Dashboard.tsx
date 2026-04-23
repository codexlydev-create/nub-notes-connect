import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit3, Trash2, Eye, ThumbsUp, ThumbsDown, Bookmark, X, Upload, ChevronLeft, ChevronRight, FileText } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { notesApi } from "@/lib/store";
import { DEPARTMENTS, COURSES_BY_DEPT } from "@/data/seed";
import type { Note } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const PER_PAGE = 6;

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">You need to sign in</h2>
        <p className="text-muted-foreground mb-4">Login to access your dashboard.</p>
        <button onClick={() => navigate("/login")} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Sign in</button>
      </div>
    );
  }

  const myNotes = useMemo(() => notesApi.list().filter((n) => n.uploadedById === user.id), [user.id, tick]);
  const totalPages = Math.max(1, Math.ceil(myNotes.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = myNotes.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const refresh = () => setTick((t) => t + 1);

  const stats = [
    { l: "My notes", v: myNotes.length },
    { l: "Total views", v: myNotes.reduce((a, n) => a + n.views, 0) },
    { l: "Likes", v: myNotes.reduce((a, n) => a + n.likes, 0) },
    { l: "Saves", v: myNotes.reduce((a, n) => a + n.saves, 0) },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your uploads, {user.name.split(" ")[0]}.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Upload Notes
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.l} className="rounded-2xl bg-card border border-border p-4 shadow-card">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="text-2xl font-bold text-gradient mt-1">{s.v}</div>
          </div>
        ))}
      </div>

      {myNotes.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
            <FileText className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="font-semibold mb-1">No uploads yet</div>
          <div className="text-sm text-muted-foreground mb-4">Share your first slide or hand-notes with the community.</div>
          <button onClick={() => setShowModal(true)} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Upload now</button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {pageItems.map((n) => (
              <div key={n.id} className="rounded-2xl bg-card border border-border p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-1 rounded-lg bg-gradient-primary text-primary-foreground text-[11px] font-bold">{n.courseCode}</span>
                  <span className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-[10px] font-semibold">{n.type}</span>
                </div>
                <h3 className="font-semibold leading-snug mb-3 line-clamp-2">{n.title}</h3>
                <div className="grid grid-cols-4 gap-1 text-[11px] text-muted-foreground mb-4">
                  <Stat icon={Eye} v={n.views} />
                  <Stat icon={ThumbsUp} v={n.likes} />
                  <Stat icon={ThumbsDown} v={n.dislikes} />
                  <Stat icon={Bookmark} v={n.saves} />
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
              <div className="text-sm font-medium px-3">{currentPage} / {totalPages}</div>
              <button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {showModal && (
          <UploadModal
            existing={editing}
            onClose={() => setShowModal(false)}
            onSaved={() => { setShowModal(false); refresh(); }}
            user={user}
          />
        )}
        {confirmDelete && (
          <ConfirmDeleteModal
            note={confirmDelete}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={() => {
              notesApi.remove(confirmDelete.id);
              toast.success("Note deleted");
              setConfirmDelete(null);
              refresh();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ icon: Icon, v }: any) {
  return <div className="flex items-center gap-1"><Icon className="w-3 h-3" /> {v}</div>;
}

function ConfirmDeleteModal({ note, onCancel, onConfirm }: { note: Note; onCancel: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-3xl bg-card border border-border shadow-elegant p-6"
        role="alertdialog"
        aria-modal="true"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold mb-1">Delete this note?</h3>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">"{note.title}"</span> will be permanently removed. This action can't be undone.
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium">Cancel</button>
          <button onClick={onConfirm} className="px-5 py-2.5 rounded-xl bg-destructive text-destructive-foreground hover:opacity-90 text-sm font-semibold">Yes, delete</button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UploadModal({ existing, onClose, onSaved, user }: any) {
  const initialDept = existing?.department ?? DEPARTMENTS[0];
  const initialCourseList = COURSES_BY_DEPT[initialDept] ?? [];
  const isCustomDeptInitially = existing && !DEPARTMENTS.includes(existing.department);
  const isCustomCourseInitially = existing && initialCourseList.length > 0 && !initialCourseList.includes(existing.course);

  const [deptChoice, setDeptChoice] = useState<string>(isCustomDeptInitially ? "Others" : initialDept);
  const [courseChoice, setCourseChoice] = useState<string>(
    isCustomDeptInitially || isCustomCourseInitially ? "Others" : (existing?.course ?? initialCourseList[0] ?? "")
  );
  const [f, setF] = useState({
    title: existing?.title ?? "",
    department: existing?.department ?? initialDept,
    course: existing?.course ?? initialCourseList[0] ?? "",
    courseCode: existing?.courseCode ?? "",
    description: existing?.description ?? "",
    type: (existing?.type ?? "Slide") as "Slide" | "Hand Notes",
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const courses = deptChoice === "Others" ? [] : (COURSES_BY_DEPT[deptChoice] ?? []);

  const handleDeptChange = (v: string) => {
    setDeptChoice(v);
    if (v === "Others") {
      setF((p) => ({ ...p, department: "", course: "" }));
      setCourseChoice("Others");
    } else {
      const first = COURSES_BY_DEPT[v]?.[0] ?? "";
      setF((p) => ({ ...p, department: v, course: first }));
      setCourseChoice(first);
    }
  };
  const handleCourseChange = (v: string) => {
    setCourseChoice(v);
    if (v === "Others") setF((p) => ({ ...p, course: "" }));
    else setF((p) => ({ ...p, course: v }));
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.title || !f.courseCode) { toast.error("Title and course code are required"); return; }
    if (!f.department.trim()) { toast.error("Department is required"); return; }
    if (!f.course.trim()) { toast.error("Course is required"); return; }
    if (!f.description.trim()) { toast.error("Description is required"); return; }
    if (!existing && !fileName) { toast.error("PDF file is required"); return; }
    if (existing) {
      notesApi.update(existing.id, { ...f });
      toast.success("Updated");
    } else {
      notesApi.create({
        id: "n_" + Date.now(),
        ...f,
        uploadedBy: user.name,
        uploadedById: user.id,
        views: 0, likes: 0, dislikes: 0, saves: 0,
        createdAt: new Date().toISOString(),
      });
      toast.success("Uploaded!");
    }
    onSaved();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-3xl bg-card border border-border shadow-elegant p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">{existing ? "Edit note" : "Upload notes"}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <F label="Title"><input className="inp" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></F>
          <div className="grid grid-cols-2 gap-3">
            <F label="Department">
              <select className="inp" value={deptChoice} onChange={(e) => handleDeptChange(e.target.value)}>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                <option value="Others">Others</option>
              </select>
              {deptChoice === "Others" && (
                <input
                  className="inp mt-2"
                  placeholder="Enter department name"
                  value={f.department}
                  onChange={(e) => setF({ ...f, department: e.target.value })}
                />
              )}
            </F>
            <F label="Course">
              <select
                className="inp"
                value={courseChoice}
                onChange={(e) => handleCourseChange(e.target.value)}
                disabled={deptChoice !== "Others" && courses.length === 0}
              >
                {courses.map((c) => <option key={c} value={c}>{c}</option>)}
                <option value="Others">Others</option>
              </select>
              {courseChoice === "Others" && (
                <input
                  className="inp mt-2"
                  placeholder="Enter course name"
                  value={f.course}
                  onChange={(e) => setF({ ...f, course: e.target.value })}
                />
              )}
            </F>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <F label="Course Code"><input className="inp" placeholder="CSE 2101" value={f.courseCode} onChange={(e) => setF({ ...f, courseCode: e.target.value })} /></F>
            <F label="Type">
              <select className="inp" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as any })}>
                <option>Slide</option><option>Hand Notes</option>
              </select>
            </F>
          </div>
          <F label="Description"><textarea className="inp min-h-[90px]" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></F>
          <F label="File (PDF)">
            <label className="flex items-center gap-3 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary cursor-pointer transition-colors">
              <Upload className="w-5 h-5 text-muted-foreground" />
              <div className="text-sm">
                <div className="font-medium">{fileName ?? "Click to upload PDF"}</div>
                <div className="text-xs text-muted-foreground">PDF only · demo only, metadata stored locally</div>
              </div>
              <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
            </label>
          </F>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2.5 rounded-xl border border-border hover:bg-muted text-sm font-medium">Cancel</button>
            <button className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 text-sm">{existing ? "Save changes" : "Upload"}</button>
          </div>
        </form>

        <style>{`.inp { width:100%; padding:0.6rem 0.9rem; border-radius: 0.75rem; border:1px solid hsl(var(--border)); background: hsl(var(--background)); font-size: 0.875rem; outline: none; transition: border-color .15s, box-shadow .15s; }
        .inp:focus { border-color: hsl(var(--primary)); box-shadow: 0 0 0 3px hsl(var(--primary) / 0.15); }`}</style>
      </motion.div>
    </motion.div>
  );
}

function F({ label, children }: any) {
  return (
    <div>
      <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}