import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Lightbulb, MessageSquare, ThumbsDown, ThumbsUp, Pencil, Trash2,
  Reply, Send, Loader2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import UserAvatar from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { suggestionCommentSchema, suggestionFormSchema, type SuggestionFormValues } from "@/lib/communitySchemas";
import { suggestionsApi, type Suggestion, type SuggestionComment, type SuggestionReaction } from "@/lib/suggestionsApi";
import { toast } from "sonner";

const emptyForm: SuggestionFormValues = { topic: "", field: "", description: "" };

export default function Suggestions() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SuggestionFormValues>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Suggestion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busyActionId, setBusyActionId] = useState<string | null>(null);

  const loadItems = useCallback(async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setLoadError(false);
    try {
      const response = await suggestionsApi.list();
      setItems([...response.items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)));
    } catch {
      setLoadError(true);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(true);
  }, [loadItems]);

  const requireLogin = () => {
    navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
  };

  const openNewSuggestion = () => {
    if (!user) return requireLogin();
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEditSuggestion = (item: Suggestion) => {
    setEditingId(item.id);
    setForm({ topic: item.topic, field: item.field, description: item.description });
    setEditorOpen(true);
  };

  const saveSuggestion = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsed = suggestionFormSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check the suggestion details");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await suggestionsApi.update(editingId, parsed.data);
        toast.success("Suggestion updated");
      } else {
        await suggestionsApi.create(parsed.data);
        toast.success("Suggestion posted");
      }
      setEditorOpen(false);
      await loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save suggestion");
    } finally {
      setSaving(false);
    }
  };

  const deleteSuggestion = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await suggestionsApi.remove(deleteTarget.id);
      setItems((current) => current.filter((item) => item.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success("Suggestion deleted");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete suggestion");
    } finally {
      setDeleting(false);
    }
  };

  const reactToSuggestion = async (id: string, value: SuggestionReaction) => {
    if (!user) return requireLogin();
    if (busyActionId === id) return;
    setBusyActionId(id);
    try {
      const result = await suggestionsApi.react(id, value);
      setItems((current) => current.map((item) => item.id === id
        ? { ...item, likes: result.likes, dislikes: result.dislikes, myReaction: result.myReaction }
        : item));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update your reaction");
    } finally {
      setBusyActionId(null);
    }
  };

  const addComment = async (id: string, data: { text: string; parentCommentId?: string }) => {
    if (!user) return requireLogin();
    const parsed = suggestionCommentSchema.safeParse({ text: data.text });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Enter a comment");
      throw new Error("Comment validation failed");
    }
    const validatedText = parsed.data.text ?? data.text.trim();
    try {
      const result = await suggestionsApi.addComment(id, { text: validatedText, parentCommentId: data.parentCommentId });
      setItems((current) => current.map((item) => item.id === id
        ? { ...item, comments: [...item.comments, result.comment] }
        : item));
    } catch (error) {
      if (!(error instanceof Error && error.message === "Comment validation failed")) {
        toast.error(error instanceof Error ? error.message : "Could not add comment");
      }
      throw error;
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
            <Lightbulb className="h-4 w-4" /> Community
          </div>
          <h1 className="text-3xl font-bold md:text-4xl">Suggestions</h1>
          <p className="mt-1 text-muted-foreground">Share an idea or join the conversation.</p>
        </div>
        <Button onClick={openNewSuggestion} className="w-full sm:w-auto">
          <Lightbulb className="h-4 w-4" /> Add Suggestion
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4" aria-label="Loading suggestions">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="rounded-lg border border-border bg-card p-5">
              <div className="mb-4 flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-36" /></div>
              <Skeleton className="mb-3 h-6 w-2/3" /><Skeleton className="mb-2 h-4 w-full" /><Skeleton className="h-4 w-4/5" />
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="rounded-lg border border-border bg-card px-5 py-10 text-center">
          <p className="font-semibold">Suggestions could not be loaded.</p>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadItems(true)}>Try again</Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-5 py-14 text-center">
          <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <h2 className="font-semibold">No suggestions yet</h2>
          <p className="mt-1 text-sm text-muted-foreground">Start the conversation with an idea for the community.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.025, 0.15) }}>
              <SuggestionCard
                item={item}
                userId={user?.id}
                busy={busyActionId === item.id}
                onEdit={() => openEditSuggestion(item)}
                onDelete={() => setDeleteTarget(item)}
                onReact={(value) => void reactToSuggestion(item.id, value)}
                onComment={(data) => addComment(item.id, data)}
                onRequireLogin={requireLogin}
              />
            </motion.div>
          ))}
        </div>
      )}

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit suggestion" : "Add suggestion"}</DialogTitle>
            <DialogDescription>Describe the topic and where it belongs.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveSuggestion} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="suggestion-topic">Topic</Label>
              <Input id="suggestion-topic" value={form.topic} maxLength={120} required onChange={(event) => setForm((current) => ({ ...current, topic: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestion-field">Field</Label>
              <Input id="suggestion-field" value={form.field} maxLength={120} required onChange={(event) => setForm((current) => ({ ...current, field: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="suggestion-description">Description</Label>
              <Textarea id="suggestion-description" value={form.description} maxLength={4000} required rows={6} className="min-h-36 resize-y" onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditorOpen(false)} disabled={saving}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {saving ? "Saving…" : editingId ? "Save changes" : "Post"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open && !deleting) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete suggestion?</DialogTitle>
            <DialogDescription>This will also remove its comments and reactions.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={() => void deleteSuggestion()} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SuggestionCard({
  item, userId, busy, onEdit, onDelete, onReact, onComment, onRequireLogin,
}: {
  item: Suggestion;
  userId?: string;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onReact: (value: SuggestionReaction) => void;
  onComment: (data: { text: string; parentCommentId?: string }) => Promise<void>;
  onRequireLogin: () => void;
}) {
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [replyTarget, setReplyTarget] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [commentBusy, setCommentBusy] = useState(false);
  const isAuthor = userId === item.authorId;
  const topLevelComments = item.comments.filter((comment) => !comment.parentCommentId);

  const submitComment = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return onRequireLogin();
    setCommentBusy(true);
    try {
      await onComment({ text: commentText });
      setCommentText("");
    } catch {
      // The page reports the API or validation message.
    } finally {
      setCommentBusy(false);
    }
  };

  const submitReply = async (event: FormEvent<HTMLFormElement>, commentId: string) => {
    event.preventDefault();
    if (!userId) return onRequireLogin();
    setCommentBusy(true);
    try {
      await onComment({ text: replyText, parentCommentId: commentId });
      setReplyText("");
      setReplyTarget(null);
    } catch {
      // The page reports the API or validation message.
    } finally {
      setCommentBusy(false);
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-card sm:p-5">
      <div className="flex items-start gap-3">
        <UserAvatar name={item.authorName} photoUrl={item.authorAvatarUrl} className="h-10 w-10 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-semibold">{item.authorName}</span>
            <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{item.field}</span>
            <h2 className="break-words text-lg font-bold">{item.topic}</h2>
          </div>
        </div>
        {isAuthor && (
          <div className="flex shrink-0 items-center gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit} aria-label="Edit suggestion" title="Edit suggestion"><Pencil /></Button>
            <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete suggestion" title="Delete suggestion"><Trash2 className="text-destructive" /></Button>
          </div>
        )}
      </div>

      <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-6 text-foreground/90">{item.description}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <Button variant={item.myReaction === "like" ? "secondary" : "ghost"} size="sm" disabled={busy} onClick={() => onReact("like")} aria-label="Like suggestion">
          <ThumbsUp className={item.myReaction === "like" ? "text-primary" : ""} /> {item.likes}
        </Button>
        <Button variant={item.myReaction === "dislike" ? "secondary" : "ghost"} size="sm" disabled={busy} onClick={() => onReact("dislike")} aria-label="Dislike suggestion">
          <ThumbsDown className={item.myReaction === "dislike" ? "text-primary" : ""} /> {item.dislikes}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setCommentsOpen((open) => !open)} aria-expanded={commentsOpen}>
          <MessageSquare /> {item.comments.length} {item.comments.length === 1 ? "comment" : "comments"}
        </Button>
      </div>

      {commentsOpen && (
        <div className="mt-3 space-y-4 border-t border-border pt-4">
          {topLevelComments.length > 0 && (
            <div className="space-y-4">
              {topLevelComments.map((comment) => (
                <CommentThread
                  key={comment.id}
                  comment={comment}
                  replies={item.comments.filter((reply) => reply.parentCommentId === comment.id)}
                  canReply={isAuthor}
                  replyTarget={replyTarget}
                  replyText={replyText}
                  commentBusy={commentBusy}
                  onReplyStart={() => { setReplyTarget(comment.id); setReplyText(""); }}
                  onReplyCancel={() => setReplyTarget(null)}
                  onReplyText={setReplyText}
                  onReplySubmit={(event) => void submitReply(event, comment.id)}
                />
              ))}
            </div>
          )}
          {userId ? (
            <form onSubmit={submitComment} className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <Textarea value={commentText} maxLength={2000} rows={2} className="min-h-20 flex-1 resize-y" placeholder="Add a comment…" onChange={(event) => setCommentText(event.target.value)} />
              <Button type="submit" disabled={commentBusy || !commentText.trim()} className="sm:mt-1">
                {commentBusy ? <Loader2 className="animate-spin" /> : <Send />} Comment
              </Button>
            </form>
          ) : (
            <Button variant="outline" onClick={onRequireLogin}>Sign in to comment</Button>
          )}
        </div>
      )}
    </article>
  );
}

function CommentThread({
  comment, replies, canReply, replyTarget, replyText, commentBusy,
  onReplyStart, onReplyCancel, onReplyText, onReplySubmit,
}: {
  comment: SuggestionComment;
  replies: SuggestionComment[];
  canReply: boolean;
  replyTarget: string | null;
  replyText: string;
  commentBusy: boolean;
  onReplyStart: () => void;
  onReplyCancel: () => void;
  onReplyText: (value: string) => void;
  onReplySubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <div className="space-y-3">
      <CommentLine comment={comment} />
      {canReply && replyTarget !== comment.id && (
        <Button variant="ghost" size="sm" className="ml-11 h-8" onClick={onReplyStart}><Reply /> Reply</Button>
      )}
      {replyTarget === comment.id && (
        <form onSubmit={onReplySubmit} className="ml-11 flex flex-col gap-2 sm:flex-row sm:items-start">
          <Textarea value={replyText} maxLength={2000} rows={2} className="min-h-20 flex-1 resize-y" placeholder="Write a reply…" onChange={(event) => onReplyText(event.target.value)} />
          <div className="flex gap-2 sm:mt-1">
            <Button type="submit" disabled={commentBusy || !replyText.trim()}>{commentBusy ? <Loader2 className="animate-spin" /> : <Send />} Reply</Button>
            <Button type="button" variant="outline" onClick={onReplyCancel} disabled={commentBusy}>Cancel</Button>
          </div>
        </form>
      )}
      {replies.map((reply) => <div key={reply.id} className="ml-8 border-l border-border pl-3 sm:ml-11"><CommentLine comment={reply} /></div>)}
    </div>
  );
}

function CommentLine({ comment }: { comment: SuggestionComment }) {
  return (
    <div className="flex items-start gap-3">
      <UserAvatar name={comment.authorName} photoUrl={comment.authorAvatarUrl} className="h-8 w-8 shrink-0" textClass="text-[10px]" />
      <div className="min-w-0 flex-1 rounded-md bg-muted/50 px-3 py-2">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{comment.authorName}</span>
          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm">{comment.text}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString();
}