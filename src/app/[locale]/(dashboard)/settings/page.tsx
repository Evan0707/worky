import { api } from "@/trpc/server";
import { ProfileForm } from "./_components/profile-form";
import { getTranslations } from "next-intl/server";
import { signOut } from "@/server/auth";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const profile = await api.user.getProfile();
  const t = await getTranslations({ locale, namespace: "common.nav" });

  async function handleLogout() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="space-y-10">
      <div className="space-y-6">
        <ProfileForm initialData={profile} locale={locale} />
      </div>

      <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-6">
        <h3 className="text-base font-semibold text-red-600 dark:text-red-400 mb-2">Zone de danger</h3>
        <p className="text-[14px] text-neutral-600 dark:text-neutral-400 mb-4">
          Vous allez être déconnecté de votre compte sur cet appareil.
        </p>
        <form action={handleLogout}>
          <Button variant="destructive" type="submit" className="gap-2">
            <LogOut className="h-4 w-4" />
            {t("logout")}
          </Button>
        </form>
      </div>
    </div>
  );
}
