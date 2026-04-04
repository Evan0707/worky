import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
}: {
  className?: string;
}) {
  return (
    <div className={cn("h-8 w-8 relative overflow-hidden", className)}>
      <Image
        src="/logo.svg"
        alt="Worky Logo"
        fill
        className="object-contain dark:invert"
        priority
      />
    </div>
  );
}
