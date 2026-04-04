import { api } from "@/trpc/server";
import { ProfileForm } from "./_components/profile-form";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const profile = await api.user.getProfile();

  return (
    <div className="space-y-6">
      <ProfileForm initialData={profile} locale={locale} />
    </div>
  );
}
