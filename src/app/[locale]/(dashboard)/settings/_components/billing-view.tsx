"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Clock, Zap, AlertTriangle, ArrowUpDown } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { UpgradeDialog } from "./upgrade-dialog";
import confetti from "canvas-confetti";
import { type PlanTier } from "@/server/lib/stripe-utils";

interface BillingViewProps {
  subscription: {
    id: string;
    status: string;
    current_period_end: number;
    cancel_at_period_end: boolean;
    trial_end: number | null;
  } | null;
  plan: string;
  currentTier?: PlanTier;
  hasPaymentMethod?: boolean;
  activeProjectsCount: number;
}

export function BillingView({ subscription, plan, currentTier, hasPaymentMethod = false, activeProjectsCount }: BillingViewProps) {
  const t = useTranslations("settings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const utils = api.useUtils();
  const isPro = ["PRO", "PRO_TEAM", "PRO_PLUS"].includes(plan);
  const limit = 3;
  const usagePercentage = (activeProjectsCount / limit) * 100;
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(usagePercentage), 100);
    return () => clearTimeout(timer);
  }, [usagePercentage]);

  useEffect(() => {
    if (searchParams.get("upgraded")) {
      toast.success(t("plans.success"));
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
      });
      router.replace(window.location.pathname);
    }
  }, [searchParams, t, router]);

  const cancelMutation = api.stripe.cancelSubscription.useMutation({
    onSuccess: () => {
      toast.success(t("plans.cancelDate", { date: formatDate(subscription!.current_period_end) }));
      void utils.stripe.getSubscriptionDetails.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const resumeMutation = api.stripe.resumeSubscription.useMutation({
    onSuccess: () => {
      toast.success(t("plans.resume"));
      void utils.stripe.getSubscriptionDetails.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(timestamp * 1000));
  };

  const isPending = cancelMutation.isPending || resumeMutation.isPending;

  const handleUpgradeSuccess = () => {
    void utils.stripe.getSubscriptionDetails.invalidate();
    void utils.project.list.invalidate();
    router.refresh();
    toast.success(t("plans.success"));
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6']
    });
  };

  return (
    <>
      <Card className="overflow-hidden border-primary/10 shadow-none">
        <CardContent className="p-0">
          <div className="grid md:grid-cols-[1fr,300px]">
            {/* Main Info */}
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{t("plans.currentPlan")}</p>
                  <div className="flex items-center gap-2">
                    <h3 className="text-2xl font-bold tracking-tight">
                      {isPro ? t(`upgrade.tiers.${currentTier || plan}.name`) : t("plans.free")}
                    </h3>
                    {isPro && (
                      <Badge className="bg-primary/15 text-primary border-none animate-pulse">
                        ACTIF
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Zap className={cn("h-6 w-6 text-primary", isPro && "fill-primary")} />
                </div>
              </div>

              {/* Trial Status */}
              {subscription?.status === "trialing" && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-400">
                      {t("plans.trialDays")}
                    </p>
                    <p className="text-xs text-amber-700/80 dark:text-amber-500/70">
                      {t("plans.trialEnding", { date: formatDate(subscription.trial_end!) })}
                    </p>
                  </div>
                </div>
              )}

              {/* Project Usage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground/80">
                    {isPro ? t("plans.projectsUnlimited") : t("plans.projectsUsed", { used: activeProjectsCount, total: limit })}
                  </span>
                  {!isPro && (
                    <span className={cn("font-bold", activeProjectsCount >= limit ? "text-destructive" : "text-primary")}>
                      {Math.round(usagePercentage)}%
                    </span>
                  )}
                </div>
                {!isPro && (
                  <Progress value={animatedProgress} className="h-2" />
                )}
                {activeProjectsCount >= limit && !isPro && (
                  <p className="text-xs text-destructive flex items-center gap-1.5 font-medium">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {t("upgrade.limitReached")}
                  </p>
                )}
              </div>

              {/* Dates / Next Step */}
              {isPro && subscription && (
                <div className="pt-4 border-t border-border/50 flex flex-wrap gap-x-8 gap-y-2">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("upgrade.stripeStatus")}</p>
                    <p className="text-sm font-medium flex items-center gap-1.5">
                      {subscription.cancel_at_period_end ? (
                        <>
                          <XCircle className="h-3.5 w-3.5 text-destructive" />
                          {t("upgrade.cancelScheduled")}
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                          {t("upgrade.autoRenew")}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{t("upgrade.nextBilling")}</p>
                    <p className="text-sm font-medium">
                      {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions sidebar */}
            <div className="bg-muted/30 border-l border-border/50 p-6 flex flex-col justify-center gap-3">
              {!isPro ? (
                <>
                  <Button
                    size="lg"
                    onClick={() => setUpgradeOpen(true)}
                    className="w-full shadow-lg shadow-primary/20 h-12"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {t("plans.upgrade")}
                  </Button>
                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed px-2">
                    {t("plans.upgradeDesc")}
                  </p>
                </>
              ) : (
                <>
                  {/* Change plan — always visible for PRO users */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUpgradeOpen(true)}
                    className="w-full h-10 border-primary/20 text-primary hover:bg-primary/5"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
                    {t("upgrade.changePlan")}
                  </Button>

                  {subscription?.cancel_at_period_end ? (
                    <Button
                      variant="outline"
                      size="lg"
                      disabled={isPending}
                      onClick={() => resumeMutation.mutate()}
                      className="w-full bg-background border-primary/20 text-primary hover:bg-primary/5 h-12"
                    >
                      {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                      {t("plans.resume")}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={isPending}
                      onClick={() => cancelMutation.mutate()}
                      className="w-full text-destructive hover:text-destructive hover:bg-destructive/5 text-xs h-10"
                    >
                      {isPending ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : null}
                      {t("plans.cancel")}
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <UpgradeDialog
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        onSuccess={handleUpgradeSuccess}
        currentTier={currentTier}
        isPro={isPro}
        subscriptionStatus={subscription?.status}
        hasPaymentMethod={hasPaymentMethod}
      />
    </>
  );
}
