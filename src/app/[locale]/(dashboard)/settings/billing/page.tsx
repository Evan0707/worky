import { api } from "@/trpc/server";
import { BillingForm } from "../_components/billing-form";
import { BillingView } from "../_components/billing-view";
import { getTranslations } from "next-intl/server";

export default async function BillingSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "settings" });

  // Parallel fetch for profile, subscription and project count
  const [profile, subDetails, projects] = await Promise.all([
    api.user.getProfile(),
    api.stripe.getSubscriptionDetails(),
    api.project.list(),
  ]);

  const activeProjectsCount = projects.filter(p => ["ACTIVE", "PAUSED"].includes(p.status)).length;

  return (
    <div className="space-y-8 pb-10">
      {/* Subscription Section */}
      <section className="animate-in slide-in-from-bottom-2 duration-500">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-primary" />
          {t("plans.title")}
        </h2>
        <BillingView
          subscription={subDetails.subscription}
          plan={subDetails.plan}
          currentTier={subDetails.currentTier ?? undefined}
          hasPaymentMethod={subDetails.hasPaymentMethod}
          activeProjectsCount={activeProjectsCount}
        />
      </section>

      {/* Legal & Billing Form */}
      <section className="animate-in slide-in-from-bottom-4 duration-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {t("billing.title")}
        </h2>
        <BillingForm initialData={profile} />
      </section>
    </div>
  );
}
