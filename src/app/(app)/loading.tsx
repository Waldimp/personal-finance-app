import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton del dashboard (Inicio). */
export default function Loading() {
  return (
    <div className="space-y-5">
      {/* header del mes */}
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      {/* hero Disponible */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto h-10 w-48" />
        <Skeleton className="mx-auto h-3 w-56" />
        <div className="grid grid-cols-3 gap-2 border-t pt-3">
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
          <Skeleton className="h-10" />
        </div>
      </div>

      <LoadingQuip />

      {/* accesos rápidos */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* donut */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-44" />
        <div className="flex justify-center py-2">
          <Skeleton className="size-40 rounded-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
          <Skeleton className="h-8 w-full rounded-lg" />
        </div>
      </div>

      {/* recientes */}
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-xl border p-3">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}
