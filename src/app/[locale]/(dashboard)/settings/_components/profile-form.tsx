"use client";

import { useState, useRef, ChangeEvent } from "react";

import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@/trpc/react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  companyName: z.string().max(200).optional(),
  companyAddress: z.string().max(500).optional(),
  hourlyRate: z.coerce.number().nonnegative().optional(),
  currency: z.enum(["EUR", "GBP", "CHF"]).optional(),
  locale: z.enum(["fr-FR", "en-GB", "de-DE", "es-ES"]).optional(),
  siret: z.string().max(14).optional(),
  steuernummer: z.string().max(20).optional(),
  bceNumber: z.string().max(12).optional(),
  vatNumber: z.string().max(20).optional(),
  iban: z.string().max(34).optional(),
  vatScheme: z
    .enum(["STANDARD", "REDUCED", "MICRO_ENTREPRENEUR", "EXEMPT", "REVERSE_CHARGE"])
    .optional(),
  logoUrl: z.union([z.string().url(), z.literal("")]).optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function ProfileForm({
  initialData,
  locale,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialData: any;
  locale: string;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const utils = api.useUtils();

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData.name ?? "",
      companyName: initialData.companyName ?? "",
      companyAddress: initialData.companyAddress ?? "",
      hourlyRate: initialData.hourlyRate ?? undefined,
      currency: (initialData.currency as FormValues["currency"]) ?? "EUR",
      locale:
        (initialData.locale as FormValues["locale"]) ??
        (locale as FormValues["locale"]) ??
        "fr-FR",
      siret: initialData.siret ?? "",
      steuernummer: initialData.steuernummer ?? "",
      bceNumber: initialData.bceNumber ?? "",
      vatNumber: initialData.vatNumber ?? "",
      iban: initialData.iban ?? "",
      vatScheme:
        (initialData.vatScheme as FormValues["vatScheme"]) ?? "STANDARD",
      logoUrl: initialData.logoUrl ?? "",
    },
  });

  const updateMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.saved"));
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 1500);
      utils.user.getProfile.invalidate();
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message ?? t("toasts.error"));
    },
  });

  function onSubmit(values: FormValues) {
    updateMutation.mutate(values);
  }

  const handleLogoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error(t("toasts.logoInvalidFormat"));
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/photos/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("upload_failed");

      const { files: uploaded } = await res.json();
      if (uploaded && uploaded[0]) {
        form.setValue("logoUrl", uploaded[0].url, { shouldDirty: true });
        toast.success(t("toasts.logoUpdated"));
      }
    } catch {
      toast.error(t("toasts.logoUploadError"));
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Profile section */}
        <Card className="shadow-none border-primary/10">
          <CardHeader>
            <CardTitle className="text-base">{t("profile.title")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Logo Upload */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="shrink-0 flex flex-col items-center gap-3">
                <div 
                  className="relative h-24 w-24 rounded-2xl border-2 border-dashed border-border/60 hover:border-primary/50 transition-colors flex items-center justify-center bg-muted/20 overflow-hidden cursor-pointer group"
                  onClick={() => !uploadingLogo && fileInputRef.current?.click()}
                >
                  {form.watch("logoUrl") ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={form.watch("logoUrl")!} alt={form.watch("companyName") || t("profile.companyName")} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-xs text-white font-medium">Modifier</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span className="text-[10px] uppercase font-medium tracking-wide">Logo</span>
                    </div>
                  )}
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center backdrop-blur-sm">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                />
              </div>

              <div className="flex-1 space-y-4 w-full">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.name")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 bg-muted/30 focus-visible:bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("profile.companyName")}</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            className="h-10 bg-muted/30 focus-visible:bg-background"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("profile.companyAddress")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="h-10 bg-muted/30 focus-visible:bg-background"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.hourlyRate")}</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          className="h-10 pr-8 bg-muted/30 focus-visible:bg-background"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === ""
                                ? undefined
                                : parseFloat(e.target.value),
                            )
                          }
                        />
                        <span className="absolute right-3 top-2.5 text-sm text-muted-foreground">
                          €
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("profile.currency")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="h-10 bg-muted/30">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR — Euro</SelectItem>
                        <SelectItem value="GBP">GBP — Pound Sterling</SelectItem>
                        <SelectItem value="CHF">CHF — Swiss Franc</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="locale"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("profile.locale")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="h-10 bg-muted/30">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fr-FR">Français (FR)</SelectItem>
                      <SelectItem value="en-GB">English (GB)</SelectItem>
                      <SelectItem value="de-DE">Deutsch (DE)</SelectItem>
                      <SelectItem value="es-ES">Español (ES)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>



        <div className="flex justify-end">
          <Button
            type="submit"
            size="lg"
            disabled={updateMutation.isPending || isSuccess}
            isSuccess={isSuccess}
            className="min-w-[160px] shadow-md shadow-primary/20"
          >
            {updateMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {t("profile.save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
