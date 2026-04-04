"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, UserCircle, Wrench, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Progress } from "@/components/ui/progress";

// One main schema for the whole form
const FormSchema = z.object({
  firstName: z.string().min(1, { message: "Requis" }),
  lastName: z.string().min(1, { message: "Requis" }),
  companyName: z.string().min(1, { message: "Requis" }),
  industry: z.string().min(1, { message: "Requis" }),
});

type FormValues = z.infer<typeof FormSchema>;

const defaultValues: FormValues = {
  firstName: "",
  lastName: "",
  companyName: "",
  industry: "",
};

export function OnboardingForm({ locale }: { locale: string }) {
  const router = useRouter();
  const t = useTranslations("auth.onboarding");
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const { data: profile, isLoading: isProfileLoading } = api.user.getProfile.useQuery();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    mode: "onBlur",
    defaultValues,
  });

  // Prefill when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.name) {
        const parts = profile.name.split(" ");
        const first = parts.shift() || "";
        const last = parts.join(" ") || "";
        form.setValue("firstName", first);
        form.setValue("lastName", last);
      }
      if (profile.companyName) {
        form.setValue("companyName", profile.companyName);
      }
      if (profile.industry) {
        form.setValue("industry", profile.industry);
      }
    }
  }, [profile, form]);

  const updateMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("success"));
      router.push(`/${locale}/dashboard`);
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const handleNext = async () => {
    // Validate fields for current step
    let fieldsToValidate: Array<keyof FormValues> = [];
    if (step === 1) fieldsToValidate = ["firstName", "lastName"];
    if (step === 2) fieldsToValidate = ["companyName"];
    
    if (fieldsToValidate.length > 0) {
      const isValid = await form.trigger(fieldsToValidate);
      if (isValid) setStep((s) => Math.min(s + 1, totalSteps));
    } else {
      setStep((s) => Math.min(s + 1, totalSteps));
    }
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 1));
  };

  const onSubmit = async (values: FormValues) => {
    if (step !== totalSteps) return;

    // Submit all data
    const fullName = [values.firstName, values.lastName].filter(Boolean).join(" ");
    
    updateMutation.mutate({
      name: fullName,
      companyName: values.companyName,
      industry: values.industry,
      setupComplete: true,
    });
  };

  if (isProfileLoading) {
    return (
      <div className="p-8 flex justify-center items-center h-48">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isPending = updateMutation.isPending;
  const progressValue = (step / totalSteps) * 100;

  return (
    <div className="p-6 md:p-8 space-y-8">
      {/* Progress */}
      <div className="space-y-2">
        <Progress value={progressValue} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground font-medium">
          <span>Stape {step} / {totalSteps}</span>
          <span>{Math.round(progressValue)}%</span>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Step content */}
          <div className="min-h-[180px]">
            {step === 1 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{t("steps.1.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("steps.1.desc")}</p>
                  </div>
                  <UserCircle className="w-8 h-8 text-primary/40" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fields.firstName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="John" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("fields.lastName")}</FormLabel>
                        <FormControl>
                          <Input placeholder="Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                <div className="space-y-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{t("steps.2.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("steps.2.desc")}</p>
                  </div>
                  <Building2 className="w-8 h-8 text-primary/40" />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.companyName")}</FormLabel>
                      <FormControl>
                        <Input placeholder="Artisan & Co" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                 <div className="space-y-2 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{t("steps.3.title")}</h2>
                    <p className="text-sm text-muted-foreground">{t("steps.3.desc")}</p>
                  </div>
                  <Wrench className="w-8 h-8 text-primary/40" />
                </div>

                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("fields.industry")}</FormLabel>
                      <FormControl>
                        <Input placeholder={t("fields.industryPlaceholder")} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4">
            <Button
              type="button"
              variant="outline"
              disabled={step === 1 || isPending}
              onClick={handleBack}
              className={step === 1 ? "invisible" : ""}
            >
              {t("buttons.back")}
            </Button>
            
            {step < totalSteps ? (
              <Button type="button" onClick={handleNext} disabled={isPending}>
                {t("buttons.next")}
              </Button>
            ) : (
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("buttons.finish")}
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}
