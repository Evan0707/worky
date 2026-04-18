import { Skeleton } from "@/components/ui/skeleton";

export default function PhotosLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-36 w-full rounded-xl" />
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
}
