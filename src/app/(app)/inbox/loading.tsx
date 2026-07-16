import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton del inbox: movimientos con chips de categorías. */
export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-16 w-full rounded-xl" />

      <LoadingQuip />

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border p-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-1/3" />
          <div className="flex flex-wrap gap-1.5">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-7 w-20 rounded-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
