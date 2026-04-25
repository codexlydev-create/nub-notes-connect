import { Skeleton } from "@/components/ui/skeleton";

export default function NoteCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-16 rounded-lg" />
      </div>
      <Skeleton className="h-5 w-full mb-2" />
      <Skeleton className="h-5 w-3/4 mb-4" />
      <Skeleton className="h-3 w-full mb-1.5" />
      <Skeleton className="h-3 w-5/6 mb-5" />
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-12" />
      </div>
      <div className="flex items-center gap-1 pt-3 border-t border-border">
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-7 w-12" />
        <Skeleton className="h-7 w-12" />
      </div>
    </div>
  );
}

export function NoteCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {Array.from({ length: count }).map((_, i) => <NoteCardSkeleton key={i} />)}
    </div>
  );
}