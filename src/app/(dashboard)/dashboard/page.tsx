import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // This will be replaced with the actual dashboard in Phase 2
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">
        Bonjour, {session.user.name ?? session.user.email}
      </h1>
      <p className="text-muted-foreground mt-2">
        Plan : <span className="font-semibold">{session.user.plan}</span>
      </p>
      <p className="mt-4 text-sm text-muted-foreground">
        🚧 Le dashboard complet arrive en Phase 2 !
      </p>
    </div>
  );
}
