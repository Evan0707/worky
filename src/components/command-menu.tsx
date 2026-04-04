"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { Search, FolderKanban, Settings, FileText, User, LayoutDashboard } from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const t = useTranslations("common.commandMenu");
  const locale = useLocale();
  const router = useRouter();

  const { data: projects } = api.project.list.useQuery(undefined, {
    enabled: open, // Only fetch when the command menu is open
  });

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false);
      command();
    },
    []
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input hover:bg-accent hover:text-accent-foreground px-4 py-2 relative h-9 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
      >
        <Search className="mr-2 h-4 w-4" />
        <span className="hidden lg:inline-flex">{t("placeholder")}</span>
        <span className="inline-flex lg:hidden">{t("mobilePlaceholder")}</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-6 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder={t("inputPlaceholder")} />
        <CommandList>
          <CommandEmpty>{t("noResults")}</CommandEmpty>
          
          <CommandGroup heading={t("groups.navigation")}>
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/${locale}/dashboard`))}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span>{t("items.dashboard")}</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/${locale}/chantiers`))}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              <span>{t("items.projects")}</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/${locale}/factures`))}
            >
              <FileText className="mr-2 h-4 w-4" />
              <span>{t("items.invoices")}</span>
            </CommandItem>
          </CommandGroup>
          
          <CommandSeparator />
          
          <CommandGroup heading={t("groups.settings")}>
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/${locale}/settings?tab=profile`))}
            >
              <User className="mr-2 h-4 w-4" />
              <span>{t("items.profile")}</span>
            </CommandItem>
            <CommandItem
              onSelect={() => runCommand(() => router.push(`/${locale}/settings?tab=billing`))}
            >
              <Settings className="mr-2 h-4 w-4" />
              <span>{t("items.billing")}</span>
            </CommandItem>
          </CommandGroup>


          {projects && projects.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t("groups.recentProjects")}>
                {projects.slice(0, 5).map((project) => (
                  <CommandItem
                    key={project.id}
                    onSelect={() => runCommand(() => router.push(`/${locale}/chantiers/${project.id}`))}
                  >
                    <FolderKanban className="mr-2 h-4 w-4 text-primary" />
                    <span>{project.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{project.clientName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
