import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Trash2, Eye, ThumbsUp, ThumbsDown, Bookmark, FileText, Loader2, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { notesApi } from "@/lib/notesApi";
import { Skeleton } from "@/components/ui/skeleton";
import type { Note } from "@/lib/types";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import EditNoteModal from "@/components/notes/EditNoteModal";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<Note | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);

  // Hooks must run unconditionally — keep them above any early return.
  const refresh = () => {
    setLoading(true);
    notesApi.myUploads().then((r) => setItems(r.items)).catch(() => setItems([])).finally(() => setLoading(false));
  };

  useEffect(() => { if (user) refresh(); }, [user]);

  // Stats are memoised even when items is empty so the hook order stays stable.
  const stats = useMemo(() => [
    { l: "My notes", v: items.length },
    { l: "Total views", v: items.reduce((a, n) => a + n.views, 0) },
    { l: "Likes", v: items.reduce((a, n) => a + n.likes, 0) },
    { l: "Saves", v: items.reduce((a, n) => a + n.saves, 0) },
  ], [items]);

  // Wait for auth hydration before deciding to redirect — prevents the
  // "blank page → kicked to /login" flash on dashboard refresh.
  if (authLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-64" />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-2xl" />)}
        </div>
      </div>
    );
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

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Manage your uploads, {user.name.split(" ")[0]}.</p>
        </div>
        <button
          onClick={() => navigate("/upload")}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-elegant hover:opacity-90"
        >
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
          <button onClick={() => navigate("/upload")} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Upload now</button>
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
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => navigate(`/notes/${n.id}`)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-border hover:bg-muted text-xs font-medium"
                >
                  View
                </button>
                <button
                  onClick={() => setEditing(n)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs font-medium"
                >
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setConfirmDelete(n)}
                  className="inline-flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 text-xs font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {confirmDelete && (
          <ConfirmDeleteModal
            note={confirmDelete}
            loading={deleting}
            onCancel={() => setConfirmDelete(null)}
            onConfirm={async () => {
              setDeleting(true);
              try { await notesApi.remove(confirmDelete.id); toast.success("Note deleted"); setConfirmDelete(null); refresh(); }
              catch (e: any) { toast.error(e?.message ?? "Could not delete"); }
              finally { setDeleting(false); }
            }}
          />
        )}
        {editing && (
          <EditNoteModal
            key={editing.id}
            note={editing}
            onClose={() => setEditing(null)}
            onSaved={() => { setEditing(null); refresh(); }}
          />
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
