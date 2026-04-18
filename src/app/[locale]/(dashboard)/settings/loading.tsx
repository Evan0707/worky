import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Skeleton className="h-8 w-[200px]" />
      <div className="grid gap-6 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-10 w-full rounded-md" />
          </div>
        ))}
      </div>
      <Skeleton className="h-10 w-[120px] rounded-md" />
    </div>
  );
}
