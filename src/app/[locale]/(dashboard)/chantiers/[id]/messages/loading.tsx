import { Skeleton } from "@/components/ui/skeleton";

export default function MessagesLoading() {
  return (
    <div className="flex flex-col gap-3 max-w-2xl animate-in fade-in duration-300">
      {[false, true, false, true, false].map((isRight, i) => (
        <div key={i} className={`flex ${isRight ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-14 rounded-2xl ${isRight ? "w-2/3" : "w-1/2"}`} />
        </div>
      ))}
    </div>
  );
}
