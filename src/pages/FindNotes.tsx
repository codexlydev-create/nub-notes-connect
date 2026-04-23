import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteFilters, { FilterState, emptyFilters } from "@/components/notes/NoteFilters";
import NoteCard from "@/components/notes/NoteCard";
import { notesApi } from "@/lib/store";
import { FileQuestion, ChevronLeft, ChevronRight } from "lucide-react";

const PER_PAGE = 20;

export default function FindNotes() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [tick, setTick] = useState(0);
  const [page, setPage] = useState(1);
  const notes = notesApi.list();

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (filters.department && n.department !== filters.department) return false;
      if (filters.course && n.course !== filters.course) return false;
      if (filters.type && n.type !== filters.type) return false;
      if (filters.title && !n.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
      if (filters.courseCode && !n.courseCode.toLowerCase().includes(filters.courseCode.toLowerCase())) return false;
      return true;
    });
  }, [filters, notes, tick]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  useEffect(() => { setPage(1); }, [filters]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Find Notes</h1>
        <p className="text-muted-foreground mt-1">Explore the full library across all departments.</p>
      </div>

      <NoteFilters value={filters} onChange={setFilters} />

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> notes
        </div>
        {totalPages > 1 && (
          <div className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</div>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            <AnimatePresence mode="popLayout">
              {pageItems.map((n) => (
                <NoteCard key={n.id} note={n} onChange={() => setTick((t) => t + 1)} />
              ))}
            </AnimatePresence>
          </motion.div>
          {totalPages > 1 && (
            <Pager page={currentPage} totalPages={totalPages} onPage={setPage} />
          )}
        </>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  const pages: (number | "…")[] = [];
  const push = (v: number | "…") => pages.push(v);
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) push(i);
    else if (pages[pages.length - 1] !== "…") push("…");
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-8">
      <button
        disabled={page === 1}
        onClick={() => onPage(page - 1)}
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
        aria-label="Previous page"
      ><ChevronLeft className="w-4 h-4" /></button>
      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={
              "min-w-9 h-9 px-3 rounded-lg text-sm font-medium border transition-colors " +
              (p === page
                ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft"
                : "border-border hover:bg-muted text-foreground")
            }
          >{p}</button>
        )
      )}
      <button
        disabled={page === totalPages}
        onClick={() => onPage(page + 1)}
        className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted"
        aria-label="Next page"
      ><ChevronRight className="w-4 h-4" /></button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
        <FileQuestion className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="font-semibold mb-1">No notes match those filters</div>
      <div className="text-sm text-muted-foreground">Try resetting or widening your search.</div>
    </div>
  );
}