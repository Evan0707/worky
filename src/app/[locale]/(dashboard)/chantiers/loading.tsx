import { Skeleton } from "@/components/ui/skeleton";

export default function ChantiersLoading() {
  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-[200px]" />
        <Skeleton className="h-10 w-[140px] rounded-md" />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden space-y-4">
        {/* Search bare skeleton */}
        <div className="flex items-center">
          <Skeleton className="h-10 w-full max-w-sm rounded-md" />
        </div>

        {/* Table skeleton */}
        <div className="flex-1 rounded-xl border bg-card shadow-sm overflow-hidden">
          {/* Header */}
          <div className="border-b bg-muted/50 p-4">
            <div className="flex h-5 w-full items-center gap-4">
              <Skeleton className="h-4 w-10" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-1/5" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-4 w-10 ml-auto" />
            </div>
          </div>
          {/* Rows */}
          <div className="divide-y divide-border">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex p-4 items-center gap-4">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-1/5" />
                <Skeleton className="h-4 w-1/6" />
                <div className="ml-auto">
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
