import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav placeholder - will be expanded in Phase 2 */}
      <nav className="border-b px-4 py-3 flex items-center justify-between">
        <span className="font-bold text-brand text-lg">ChantierPro</span>
        <span className="text-sm text-muted-foreground">
          {session.user.email}
        </span>
      </nav>
      <main className="container mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
