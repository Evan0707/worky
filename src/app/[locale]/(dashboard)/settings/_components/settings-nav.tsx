"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { UserCircle, CreditCard, Users, LayoutTemplate } from "lucide-react";
import { useTranslations } from "next-intl";

export function SettingsNav() {
  const pathname = usePathname();
  const params = useParams();
  const locale = params.locale as string;
  const t = useTranslations("settings");
  const tTeam = useTranslations("team");

  const items = [
    {
      href: `/${locale}/settings`,
      label: t("profile.title"),
      icon: UserCircle,
      exact: true,
    },
    {
      href: `/${locale}/settings/billing`,
      label: t("billing.title"),
      icon: CreditCard,
    },
    {
      href: `/${locale}/settings/team`,
      label: tTeam("title"),
      icon: Users,
    },
    {
      href: `/${locale}/settings/templates`,
      label: t("templates.title"),
      icon: LayoutTemplate,
    },
  ];

  return (
    <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
      {items.map((item) => {
        const isActive = item.exact 
          ? pathname === item.href 
          : pathname.startsWith(item.href);
          
        return (
          <Button
            key={item.href}
            variant="ghost"
            asChild
            className={cn(
              "relative flex w-full items-center justify-start gap-3 rounded-md px-3 h-10 text-sm font-medium transition-colors duration-150",
              isActive 
                ? "text-foreground" 
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            <Link href={item.href}>
              <item.icon className={cn("mr-2 h-4 w-4", isActive ? "text-primary" : "text-muted-foreground")} />
              {item.label}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}

