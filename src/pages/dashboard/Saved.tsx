import { useMemo, useState } from "react";
import NoteFilters, { FilterState, emptyFilters } from "@/components/notes/NoteFilters";
import NoteCard from "@/components/notes/NoteCard";
import { useAuth } from "@/context/AuthContext";
import { interactionsApi, notesApi } from "@/lib/store";
import { Bookmark } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Saved() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filters, setFilters] = useState<FilterState>(emptyFilters);
  const [tick, setTick] = useState(0);

  const savedNotes = useMemo(() => {
    if (!user) return [];
    const ids = new Set(interactionsApi.savedIds(user.id));
    return notesApi.list().filter((n) => ids.has(n.id));
  }, [user, tick]);

  const filtered = savedNotes.filter((n) => {
    if (filters.department && n.department !== filters.department) return false;
    if (filters.course && n.course !== filters.course) return false;
    if (filters.type && n.type !== filters.type) return false;
    if (filters.title && !n.title.toLowerCase().includes(filters.title.toLowerCase())) return false;
    if (filters.courseCode && !n.courseCode.toLowerCase().includes(filters.courseCode.toLowerCase())) return false;
    return true;
  });

  if (!user) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">Sign in to see saved notes</h2>
        <button onClick={() => navigate("/login")} className="px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-semibold">Sign in</button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-bold mb-1">Saved Notes</h1>
      <p className="text-muted-foreground mb-6">Your personal study library.</p>
      <NoteFilters value={filters} onChange={setFilters} />

      {filtered.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border p-16 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Bookmark className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="font-semibold mb-1">No saved notes yet</div>
          <div className="text-sm text-muted-foreground">Click the bookmark icon on any note to save it here.</div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((n) => <NoteCard key={n.id} note={n} onChange={() => setTick((t) => t + 1)} />)}
        </div>
      )}
    </div>
  );
}