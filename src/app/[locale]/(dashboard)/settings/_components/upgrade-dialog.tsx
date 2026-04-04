"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Check,
  Loader2,
  PartyPopper,
  FileText,
  BarChart3,
  Layers,
  Bell,
  Signature,
  HeadphonesIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { env } from "@/env";

const stripePromise = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

// ─── Feature list ─────────────────────────────────────────────────────────────

const PRO_FEATURES = [
  { icon: Layers, labelKey: "upgrade.feat.projects" as const },
  { icon: FileText, labelKey: "upgrade.feat.invoices" as const },
  { icon: BarChart3, labelKey: "upgrade.feat.analytics" as const },
  { icon: Bell, labelKey: "upgrade.feat.reminders" as const },
  { icon: Signature, labelKey: "upgrade.feat.clientActions" as const },
  { icon: HeadphonesIcon, labelKey: "upgrade.feat.support" as const },
];

// ─── Inner payment form ────────────────────────────────────────────────────────

function PaymentForm({
  intentType,
  onSuccess,
}: {
  intentType: "setup" | "payment";
  onSuccess: () => void;
}) {
  const t = useTranslations("settings");
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const activateMutation = api.stripe.activateSubscription.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (err) => {
      // Stripe confirmed but DB update failed — show a soft error, plan may update via webhook
      console.error("activateSubscription error:", err.message);
      onSuccess(); // still show success since Stripe side worked
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setErrorMessage(submitError.message ?? t("upgrade.error"));
      setIsSubmitting(false);
      return;
    }

    const result =
      intentType === "setup"
        ? await stripe.confirmSetup({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}${window.location.pathname}?upgraded=true`,
            },
            redirect: "if_required",
          })
        : await stripe.confirmPayment({
            elements,
            confirmParams: {
              return_url: `${window.location.origin}${window.location.pathname}?upgraded=true`,
            },
            redirect: "if_required",
          });

    if (result.error) {
      setErrorMessage(result.error.message ?? t("upgrade.error"));
      setIsSubmitting(false);
    } else {
      // Stripe confirmed — immediately update plan in DB without waiting for webhook
      activateMutation.mutate();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "accordion",
          defaultValues: { billingDetails: { address: { country: "FR" } } },
        }}
      />

      {errorMessage && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {errorMessage}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={isSubmitting || !stripe || !elements}
        className="w-full h-12 font-semibold shadow-lg shadow-primary/25"
      >
        {isSubmitting ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : (
          <Zap className="h-4 w-4 mr-2 fill-current" />
        )}
        {t("upgrade.cta")}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        {t("upgrade.trial")} · {t("upgrade.cancelAnytime")}
      </p>
    </form>
  );
}

// ─── Success screen ────────────────────────────────────────────────────────────

function SuccessScreen({ onClose }: { onClose: () => void }) {
  const t = useTranslations("settings");

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-10 text-center">
      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center ring-8 ring-primary/5">
        <PartyPopper className="h-10 w-10 text-primary" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">{t("upgrade.successTitle")}</h3>
        <p className="text-muted-foreground text-sm max-w-xs">{t("upgrade.successDesc")}</p>
      </div>
      <Button size="lg" onClick={onClose} className="min-w-40">
        {t("upgrade.successCta")}
      </Button>
    </div>
  );
}

// ─── Main dialog ───────────────────────────────────────────────────────────────

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function UpgradeDialog({ open, onOpenChange, onSuccess }: UpgradeDialogProps) {
  const t = useTranslations("settings");
  const utils = api.useUtils();

  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentType, setIntentType] = useState<"setup" | "payment">("setup");
  const [succeeded, setSucceeded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const intentMutation = api.stripe.createSubscriptionIntent.useMutation({
    onSuccess: (data) => {
      setClientSecret(data.clientSecret);
      setIntentType(data.type);
      setIsLoading(false);
    },
    onError: (err) => {
      setFetchError(err.message);
      setIsLoading(false);
    },
  });

  // Trigger the mutation when the dialog opens (open prop controlled externally)
  useEffect(() => {
    if (open && !clientSecret && !succeeded && !intentMutation.isPending) {
      setIsLoading(true);
      setFetchError(null);
      intentMutation.mutate();
    }
    if (!open && succeeded) {
      // Reset after successful close
      setClientSecret(null);
      setSucceeded(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handlePaymentSuccess = () => {
    setSucceeded(true);
    void utils.stripe.getSubscriptionDetails.invalidate();
    void utils.project.list.invalidate();
  };

  const handleClose = (): void => {
    onOpenChange(false);
    if (succeeded) {
      onSuccess();
      setClientSecret(null);
      setSucceeded(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl p-0 overflow-hidden gap-0"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{t("upgrade.dialogTitle")}</DialogTitle>

        {succeeded ? (
          <div className="p-8">
            <SuccessScreen onClose={handleClose} />
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr,1.1fr]">
            {/* Left panel — features */}
            <div className="relative bg-gradient-to-br from-primary/90 to-primary p-7 text-primary-foreground flex flex-col gap-6 hidden md:flex">
              {/* Decorative circles */}
              <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/5" />
              <div className="absolute -bottom-8 -right-8 h-32 w-32 rounded-full bg-white/5" />

              <div className="relative space-y-1">
                <Badge className="bg-white/20 text-white border-none text-xs font-medium mb-2">
                  {t("upgrade.trial")}
                </Badge>
                <h2 className="text-2xl font-bold leading-tight">
                  {t("upgrade.heading")}
                </h2>
                <p className="text-primary-foreground/70 text-sm">
                  {t("upgrade.subheading")}
                </p>
              </div>

              <ul className="relative space-y-3 flex-1">
                {PRO_FEATURES.map(({ icon: Icon, labelKey }) => (
                  <li key={labelKey} className="flex items-center gap-3 text-sm">
                    <span className="h-6 w-6 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                      <Check className="h-3.5 w-3.5" />
                    </span>
                    {t(labelKey)}
                  </li>
                ))}
              </ul>

              <div className="relative border-t border-white/20 pt-4">
                <p className="text-3xl font-bold">
                  15 €
                  <span className="text-base font-normal text-primary-foreground/70">
                    {" "}{t("upgrade.perMonth")}
                  </span>
                </p>
                <p className="text-xs text-primary-foreground/60 mt-0.5">
                  {t("upgrade.htVat")}
                </p>
              </div>
            </div>

            {/* Right panel — payment */}
            <div className="p-7 flex flex-col gap-5">
              {/* Mobile heading */}
              <div className="md:hidden space-y-1">
                <Badge className="bg-primary/10 text-primary border-none text-xs font-medium">
                  {t("upgrade.trial")}
                </Badge>
                <h2 className="text-xl font-bold">{t("upgrade.heading")}</h2>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground/80 mb-1">
                  {t("upgrade.paymentTitle")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("upgrade.paymentDesc")}
                </p>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {fetchError && (
                <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive text-center space-y-3">
                  <p>{fetchError}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFetchError(null);
                      setIsLoading(true);
                      intentMutation.mutate();
                    }}
                  >
                    {t("upgrade.retry")}
                  </Button>
                </div>
              )}

              {clientSecret && !isLoading && (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: "stripe",
                      variables: {
                        colorPrimary: "hsl(var(--primary))",
                        borderRadius: "8px",
                        fontFamily: "inherit",
                        spacingUnit: "4px",
                      },
                    },
                    locale: "fr",
                  }}
                >
                  <PaymentForm intentType={intentType} onSuccess={handlePaymentSuccess} />
                </Elements>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
