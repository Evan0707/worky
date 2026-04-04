"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import { type Locale, routing } from "@/i18n/routing";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const LOCALES: Record<Locale, { short: string; label: string }> = {
  "fr-FR": { short: "FR", label: "Français" },
  "en-GB": { short: "EN", label: "English" },
  "de-DE": { short: "DE", label: "Deutsch" },
  "es-ES": { short: "ES", label: "Español" },
};

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const handleChange = (newLocale: Locale) => {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.replace(segments.join("/"));
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = LOCALES[currentLocale];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
          "text-muted-foreground hover:text-foreground hover:bg-muted/60",
          open && "bg-muted/60 text-foreground",
        )}
        aria-label="Switch language"
      >
        <Globe className="h-3.5 w-3.5 shrink-0" />
        <span>{current.short}</span>
        <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      <div 
        className={cn(
          "absolute right-0 top-full mt-1.5 z-50 min-w-[140px] overflow-hidden rounded-lg border bg-popover shadow-md transition-all duration-200 origin-top-right",
          open 
            ? "opacity-100 scale-100 blur-0 pointer-events-auto shadow-lg translate-y-0" 
            : "opacity-0 scale-95 blur-sm pointer-events-none -translate-y-1"
        )}
      >
        {routing.locales.map((locale) => {
          const { short, label } = LOCALES[locale];
          const isActive = locale === currentLocale;
          return (
            <button
              key={locale}
              onClick={() => handleChange(locale)}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors",
                isActive
                  ? "bg-primary/8 text-primary font-medium"
                  : "text-foreground hover:bg-muted/60",
              )}
            >
              <span className="w-6 text-xs font-mono font-semibold text-muted-foreground">
                {short}
              </span>
              <span className="flex-1 text-left">{label}</span>
              {isActive && <Check className="h-3.5 w-3.5 text-primary" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
