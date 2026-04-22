import { motion } from "framer-motion";
import { Eye, ThumbsUp, ThumbsDown, Bookmark, FileText, Presentation } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { interactionsApi } from "@/lib/store";
import { toast } from "sonner";
import { useState } from "react";
import type { Note } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NoteCard({ note, onChange }: { note: Note; onChange?: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [liked, setLiked] = useState(user ? interactionsApi.isLiked(user.id, note.id) : false);
  const [disliked, setDisliked] = useState(user ? interactionsApi.isDisliked(user.id, note.id) : false);
  const [saved, setSaved] = useState(user ? interactionsApi.isSaved(user.id, note.id) : false);
  const [counts, setCounts] = useState({ likes: note.likes, dislikes: note.dislikes, saves: note.saves });

  const requireAuth = () => {
    if (!user) {
      toast.error("Please login to continue");
      navigate("/login");
      return false;
    }
    return true;
  };

  const onLike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    const now = interactionsApi.toggleLike(user!.id, note.id);
    setLiked(now);
    setCounts((c) => ({ ...c, likes: c.likes + (now ? 1 : -1) }));
    onChange?.();
  };
  const onDislike = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    const now = interactionsApi.toggleDislike(user!.id, note.id);
    setDisliked(now);
    setCounts((c) => ({ ...c, dislikes: c.dislikes + (now ? 1 : -1) }));
    onChange?.();
  };
  const onSave = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!requireAuth()) return;
    const now = interactionsApi.toggleSave(user!.id, note.id);
    setSaved(now);
    setCounts((c) => ({ ...c, saves: c.saves + (now ? 1 : -1) }));
    toast.success(now ? "Saved to your collection" : "Removed from saved");
    onChange?.();
  };

  const TypeIcon = note.type === "Slide" ? Presentation : FileText;

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 22 }}
    >
      <Link
        to={`/notes/${note.id}`}
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

        <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-3">
          <span className="truncate">by {note.uploadedBy}</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {counts.likes + note.views}</span>
        </div>

        <div className="flex items-center gap-1 pt-3 border-t border-border">
          <Action onClick={onLike} active={liked} icon={ThumbsUp} count={counts.likes} />
          <Action onClick={onDislike} active={disliked} icon={ThumbsDown} count={counts.dislikes} />
          <Action onClick={onSave} active={saved} icon={Bookmark} count={counts.saves} activeClass="text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}

function Action({ onClick, active, icon: Icon, count, activeClass = "text-primary" }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all hover:bg-muted",
        active ? activeClass : "text-muted-foreground"
      )}
    >
      <Icon className={cn("w-3.5 h-3.5", active && "fill-current")} />
      {count}
    </button>
  );
}