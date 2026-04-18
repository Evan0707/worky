import { Skeleton } from "@/components/ui/skeleton";

export default function RapportsLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-9 w-[120px] rounded-md" />
      </div>
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-xl border bg-card p-5 space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-7 w-1/2" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <div className="border-b bg-muted/50 p-4">
          <div className="flex h-5 items-center gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/5" />
            <Skeleton className="h-4 w-1/6 ml-auto" />
          </div>
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex p-4 items-center gap-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/6 ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
