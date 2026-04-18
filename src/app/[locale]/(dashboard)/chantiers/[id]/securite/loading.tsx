import { Skeleton } from "@/components/ui/skeleton";

export default function SecuriteLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex justify-end">
        <Skeleton className="h-10 w-[180px] rounded-md" />
      </div>
      {[1, 2].map((i) => (
        <Skeleton key={i} className="h-40 w-full rounded-xl" />
      ))}
    </div>
  );
}
