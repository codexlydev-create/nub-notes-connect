import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, FileText, Eye, ThumbsUp, ThumbsDown, Users, Crown, Medal, Award, Copy, Check } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { contributorsApi } from "@/lib/notesApi";
import { toast } from "sonner";

type Row = { id: string; name: string; studentId: string; uploads: number; totalViews: number; totalLikes: number; totalDislikes: number };
type SortKey = "rank" | "notes" | "likes" | "views" | "dislikes";

export default function Contributors() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    contributorsApi.list()
      .then((r) => setRows(r.items))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = q.toLowerCase().trim();
    const list = rows.filter((c) =>
      c.name.toLowerCase().includes(term) ||
      (c.studentId || "").toLowerCase().includes(term)
    );
    return [...list].sort((a, b) => {
      if (sort === "notes") return b.uploads - a.uploads;
      if (sort === "likes") return b.totalLikes - a.totalLikes;
      if (sort === "dislikes") return b.totalDislikes - a.totalDislikes;
      if (sort === "views") return b.totalViews - a.totalViews;
      return b.uploads - a.uploads || b.totalLikes - a.totalLikes;
    });
  }, [rows, q, sort]);

  const summary = [
    { l: "Total Contributors", v: rows.length, icon: Users },
    { l: "Total Notes", v: rows.reduce((a, n) => a + n.uploads, 0), icon: FileText },
    { l: "Total Views", v: rows.reduce((a, n) => a + n.totalViews, 0), icon: Eye },
    { l: "Total Likes", v: rows.reduce((a, n) => a + n.totalLikes, 0), icon: ThumbsUp },
  ];

  const copyId = (sid: string) => {
    if (!sid) return;
    navigator.clipboard.writeText(sid).then(() => {
      setCopiedId(sid);
      toast.success("Student ID copied");
      setTimeout(() => setCopiedId((c) => (c === sid ? null : c)), 1500);
    }).catch(() => toast.error("Couldn't copy"));
  };

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Leaderboard</div>
        <h1 className="text-3xl md:text-4xl font-bold">Top Contributors</h1>
        <p className="text-muted-foreground mt-1">The students keeping Note Share alive.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {summary.map((s) => (
          <div key={s.l} className="rounded-2xl bg-card border border-border p-4 shadow-card">
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-2"><s.icon className="w-4 h-4" /></div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="text-2xl font-bold mt-0.5">{loading ? <Skeleton className="h-7 w-16" /> : s.v.toLocaleString()}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or student ID…" className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium outline-none focus:border-primary">
          <option value="rank">Sort: Rank</option>
          <option value="notes">Sort: Notes</option>
          <option value="likes">Sort: Likes</option>
          <option value="dislikes">Sort: Dislikes</option>
          <option value="views">Sort: Views</option>
        </select>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[60px_1.4fr_1.1fr_70px_80px_70px_80px] items-center gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
          <div>Rank</div><div>Contributor</div><div>Student ID</div><div>Notes</div><div>Views</div><div>Likes</div><div>Dislikes</div>
        </div>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 border-b border-border last:border-0 flex items-center gap-4">
              <Skeleton className="w-9 h-9 rounded-xl" />
              <Skeleton className="flex-1 h-5" />
              <Skeleton className="hidden md:block w-24 h-4" />
              <Skeleton className="hidden md:block w-12 h-4" />
              <Skeleton className="hidden md:block w-12 h-4" />
              <Skeleton className="hidden md:block w-12 h-4" />
              <Skeleton className="hidden md:block w-12 h-4" />
            </div>
          ))
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-muted-foreground">No contributors yet.</div>
        ) : (
          filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="grid grid-cols-[48px_1fr_auto] md:grid-cols-[60px_1.4fr_1.1fr_70px_80px_70px_80px] items-center gap-3 md:gap-4 px-4 md:px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/30">
              <RankBadge rank={i + 1} />
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground truncate md:hidden">
                    {c.studentId && <span className="font-mono">{c.studentId} · </span>}
                    {c.uploads} notes · {c.totalLikes} likes · {c.totalDislikes} dislikes
                  </div>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-2 min-w-0">
                {c.studentId ? (
                  <>
                    <span className="font-mono text-sm truncate">{c.studentId}</span>
                    <button
                      type="button"
                      onClick={() => copyId(c.studentId)}
                      className="p-1.5 rounded-md hover:bg-muted transition-colors shrink-0"
                      aria-label="Copy student ID"
                      title="Copy student ID"
                    >
                      {copiedId === c.studentId ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
                    </button>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>
              <div className="hidden md:block text-sm font-medium">{c.uploads}</div>
              <div className="hidden md:block text-sm">{c.totalViews.toLocaleString()}</div>
              <div className="hidden md:block text-sm">{c.totalLikes.toLocaleString()}</div>
              <div className="hidden md:block text-sm">{c.totalDislikes.toLocaleString()}</div>
              {/* Mobile: copy button on right */}
              {c.studentId && (
                <button
                  type="button"
                  onClick={() => copyId(c.studentId)}
                  className="md:hidden p-2 rounded-md hover:bg-muted transition-colors shrink-0"
                  aria-label="Copy student ID"
                >
                  {copiedId === c.studentId ? <Check className="w-4 h-4 text-primary" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                </button>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-9 h-9 rounded-xl bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center"><Crown className="w-4 h-4" /></div>;
  if (rank === 2) return <div className="w-9 h-9 rounded-xl bg-zinc-300/30 text-zinc-600 dark:text-zinc-300 flex items-center justify-center"><Medal className="w-4 h-4" /></div>;
  if (rank === 3) return <div className="w-9 h-9 rounded-xl bg-orange-400/20 text-orange-600 dark:text-orange-400 flex items-center justify-center"><Award className="w-4 h-4" /></div>;
  return <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">#{rank}</div>;
}