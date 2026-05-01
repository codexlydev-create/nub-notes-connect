import { motion } from "framer-motion";
import { Eye, ThumbsUp, ThumbsDown, Bookmark, FileText, Presentation, Loader2, Copy, Check, BookOpen, Building2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { notesApi } from "@/lib/notesApi";
import { toast } from "sonner";
import { useState } from "react";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";
import UserAvatar from "@/components/UserAvatar";
import { useContributorRank } from "@/hooks/useContributorRanks";

type Reactions = { liked: boolean; disliked: boolean; saved: boolean };

export default function NoteCard({
  note,
  initialReactions,
  onChange,
}: {
  note: Note;
  initialReactions?: Reactions;
  onChange?: (note: Note, me: Reactions) => void;
}) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [me, setMe] = useState<Reactions>(initialReactions ?? { liked: false, disliked: false, saved: false });
  const [counts, setCounts] = useState({ likes: note.likes, dislikes: note.dislikes, saves: note.saves });
  const [busy, setBusy] = useState<null | "like" | "dislike" | "save">(null);
  const [copied, setCopied] = useState(false);
  const isOwn = !!user && user.id === note.uploadedById;
  const rank = useContributorRank(note.uploadedById);

  const requireAuth = () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return false;
    }
    return true;
  };

  async function react(kind: "like" | "dislike" | "save", e: React.MouseEvent) {
    e.preventDefault(); e.stopPropagation();
    if (isOwn || busy) return;
    if (!requireAuth()) return;
    setBusy(kind);
    try {
      const r = await notesApi[kind](note.id);
      setMe(r.me);
      setCounts({ likes: r.note.likes, dislikes: r.note.dislikes, saves: r.note.saves });
      onChange?.(r.note, r.me);
      if (kind === "save") toast.success(r.me.saved ? "Saved to your collection" : "Removed from saved");
    } catch (err: any) {
      toast.error(err?.message ?? "Action failed");
    } finally {
      setBusy(null);
    }
  }

  const TypeIcon = note.type === "Slide" ? Presentation : FileText;

  const copyStudentId = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!note.uploadedByStudentId) return;
    navigator.clipboard.writeText(note.uploadedByStudentId).then(() => {
      setCopied(true);
      toast.success("Student ID copied");
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => toast.error("Couldn't copy"));
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        to={`/notes/${note.id}`}
        state={{ from: `${location.pathname}${location.search}${location.hash}` }}
        className="block group relative rounded-2xl bg-card border border-border p-5 shadow-card hover:shadow-elegant transition-all overflow-hidden"
      >
        <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-primary opacity-0 group-hover:opacity-10 blur-3xl transition-opacity" />

        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-semibold">
            <TypeIcon className="w-3.5 h-3.5" />
            {note.type}
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-gradient-primary text-primary-foreground text-[11px] font-bold tracking-wide">
            {note.courseCode}
          </span>
        </div>

        <h3 className="font-semibold text-base leading-snug mb-1.5 line-clamp-2 text-foreground group-hover:text-primary transition-colors">
          {note.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{note.description}</p>

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          {note.department && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-foreground/80 text-[10px] font-semibold tracking-wide">
              <Building2 className="w-3 h-3" /> {note.department}
            </span>
          )}
          {note.course && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-accent/40 text-foreground/80 text-[10px] font-semibold tracking-wide">
              <BookOpen className="w-3 h-3" /> {note.course}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <UserAvatar
              name={note.uploadedBy}
              photoUrl={note.uploadedByAvatarUrl}
              className="w-6 h-6"
              textClass="text-[10px]"
            />
            <div className="min-w-0">
              <div className="font-medium text-foreground truncate">{note.uploadedBy}</div>
              <div className="flex items-center gap-1.5 truncate">
                {note.uploadedByDepartment && (
                  <span className="truncate">{abbr(note.uploadedByDepartment)}</span>
                )}
                {rank && <RankBadge rank={rank} />}
              </div>
            </div>
          </div>
          <span className="flex items-center gap-1 shrink-0"><Eye className="w-3 h-3" /> {note.views}</span>
        </div>

        {note.uploadedByStudentId && (
          <div className="flex items-center justify-between gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-muted/40 text-[11px]">
            <span className="text-muted-foreground">
              Student ID: <span className="font-mono font-semibold text-foreground">{note.uploadedByStudentId}</span>
            </span>
            <button
              type="button"
              onClick={copyStudentId}
              className="p-1 rounded-md hover:bg-background transition-colors"
              aria-label="Copy student ID"
              title="Copy student ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
            </button>
          </div>
        )}

        <div className="flex items-center gap-1 pt-3 border-t border-border">
          <Action onClick={(e) => react("like", e)} active={me.liked} loading={busy === "like"} icon={ThumbsUp} count={counts.likes} disabled={isOwn} title={isOwn ? "You can't react to your own note" : undefined} />
          <Action onClick={(e) => react("dislike", e)} active={me.disliked} loading={busy === "dislike"} icon={ThumbsDown} count={counts.dislikes} disabled={isOwn} title={isOwn ? "You can't react to your own note" : undefined} />
          <Action onClick={(e) => react("save", e)} active={me.saved} loading={busy === "save"} icon={Bookmark} count={counts.saves} disabled={isOwn} title={isOwn ? "You can't save your own note" : undefined} />
          {isOwn && (
            <span className="ml-auto text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">Your upload</span>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function Action({
  onClick, active, loading, icon: Icon, count, disabled, title,
}: {
  onClick: (e: React.MouseEvent) => void;
  active: boolean; loading: boolean;
  icon: any; count: number;
  disabled?: boolean; title?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-muted",
        active ? "text-primary" : "text-muted-foreground",
        (disabled || loading) && "opacity-50 cursor-not-allowed hover:bg-transparent"
      )}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icon className={cn("w-3.5 h-3.5", active && "fill-current")} />}
      {count}
    </button>
  );
}