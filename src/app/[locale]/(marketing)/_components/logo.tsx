import { cn } from "@/lib/utils";
import Image from "next/image";

export function Logo({
  className,
  color = "currentColor", // Still accepted but might not affect SVG depending on its internal code
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={cn("h-8 w-8 relative overflow-hidden", className)}>
      <Image
        src="/logo.svg"
        alt="Worky Logo"
        fill
        className="object-contain"
        priority
        style={{
          filter: color === "white" ? "brightness(0) invert(1)" : "none"
        }}
      />
    </div>
  );
}
