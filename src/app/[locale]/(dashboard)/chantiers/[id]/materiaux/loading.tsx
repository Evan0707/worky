import { Skeleton } from "@/components/ui/skeleton";

export default function MateriauxLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Skeleton className="h-52 w-full rounded-xl" />
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
