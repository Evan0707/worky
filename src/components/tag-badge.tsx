import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  className?: string;
}

export function TagBadge({ name, color, onRemove, className }: TagBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className,
      )}
      style={{
        backgroundColor: `${color}22`,
        color: color,
        border: `1px solid ${color}44`,
      }}
    >
      {name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          className="rounded-full hover:opacity-70 transition-opacity"
          aria-label={`Remove ${name}`}
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
