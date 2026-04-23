import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Calendar, User as UserIcon, Download, ExternalLink, ThumbsUp, ThumbsDown, Bookmark, FileText } from "lucide-react";
import { notesApi, interactionsApi, viewsApi, anonViewerId } from "@/lib/store";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function NoteDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!id) return;
    const viewerKey = user?.id ?? anonViewerId();
    const firstView = viewsApi.markViewed(viewerKey, id);
    if (firstView) {
      notesApi.incrementViews(id);
      setTick((t) => t + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id]);

  const note = useMemo(() => (id ? notesApi.get(id) : undefined), [id, tick]);

  if (!note) return <div className="text-center py-20 text-muted-foreground">Note not found. <Link className="text-primary" to="/find">Back to notes</Link></div>;

  const pageCount = note.pageCount ?? 0;
  const fileSrc = note.fileData ?? note.fileUrl;
  const downloadName = note.fileName ?? `${note.title}.pdf`;

  const openPdf = () => {
    if (!fileSrc) { toast.info("No PDF attached to this note."); return; }
    const w = window.open();
    if (w) {
      w.document.write(`<title>${note.title}</title><iframe src="${fileSrc}" style="border:0;width:100%;height:100vh"></iframe>`);
      w.document.close();
    } else {
      window.location.href = fileSrc;
    }
  };
  const downloadPdf = () => {
    if (!fileSrc) { toast.info("No PDF attached to this note."); return; }
    const a = document.createElement("a");
    a.href = fileSrc;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Download started");
  };

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
              {pageCount > 0 && <Meta icon={FileText}>{pageCount} {pageCount === 1 ? "page" : "pages"}</Meta>}
              <Meta icon={Calendar}>{new Date(note.createdAt).toLocaleDateString()}</Meta>
            </div>
            <p className="text-sm leading-relaxed text-foreground/80">{note.description}</p>
          </motion.div>

          {/* PDF VIEWER */}
          <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border bg-muted/30">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Preview {note.fileName ? <span className="ml-2 normal-case font-normal tracking-normal text-foreground/70">· {note.fileName}</span> : null}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={openPdf} className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted inline-flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> Open</button>
                <button onClick={downloadPdf} className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-muted inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Download</button>
              </div>
            </div>
            {fileSrc ? (
              <iframe
                title={note.title}
                src={fileSrc}
                className="w-full h-[720px] bg-muted/20"
              />
            ) : (
              <div className="h-[480px] flex flex-col items-center justify-center text-center p-6 bg-muted/20">
                <FileText className="w-10 h-10 text-muted-foreground mb-3" />
                <div className="font-semibold mb-1">No PDF attached</div>
                <div className="text-sm text-muted-foreground">This note doesn't have a PDF file.</div>
              </div>
            )}
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