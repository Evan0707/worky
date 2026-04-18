"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  HardHat,
  Settings,
  BarChart3,
  CreditCard,
  FileText,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRef, useLayoutEffect, useState } from "react";

const icons = {
  LayoutDashboard,
  HardHat,
  Settings,
  BarChart3,
  CreditCard,
  FileText,
  CalendarDays,
  TrendingUp,
} as const;

export interface NavItem {
  href: string;
  label: string;
  icon: keyof typeof icons;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

function NavSection({ section, onItemClick }: { section: NavSection; onItemClick?: () => void }) {
  const pathname = usePathname();
  const containerRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 0, opacity: 0 });

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeEl = container.querySelector<HTMLElement>("[data-active='true']");
    if (!activeEl) {
      setIndicator((s) => ({ ...s, opacity: 0 }));
      return;
    }

    const containerTop = container.getBoundingClientRect().top;
    const activeRect = activeEl.getBoundingClientRect();

    setIndicator({
      top: activeRect.top - containerTop,
      height: activeRect.height,
      opacity: 1,
    });
  }, [pathname]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between px-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
          {section.label}
        </span>
        <div className="h-px flex-1 ml-3 bg-border/50" />
      </div>

      <ul ref={containerRef} className="relative space-y-0.5">
        {/* Sliding background indicator */}
        <div
          aria-hidden
          className="absolute left-0 right-0 rounded-md bg-secondary pointer-events-none"
          style={{
            top: indicator.top,
            height: indicator.height,
            opacity: indicator.opacity,
            transition: "top 220ms cubic-bezier(0.4,0,0.2,1), height 220ms cubic-bezier(0.4,0,0.2,1), opacity 150ms ease",
          }}
        />

        {section.items.map((item) => {
          const Icon = icons[item.icon];
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                data-active={isActive ? "true" : "false"}
                aria-current={isActive ? "page" : undefined}
                onClick={onItemClick}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 h-10 text-sm font-medium",
                  "transition-colors duration-150",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors duration-150",
                    isActive ? "text-foreground" : "text-muted-foreground",
                  )}
                />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function SidebarNav({ sections, onClick }: { sections: NavSection[]; onClick?: () => void }) {
  return (
    <div className="space-y-6">
      {sections.map((section) => (
        <NavSection key={section.label} section={section} onItemClick={onClick} />
      ))}
    </div>
  );
}
