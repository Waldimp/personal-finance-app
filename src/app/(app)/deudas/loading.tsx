import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Deudas y cuotas: proyección + secciones con planes. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />

      {/* proyección 6 meses */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-56" />
        <div className="flex h-28 items-end justify-between gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton
              key={i}
              className="w-full max-w-9 rounded-t-md"
              style={{ height: `${35 + ((i * 19) % 50)}%` }}
            />
          ))}
        </div>
      </div>

      <LoadingQuip />

      {/* deudas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <div className="space-y-2.5 rounded-xl border p-4">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="h-9 w-full rounded-lg" />
        </div>
      </div>

      {/* cuotas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-2.5 rounded-xl border p-4">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
