import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export default async function OnboardingLayout({
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

  // Check if they are already setup, to prevent revisiting this route unnecessarily
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { setupComplete: true },
  });

  if (user?.setupComplete) {
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 flex flex-col items-center justify-center p-4">
      {children}
    </div>
  );
}
