import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import NoteFilters, { FilterState, emptyFilters } from "@/components/notes/NoteFilters";
import NoteCard from "@/components/notes/NoteCard";
import { notesApi } from "@/lib/store";
import { FileQuestion } from "lucide-react";

export default function FindNotes() {
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [tick, setTick] = useState(0);
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Find Notes</h1>
        <p className="text-muted-foreground mt-1">Explore the full library across all departments.</p>
      </div>

      <NoteFilters value={filters} onChange={setFilters} />

      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filtered.length}</span> notes
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <motion.div layout className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <AnimatePresence mode="popLayout">
            {filtered.map((n) => (
              <NoteCard key={n.id} note={n} onChange={() => setTick((t) => t + 1)} />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
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