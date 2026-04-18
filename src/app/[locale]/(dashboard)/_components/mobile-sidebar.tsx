"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu } from "lucide-react";
import { SidebarNav, type NavSection } from "./sidebar-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CommandMenu } from "@/components/command-menu";
import { NotificationBell } from "@/components/notification-bell";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetHeader } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface MobileSidebarProps {
  sections: NavSection[];
  user: {
    name?: string | null;
    email?: string | null;
    plan?: string | null;
  };
}

export function MobileSidebar({ sections, user }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 lg:hidden fixed left-4 top-4 z-50 bg-background shadow-sm border">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col p-0 w-[280px]">
        <SheetHeader className="p-6 border-b text-left">
          <SheetTitle className="flex items-center gap-2 font-semibold">
            <Image 
              src="/logo.svg" 
              alt="OpenChantier"
              width={100} 
              height={32} 
              className="h-8 w-auto object-contain"
            />
          </SheetTitle>
        </SheetHeader>

        {/* Navigation */}
        <div className="px-5 pt-5 pb-2 flex gap-2">
          <div className="flex-1">
            <CommandMenu />
          </div>
          <div className="shrink-0 flex items-center">
            <NotificationBell />
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <SidebarNav sections={sections} onClick={() => setOpen(false)} />
        </nav>

        {/* Bottom */}
        <div className="border-t p-4 mt-auto">
          <LocaleSwitcher />
          <div className="mt-4 flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted transition-colors cursor-pointer">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {(user.name ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {user.name ?? user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.plan}
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
