import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 pt-4">
      <div className="flex gap-2">
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-1.5 flex-1 rounded-full" />
        <Skeleton className="h-1.5 flex-1 rounded-full" />
      </div>
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-4 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
    </div>
  );
}
