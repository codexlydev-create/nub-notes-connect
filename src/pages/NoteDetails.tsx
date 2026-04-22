import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Calendar, User as UserIcon, Download, ExternalLink, ZoomIn, ZoomOut, Maximize2, RefreshCcw, ThumbsUp, ThumbsDown, Bookmark } from "lucide-react";
import { notesApi, interactionsApi } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(100);

  useEffect(() => {
    if (id) notesApi.incrementViews(id);
  }, [id]);

  const note = useMemo(() => (id ? notesApi.get(id) : undefined), [id, tick]);
  if (!note) return <div className="text-center py-20 text-muted-foreground">Note not found. <Link className="text-primary" to="/find">Back to notes</Link></div>;

  const liked = user ? interactionsApi.isLiked(user.id, note.id) : false;
  const disliked = user ? interactionsApi.isDisliked(user.id, note.id) : false;
  const saved = user ? interactionsApi.isSaved(user.id, note.id) : false;

  const act = (fn: () => void) => {
    if (!user) { toast.error("Please login to continue"); navigate("/login"); return; }
    fn(); setTick((t) => t + 1);
  };

  return (
    <div>
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-card border border-border p-6 shadow-card"
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-bold">{note.courseCode}</span>
              <span className="px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">{note.type}</span>
              <span className="px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs">{note.department}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{note.title}</h1>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-5">
              <Meta icon={UserIcon}>{note.uploadedBy}</Meta>
              <Meta icon={Eye}>{note.views} views</Meta>
              <Meta icon={Calendar}>{new Date(note.createdAt).toLocaleDateString()}</Meta>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{note.description}</p>
          </motion.div>

          {/* PDF VIEWER */}
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Preview</div>
              <div className="flex items-center gap-1">
                <ToolBtn onClick={() => setZoom((z) => Math.max(50, z - 25))} icon={ZoomOut} label="Zoom out" />
                <div className="px-2 text-xs font-medium tabular-nums w-12 text-center">{zoom}%</div>
                <ToolBtn onClick={() => setZoom((z) => Math.min(200, z + 25))} icon={ZoomIn} label="Zoom in" />
                <ToolBtn onClick={() => setZoom(100)} icon={RefreshCcw} label="Reset" />
                <ToolBtn onClick={() => setZoom(125)} icon={Maximize2} label="Fit width" />
              </div>
            </div>
            <div className="h-[560px] overflow-auto bg-muted/20 p-6 flex justify-center">
              <div
                style={{ width: `${zoom}%`, maxWidth: "900px" }}
                className="shrink-0 bg-card shadow-elegant rounded-lg border border-border p-10 space-y-4 text-sm"
              >
                <div className="text-xs uppercase tracking-widest text-primary font-semibold">{note.courseCode} · {note.type}</div>
                <h2 className="text-2xl font-bold">{note.title}</h2>
                <p className="text-muted-foreground">{note.description}</p>
                <div className="h-px bg-border my-4" />
                {[1,2,3,4,5,6,7,8].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 bg-muted rounded w-1/3" />
                    <div className="h-2 bg-muted rounded w-full" />
                    <div className="h-2 bg-muted rounded w-5/6" />
                    <div className="h-2 bg-muted rounded w-4/6" />
                  </div>
                ))}
                <div className="text-center text-xs text-muted-foreground pt-6">— End of preview —</div>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Actions</div>
            <div className="space-y-2">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); toast.info("Demo PDF — connect Mongo/storage to enable real files."); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90"
              >
                <ExternalLink className="w-4 h-4" /> Open PDF
              </a>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); toast.success("Download started (demo)"); }}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border font-semibold hover:bg-muted"
              >
                <Download className="w-4 h-4" /> Download PDF
              </a>
            </div>
          </div>

          <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
            <div className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-3">Engagement</div>
            <div className="grid grid-cols-3 gap-2">
              <SideBtn active={liked} onClick={() => act(() => interactionsApi.toggleLike(user!.id, note.id))} icon={ThumbsUp} label="Like" count={note.likes} />
              <SideBtn active={disliked} onClick={() => act(() => interactionsApi.toggleDislike(user!.id, note.id))} icon={ThumbsDown} label="Dislike" count={note.dislikes} />
              <SideBtn active={saved} onClick={() => act(() => interactionsApi.toggleSave(user!.id, note.id))} icon={Bookmark} label="Save" count={note.saves} />
            </div>
            {!user && <div className="text-[11px] text-muted-foreground mt-3">Login required to like or save.</div>}
          </div>

          <div className="rounded-2xl bg-gradient-hero border border-border p-5">
            <div className="text-sm font-semibold mb-1">Course</div>
            <div className="text-muted-foreground text-sm">{note.course}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Meta({ icon: Icon, children }: any) {
  return <span className="inline-flex items-center gap-1.5"><Icon className="w-3.5 h-3.5" /> {children}</span>;
}
function ToolBtn({ onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} title={label} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  );
}
function SideBtn({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button onClick={onClick} className={"flex flex-col items-center gap-1 p-2 rounded-xl border transition-all " + (active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground")}>
      <Icon className={"w-4 h-4 " + (active ? "fill-current" : "")} />
      <span className="text-[10px] font-medium">{label}</span>
      <span className="text-xs font-bold tabular-nums">{count}</span>
    </button>
  );
}