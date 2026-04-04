"use client";

import { FolderKanban, Zap, Camera, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

const ICONS = { FolderKanban, Zap, Camera, Clock } as const;
type IconName = keyof typeof ICONS;

interface AnimatedStatCardProps {
  label: string;
  value: number;
  suffix?: string;
  icon: IconName;
  delay?: number;
}

function AnimatedNumber({ value, suffix }: { value: number; suffix?: string }) {
  const count = useCountUp(value);
  return (
    <span>
      {count}
      {suffix}
    </span>
  );
}

export function AnimatedStatCard({
  label,
  value,
  suffix,
  icon,
  delay = 0,
}: AnimatedStatCardProps) {
  const ResolvedIcon = ICONS[icon];

  return (
    <Card
      className="overflow-hidden border bg-card hover:shadow-md transition-shadow duration-200 animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-5 px-5">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0")}>
          <ResolvedIcon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <div className="text-3xl font-bold tracking-tight tabular-nums">
          <AnimatedNumber value={value} suffix={suffix} />
        </div>
      </CardContent>
    </Card>
  );
}
