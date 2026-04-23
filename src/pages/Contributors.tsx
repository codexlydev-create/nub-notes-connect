import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search, Trophy, FileText, Eye, ThumbsUp, Users, Crown, Medal, Award } from "lucide-react";
import { contributorsApi, notesApi } from "@/lib/store";

type SortKey = "rank" | "notes" | "likes" | "views";

export default function Contributors() {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortKey>("rank");

  const contributors = useMemo(() => {
    const list = contributorsApi.list().filter((c) => c.name.toLowerCase().includes(q.toLowerCase()));
    return [...list].sort((a, b) => {
      if (sort === "rank") return a.rank - b.rank;
      if (sort === "notes") return b.notesCount - a.notesCount;
      if (sort === "likes") return b.likes - a.likes;
      return b.views - a.views;
    });
  }, [q, sort]);

  const notes = notesApi.list();
  const summary = [
    { l: "Total Contributors", v: contributorsApi.list().length, icon: Users },
    { l: "Total Notes", v: notes.length, icon: FileText },
    { l: "Total Views", v: notes.reduce((a, n) => a + n.views, 0), icon: Eye },
    { l: "Total Likes", v: notes.reduce((a, n) => a + n.likes, 0), icon: ThumbsUp },
  ];

  return (
    <div>
      <div className="mb-6">
        <div className="text-xs uppercase tracking-widest text-primary font-semibold mb-2">Leaderboard</div>
        <h1 className="text-3xl md:text-4xl font-bold">Top Contributors</h1>
        <p className="text-muted-foreground mt-1">The students keeping Note Share alive.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {summary.map((s) => (
          <motion.div key={s.l} whileHover={{ y: -3 }} className="rounded-2xl bg-card border border-border p-4 shadow-card">
            <div className="w-9 h-9 rounded-xl bg-accent text-accent-foreground flex items-center justify-center mb-2">
              <s.icon className="w-4 h-4" />
            </div>
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{s.l}</div>
            <div className="text-2xl font-bold mt-0.5">{s.v.toLocaleString()}</div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search contributors…" className="w-full pl-10 pr-4 py-3 rounded-xl border border-border bg-card text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition" />
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="px-4 py-3 rounded-xl border border-border bg-card text-sm font-medium outline-none focus:border-primary">
          <option value="rank">Sort: Rank</option>
          <option value="notes">Sort: Notes</option>
          <option value="likes">Sort: Likes</option>
          <option value="views">Sort: Views</option>
        </select>
      </div>

      <div className="rounded-2xl bg-card border border-border shadow-card overflow-hidden">
        <div className="hidden md:grid grid-cols-[60px_1fr_80px_90px_80px_130px_130px] items-center gap-4 px-5 py-3 border-b border-border text-[11px] uppercase tracking-wider text-muted-foreground font-semibold bg-muted/30">
          <div>Rank</div><div>Contributor</div><div>Notes</div><div>Views</div><div>Likes</div><div>Role</div><div>Uploading Status</div>
        </div>
        {contributors.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="grid grid-cols-[48px_1fr_auto] md:grid-cols-[60px_1fr_80px_90px_80px_130px_130px] items-center gap-3 md:gap-4 px-4 md:px-5 py-4 border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors"
          >
            <div className="flex items-center">
              <RankBadge rank={c.rank} />
            </div>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div className="min-w-0">
                <div className="font-semibold truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.studentId}</div>
                <div className="md:hidden mt-1 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground">{c.notesCount} notes · {c.likes} likes</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block text-sm font-medium">{c.notesCount}</div>
            <div className="hidden md:block text-sm">{c.views.toLocaleString()}</div>
            <div className="hidden md:block text-sm">{c.likes.toLocaleString()}</div>
            <div className="hidden md:block">
              <span className={"inline-block whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-md " + (c.role === "Active Uploader" ? "bg-gradient-primary text-primary-foreground" : "bg-accent text-accent-foreground")}>{c.role}</span>
            </div>
            <div className="md:hidden">
              <StatusPill status={c.status} />
            </div>
            <div className="hidden md:block">
              <StatusPill status={c.status} />
            </div>
          </motion.div>
        ))}
        {contributors.length === 0 && <div className="p-10 text-center text-muted-foreground">No contributors found.</div>}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "Active" | "Inactive" }) {
  const active = status === "Active";
  return (
    <span
      className={
        "inline-flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold px-2.5 py-1 rounded-md " +
        (active
          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
          : "bg-muted text-muted-foreground")
      }
      title={active ? "Uploaded in the last 15 days" : "No uploads in the last 15 days"}
    >
      <span className={"w-1.5 h-1.5 rounded-full " + (active ? "bg-emerald-500" : "bg-muted-foreground")} />
      {status}
    </span>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <div className="w-9 h-9 rounded-xl bg-yellow-400/20 text-yellow-600 dark:text-yellow-400 flex items-center justify-center"><Crown className="w-4 h-4" /></div>;
  if (rank === 2) return <div className="w-9 h-9 rounded-xl bg-zinc-300/30 text-zinc-600 dark:text-zinc-300 flex items-center justify-center"><Medal className="w-4 h-4" /></div>;
  if (rank === 3) return <div className="w-9 h-9 rounded-xl bg-orange-400/20 text-orange-600 dark:text-orange-400 flex items-center justify-center"><Award className="w-4 h-4" /></div>;
  return <div className="w-9 h-9 rounded-xl bg-muted text-muted-foreground flex items-center justify-center text-sm font-bold">#{rank}</div>;
}