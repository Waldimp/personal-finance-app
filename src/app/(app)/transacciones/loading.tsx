import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Movimientos: selector de mes, totales, filtros y lista por día. */
export default function Loading() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Skeleton className="h-9 rounded-lg" />
        <Skeleton className="h-9 rounded-lg" />
      </div>

      <LoadingQuip />

      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="space-y-1.5">
          <Skeleton className="h-3 w-24" />
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
              <Skeleton className="size-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-2/5" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
