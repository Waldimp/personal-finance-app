import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Mis tarjetas: bloques tipo tarjeta física con ciclo. */
export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-40" />

      <LoadingQuip />

      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-2xl border">
          {/* cabecera de la tarjeta */}
          <div className="flex items-center gap-2.5 p-4">
            <Skeleton className="size-10 rounded-lg" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="space-y-3 p-4 pt-0">
            <div className="flex items-baseline justify-between">
              <Skeleton className="h-4 w-44" />
              <Skeleton className="h-6 w-20" />
            </div>
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-lg" />
              <Skeleton className="h-8 flex-1 rounded-lg" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
