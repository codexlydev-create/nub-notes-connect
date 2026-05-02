import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteFilters, { FilterState, emptyFilters } from "@/components/notes/NoteFilters";
import NoteCard from "@/components/notes/NoteCard";
import { NoteCardSkeletonGrid } from "@/components/notes/NoteCardSkeleton";
import { notesApi } from "@/lib/notesApi";
import type { Note } from "@/lib/types";
import { FileQuestion, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react";

const PER_PAGE = 20;

export default function FindNotes() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState<Note[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setPage(1); }, [filters]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(null);
    notesApi.list({
      department: filters.department, course: filters.course, type: filters.type,
      q: filters.title, courseCode: filters.courseCode, studentId: filters.studentId,
      page, limit: PER_PAGE,
    })
      .then((r) => { if (!active) return; setNotes(r.items); setTotal(r.total); })
      .catch((e) => { if (!active) return; setError(e.message ?? "Failed to load"); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [filters, page]);

  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight">Find Notes</h1>
        <p className="text-muted-foreground mt-1">Explore the full library across all departments.</p>
      </div>

      <NoteFilters value={filters} onChange={setFilters} />

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          {loading ? "Loading…" : <>Showing <span className="font-semibold text-foreground">{total}</span> notes</>}
        </div>
        {totalPages > 1 && !loading && (
          <div className="text-xs text-muted-foreground">Page {page} of {totalPages}</div>
        )}
      </div>

      {error ? (
        <ErrorState msg={error} />
      ) : loading ? (
        <NoteCardSkeletonGrid count={9} />
      ) : notes.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <motion.div
            layout
            className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 sm:gap-5 [column-fill:_balance]"
          >
            <AnimatePresence mode="popLayout">
              {notes.map((n) => (
                <div key={n.id} className="mb-4 sm:mb-5 break-inside-avoid">
                  <NoteCard note={n} />
                </div>
              ))}
            </AnimatePresence>
          </motion.div>
          {totalPages > 1 && <Pager page={page} totalPages={totalPages} onPage={setPage} />}
        </>
      )}
    </div>
  );
}

function Pager({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  const pages: (number | "…")[] = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - window && i <= page + window)) pages.push(i);
    else if (pages[pages.length - 1] !== "…") pages.push("…");
  }
  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5 mt-8">
      <button disabled={page === 1} onClick={() => onPage(page - 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted" aria-label="Previous"><ChevronLeft className="w-4 h-4" /></button>
      {pages.map((p, i) => p === "…"
        ? <span key={`e${i}`} className="px-2 text-muted-foreground text-sm">…</span>
        : <button key={p} onClick={() => onPage(p)} className={"min-w-9 h-9 px-3 rounded-lg text-sm font-medium border transition-colors " + (p === page ? "bg-gradient-primary text-primary-foreground border-transparent shadow-soft" : "border-border hover:bg-muted text-foreground")}>{p}</button>
      )}
      <button disabled={page === totalPages} onClick={() => onPage(page + 1)} className="p-2 rounded-lg border border-border disabled:opacity-40 hover:bg-muted" aria-label="Next"><ChevronRight className="w-4 h-4" /></button>
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

function ErrorState({ msg }: { msg: string }) {
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertCircle className="w-7 h-7 mx-auto text-destructive mb-3" />
      <div className="font-semibold mb-1">Couldn't load notes</div>
      <div className="text-sm text-muted-foreground">{msg}</div>
    </div>
  );
}