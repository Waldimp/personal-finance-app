import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Presupuestos: título y barras de progreso. */
export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
      <Skeleton className="h-4 w-3/4" />

      <LoadingQuip />

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2.5 rounded-xl border p-4">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-8 rounded-lg" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
          <Skeleton className="ml-auto h-3 w-8" />
        </div>
      ))}
    </div>
  );
}
