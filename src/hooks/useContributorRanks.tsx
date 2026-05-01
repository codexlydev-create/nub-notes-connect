import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { contributorsApi } from "@/lib/notesApi";

type RankInfo = { position: number; tier: "Diamond" | "Gold" | "Silver" | "Bronze" };
type Ctx = { ranks: Map<string, RankInfo>; loading: boolean };

const RankCtx = createContext<Ctx>({ ranks: new Map(), loading: true });

function tierFor(position: number): RankInfo["tier"] {
  if (position <= 3) return "Diamond";
  if (position <= 10) return "Gold";
  if (position <= 25) return "Silver";
  return "Bronze";
}

export function ContributorRankProvider({ children }: { children: ReactNode }) {
  const [ranks, setRanks] = useState<Map<string, RankInfo>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    contributorsApi
      .list()
      .then((r) => {
        if (cancelled) return;
        const m = new Map<string, RankInfo>();
        r.items.forEach((it, i) => {
          const pos = i + 1;
          m.set(it.id, { position: pos, tier: tierFor(pos) });
        });
        setRanks(m);
      })
      .catch(() => setRanks(new Map()))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, []);

  const value = useMemo(() => ({ ranks, loading }), [ranks, loading]);
  return <RankCtx.Provider value={value}>{children}</RankCtx.Provider>;
}

export function useContributorRank(userId?: string): RankInfo | null {
  const { ranks } = useContext(RankCtx);
  if (!userId) return null;
  return ranks.get(userId) ?? null;
}

const TIER_CLASSES: Record<RankInfo["tier"], string> = {
  Diamond: "bg-gradient-to-r from-cyan-400 to-blue-500 text-white",
  Gold: "bg-gradient-to-r from-yellow-400 to-amber-500 text-black",
  Silver: "bg-gradient-to-r from-slate-300 to-slate-400 text-slate-900",
  Bronze: "bg-gradient-to-r from-orange-400 to-amber-700 text-white",
};

export function RankBadge({ rank }: { rank: RankInfo }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide shadow-soft ${TIER_CLASSES[rank.tier]}`}
      title={`${rank.tier} contributor · #${rank.position}`}
    >
      #{rank.position} {rank.tier}
    </span>
  );
}