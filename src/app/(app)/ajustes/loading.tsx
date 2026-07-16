import { Skeleton } from "@/components/ui/skeleton";
import { LoadingQuip } from "@/components/loading-quip";

/** Skeleton de Ajustes y sus subpáginas: perfil + filas de opciones. */
export default function Loading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-32" />

      <div className="flex items-center gap-4 rounded-xl border p-4">
        <Skeleton className="size-12 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>

      <LoadingQuip />

      <div className="space-y-0 rounded-xl border px-4 py-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-b py-3.5 last:border-0">
            <Skeleton className="size-5 rounded" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="size-4 rounded" />
          </div>
        ))}
      </div>

      <Skeleton className="h-9 w-full rounded-lg" />
    </div>
  );
}
