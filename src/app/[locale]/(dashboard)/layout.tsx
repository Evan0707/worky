export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { auth } from "@/server/auth";
import { SidebarNav } from "./_components/sidebar-nav";
import { MobileSidebar } from "./_components/mobile-sidebar";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CommandMenu } from "@/components/command-menu";
import { NotificationBell } from "@/components/notification-bell";
import { SessionProvider } from "@/components/session-provider";
import Link from "next/link";
import Image from "next/image";
import { db } from "@/server/db";
import { getArtisanContext } from "@/server/lib/team-context";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/login`);
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { setupComplete: true },
  });

  if (!user?.setupComplete) {
    redirect(`/${locale}/onboarding`);
  }

  const { role } = await getArtisanContext(session.user.id!, db);
  const isMember = role === "MEMBER";

  const t = await getTranslations({ locale, namespace: "common" });

  const navSections = [
    {
      label: t("nav.projects"),
      items: [
        {
          href: `/${locale}/dashboard`,
          label: t("nav.dashboard"),
          icon: "LayoutDashboard" as const,
        },
        {
          href: `/${locale}/chantiers`,
          label: t("nav.projects"),
          icon: "HardHat" as const,
        },
        ...(!isMember
          ? [
              {
                href: `/${locale}/factures`,
                label: t("nav.invoices"),
                icon: "FileText" as const,
              },
            ]
          : []),
        {
          href: `/${locale}/planning`,
          label: t("nav.planning"),
          icon: "CalendarDays" as const,
        },
        ...(!isMember
          ? [
              {
                href: `/${locale}/rapports`,
                label: t("nav.reports"),
                icon: "TrendingUp" as const,
              },
            ]
          : []),
      ],
    },
    {
      label: t("nav.settings"),
      items: [
        {
          href: `/${locale}/settings`,
          label: t("nav.settings"),
          icon: "Settings" as const,
        },
        {
          href: `/${locale}/settings/billing`,
          label: t("nav.billing"),
          icon: "CreditCard" as const,
        },
      ],
    },
  ];

  const userData = {
    name: session.user.name,
    email: session.user.email,
    plan: session.user.plan,
  };

  return (
    <SessionProvider session={session}>
      <div className="flex min-h-screen bg-background">
        {/* Desktop Sidebar */}
        <aside className="fixed inset-y-0 left-0 z-30 hidden w-[260px] flex-col border-r bg-muted/20 lg:flex">
        {/* Brand */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2 font-semibold">
            <Image 
              src="/logo.svg" 
              alt="OpenChantier" 
              width={100} 
              height={32} 
              className="h-8 w-auto object-contain"
            />
            <p className="font-heading ml-1">OpenChantier</p>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          <SidebarNav sections={navSections} />
        </nav>

        {/* Bottom section */}
        <div className="border-t p-4 mt-auto">
          <div className="flex items-center gap-3 rounded-md px-3 py-2 hover:bg-muted transition-colors cursor-pointer">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium">
              {(session.user.name ?? session.user.email ?? "U")
                .charAt(0)
                .toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">
                {session.user.name ?? session.user.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {session.user.plan}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <MobileSidebar sections={navSections} user={userData} />

      {/* Main content */}
      <main className="flex-1 lg:ml-[260px] min-h-screen flex flex-col">
        {/* Top bar */}
        <div className="hidden lg:flex h-12 items-center justify-between border-b bg-background/80 backdrop-blur-sm px-6 shrink-0 sticky top-0 z-20">
          <CommandMenu />
          <div className="flex items-center gap-4">
            
            <NotificationBell />
            <LocaleSwitcher />
          </div>
        </div>

        <div className="flex-1 flex flex-col px-4 py-6 sm:px-6 sm:py-8 pt-16 lg:pt-6">
          <div className="mx-auto w-full max-w-8xl flex-1 flex flex-col">
            {children}
          </div>
        </div>
      </main>
    </div>
    </SessionProvider>
  );
}
