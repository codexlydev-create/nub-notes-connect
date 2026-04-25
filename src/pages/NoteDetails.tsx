import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Calendar, User as UserIcon, Download, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, FileText, Loader2 } from "lucide-react";
import { notesApi } from "@/lib/notesApi";
import { noteFileUrl } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import type { Note } from "@/lib/types";

export default function NoteDetails() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [me, setMe] = useState<{ liked: boolean; disliked: boolean; saved: boolean }>({ liked: false, disliked: false, saved: false });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "like" | "dislike" | "save">(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true); setNotFound(false);
    notesApi.get(id)
      .then((r) => { setNote(r.note); if (r.me) setMe(r.me); })
      .catch((e) => { if (e.status === 404) setNotFound(true); else toast.error(e.message ?? "Failed to load"); })
      .finally(() => setLoading(false));
  }, [id]);

  const back = () => {
    const from = typeof location.state?.from === "string" ? location.state.from : "/find";
    navigate(from);
  };

  if (loading) return <NoteSkeleton onBack={back} />;
  if (notFound || !note) return <div className="text-center py-20 text-muted-foreground">Note not found. <Link className="text-primary" to="/find">Back to notes</Link></div>;

  const isOwn = !!user && user.id === note.uploadedById;
  const fileSrc = noteFileUrl(note.id);
  const downloadName = note.fileName ?? `${note.title}.pdf`;

  const requireAuth = () => {
    if (!user) { toast.error("Please login to continue"); navigate("/login"); return false; }
    if (isOwn) { toast.info("You can't react to your own note"); return false; }
    return true;
  };
  async function react(kind: "like" | "dislike" | "save") {
    if (!requireAuth() || busy) return;
    setBusy(kind);
    try {
      const r = await notesApi[kind](note!.id);
      setNote(r.note); setMe(r.me);
    } catch (e: any) { toast.error(e?.message ?? "Action failed"); }
    finally { setBusy(null); }
  }

  const downloadPdf = async () => {
    try {
      const a = document.createElement("a");
      a.href = fileSrc; a.download = downloadName; a.target = "_blank";
      document.body.appendChild(a); a.click(); a.remove();
      toast.success("Download started");
    } catch { toast.error("Could not download file"); }
  };

  return (
    <div>
      <button onClick={back} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl bg-card border border-border p-6 shadow-card">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-bold">{note.courseCode}</span>
              <span className="px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">{note.type}</span>
              <span className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs">{note.department}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{note.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
              <span className="inline-flex items-center gap-1.5"><UserIcon className="w-3.5 h-3.5" /> {note.uploadedBy}</span>
              <span className="inline-flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {note.views} views</span>
              {note.pageCount ? <span className="inline-flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> {note.pageCount} pages</span> : null}
              <span className="inline-flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {new Date(note.createdAt).toLocaleDateString()}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{note.description}</p>
          </motion.div>

          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border bg-muted/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview {note.fileName ? <span className="ml-2 normal-case font-normal tracking-normal text-foreground/70">· {note.fileName}</span> : null}
              </div>
            </div>
            <iframe title={note.title} src={`${fileSrc}#toolbar=1&navpanes=0&view=FitH`} className="w-full h-[820px] bg-muted/20" />
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Actions</div>
            <div className="space-y-2">
              <a href={fileSrc} target="_blank" rel="noopener noreferrer" className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90">
                <ExternalLink className="w-4 h-4" /> Open PDF
              </a>
              <button onClick={downloadPdf} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border font-semibold hover:bg-muted">
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
          </div>

          {isOwn ? (
            <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">Your upload</div>
              <p className="text-xs text-muted-foreground">You can't like, dislike, or save your own note.</p>
            </div>
          ) : (
            <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
              <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Engagement</div>
              <div className="grid grid-cols-3 gap-2">
                <SideBtn active={me.liked} loading={busy === "like"} onClick={() => react("like")} icon={ThumbsUp} label="Like" count={note.likes} />
                <SideBtn active={me.disliked} loading={busy === "dislike"} onClick={() => react("dislike")} icon={ThumbsDown} label="Dislike" count={note.dislikes} />
                <SideBtn active={me.saved} loading={busy === "save"} onClick={() => react("save")} icon={Bookmark} label="Save" count={note.saves} />
              </div>
              {!user && <div className="text-[11px] text-muted-foreground mt-3">Login required to like or save.</div>}
            </div>
          )}

          <div className="rounded-2xl bg-gradient-hero border border-border p-5">
            <div className="text-sm font-semibold mb-1">Course</div>
            <div className="text-muted-foreground text-sm">{note.course}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function SideBtn({ active, loading, onClick, icon: Icon, label, count }: any) {
  return (
    <button onClick={onClick} disabled={loading}
      className={"flex flex-col items-center gap-1 p-2 rounded-xl border transition-all disabled:opacity-60 " + (active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground")}>
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className={"w-4 h-4 " + (active ? "fill-current" : "")} />}
      <span className="text-[10px] font-medium">{label}</span>
      <span className="text-xs font-bold tabular-nums">{count}</span>
    </button>
  );
}

function NoteSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div>
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl bg-card border border-border p-6 shadow-card space-y-3">
            <div className="flex gap-2"><Skeleton className="h-6 w-20" /><Skeleton className="h-6 w-20" /></div>
            <Skeleton className="h-9 w-3/4" /><Skeleton className="h-4 w-1/2" /><Skeleton className="h-20 w-full" />
          </div>
          <Skeleton className="w-full h-[820px] rounded-2xl" />
        </div>
        <aside className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-40 rounded-2xl" />
        </aside>
      </div>
    </div>
  );
}