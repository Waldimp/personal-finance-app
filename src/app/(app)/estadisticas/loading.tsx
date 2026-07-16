import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Estadísticas: resumen de 3 tiles y tarjetas de charts. */
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-32 rounded-md" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <LoadingQuip />

      {/* barras mensuales */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-40" />
        <div className="flex h-44 items-end justify-between gap-2 pt-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full rounded-t-md"
              style={{ height: `${30 + ((i * 23) % 60)}%` }}
            />
          ))}
        </div>
      </div>

      {/* donut */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-44" />
        <div className="flex justify-center py-2">
          <Skeleton className="size-40 rounded-full" />
        </div>
        <Skeleton className="h-8 w-full rounded-lg" />
        <Skeleton className="h-8 w-full rounded-lg" />
      </div>

      {/* por método */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-4 w-14" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
