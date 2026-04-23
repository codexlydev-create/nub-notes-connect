import { useParams, Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
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
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const lastBlobRef = useRef<string | null>(null);

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

  // Convert stored data URL → blob URL so the iframe can render it with the
  // native PDF viewer (which provides zoom in/out, fit-to-width, page nav, etc.).
  // Many browsers refuse to render `data:application/pdf` inside <iframe>.
  useEffect(() => {
    if (lastBlobRef.current) {
      URL.revokeObjectURL(lastBlobRef.current);
      lastBlobRef.current = null;
    }
    setBlobUrl(null);
    const src = note?.fileData ?? note?.fileUrl;
    if (!src) return;
    try {
      if (src.startsWith("data:")) {
        const comma = src.indexOf(",");
        const meta = src.slice(5, comma); // application/pdf;base64
        const isB64 = meta.includes("base64");
        const data = src.slice(comma + 1);
        const mime = meta.split(";")[0] || "application/pdf";
        const binary = isB64 ? atob(data) : decodeURIComponent(data);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
        lastBlobRef.current = url;
        setBlobUrl(url);
      } else {
        setBlobUrl(src);
      }
    } catch (e) {
      console.error("Failed to build PDF blob", e);
    }
    return () => {
      if (lastBlobRef.current) {
        URL.revokeObjectURL(lastBlobRef.current);
        lastBlobRef.current = null;
      }
    };
  }, [note?.fileData, note?.fileUrl]);

  if (!note) return <div className="text-center py-20 text-muted-foreground">Note not found. <Link className="text-primary" to="/find">Back to notes</Link></div>;

  const pageCount = note.pageCount ?? 0;
  const fileSrc = note.fileData ?? note.fileUrl;
  const viewerSrc = blobUrl ? `${blobUrl}#toolbar=1&navpanes=0&view=FitH` : null;
  const downloadName = note.fileName ?? `${note.title}.pdf`;
  const isOwn = !!user && user.id === note.uploadedById;

  const openPdf = () => {
    if (!blobUrl) { toast.info("No PDF attached to this note."); return; }
    // Open the blob URL directly — the browser's native PDF viewer handles it,
    // including zoom controls and page navigation.
    const w = window.open(blobUrl, "_blank", "noopener,noreferrer");
    if (!w) toast.error("Popup blocked. Allow popups to open the PDF.");
  };
  const downloadPdf = () => {
    if (!fileSrc) { toast.info("No PDF attached to this note."); return; }
    const a = document.createElement("a");
    a.href = blobUrl ?? fileSrc;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success("Download started");
  };

  const liked = user ? interactionsApi.isLiked(user.id, note.id) : false;
  const disliked = user ? interactionsApi.isDisliked(user.id, note.id) : false;
  const saved = user ? interactionsApi.isSaved(user.id, note.id) : false;

  const requireAuth = () => {
    if (!user) { toast.error("Please login to continue"); navigate("/login"); return false; }
    if (isOwn) { toast.info("You can't react to your own note"); return false; }
    return true;
  };
  const onLike = () => {
    if (!requireAuth()) return;
    interactionsApi.setReaction(user!.id, note.id, liked ? "none" : "like");
    setTick((t) => t + 1);
  };
  const onDislike = () => {
    if (!requireAuth()) return;
    interactionsApi.setReaction(user!.id, note.id, disliked ? "none" : "dislike");
    setTick((t) => t + 1);
  };
  const onSave = () => {
    if (!requireAuth()) return;
    interactionsApi.toggleSave(user!.id, note.id);
    setTick((t) => t + 1);
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
              <button
                onClick={openPdf}
                disabled={!fileSrc}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-soft hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ExternalLink className="w-4 h-4" /> Open PDF
              </button>
              <button
                onClick={downloadPdf}
                disabled={!fileSrc}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-card border border-border font-semibold hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
            </div>
            {pageCount > 0 && (
              <div className="mt-3 text-[11px] text-muted-foreground text-center">
                {pageCount} {pageCount === 1 ? "page" : "pages"}
                {note.fileSize ? ` · ${(note.fileSize / 1024).toFixed(0)} KB` : ""}
              </div>
            )}
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
function SideBtn({ active, onClick, icon: Icon, label, count }: any) {
  return (
    <button onClick={onClick} className={"flex flex-col items-center gap-1 p-2 rounded-xl border transition-all " + (active ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted text-muted-foreground")}>
      <Icon className={"w-4 h-4 " + (active ? "fill-current" : "")} />
      <span className="text-[10px] font-medium">{label}</span>
      <span className="text-xs font-bold tabular-nums">{count}</span>
    </button>
  );
}