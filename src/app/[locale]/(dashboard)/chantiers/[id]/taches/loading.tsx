import { Skeleton } from "@/components/ui/skeleton";

export default function TachesLoading() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-300">
      {[1, 2, 3].map((col) => (
        <div key={col} className="space-y-3">
          <Skeleton className="h-6 w-28 rounded-full" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ))}
    </div>
  );
}
