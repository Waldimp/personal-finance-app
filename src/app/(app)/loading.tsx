import { Skeleton } from "@/components/ui/skeleton";

/**
 * Skeleton instantáneo para toda navegación dentro de la app.
 * Aparece al instante del tap mientras el servidor renderiza la página,
 * eliminando la sensación de "app trabada".
 */
export default function Loading() {
  return (
    <div className="space-y-5">
      {/* header */}
      <div className="flex items-center justify-between">
        <Skeleton className="size-9 rounded-lg" />
        <Skeleton className="h-6 w-36 rounded-md" />
        <Skeleton className="size-9 rounded-lg" />
      </div>

      {/* tarjeta hero */}
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

      {/* accesos / chips */}
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>

      {/* tarjeta de contenido */}
      <div className="space-y-3 rounded-xl border p-5">
        <Skeleton className="h-5 w-44" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>

      {/* filas de lista */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
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
