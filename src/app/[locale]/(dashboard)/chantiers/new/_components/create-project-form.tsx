"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateProjectForm({ locale }: { locale: string }) {
  const t = useTranslations("projects");
  const tCommon = useTranslations("common");
  const router = useRouter();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const formSchema = z.object({
    name: z.string().min(1, tCommon("validation.required")).max(200),
    address: z.string().min(1, tCommon("validation.required")).max(500),
    clientName: z.string().min(1, tCommon("validation.required")).max(200),
    clientPhone: z.string().optional(),
    clientEmail: z
      .string()
      .email(tCommon("validation.invalidEmail"))
      .optional()
      .or(z.literal("")),
    description: z.string().max(2000).optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      address: "",
      clientName: "",
      clientPhone: "",
      clientEmail: "",
      description: "",
    },
  });

  const utils = api.useUtils();

  // Load templates silently — FORBIDDEN (FREE plan) is handled gracefully
  const { data: templates = [] } = api.projectTemplate.list.useQuery(undefined, {
    retry: false,
  });

  const applyMutation = api.projectTemplate.applyToProject.useMutation();

  const createMutation = api.project.create.useMutation({
    onSuccess: async (data) => {
      // Apply template in background before redirecting
      if (selectedTemplateId) {
        try {
          await applyMutation.mutateAsync({
            templateId: selectedTemplateId,
            projectId: data.id,
          });
        } catch {
          // Template apply failed — project still created, show non-blocking error
          toast.error(tCommon("errors.generic"));
        }
      }
      toast.success(t("toasts.created"));
      void utils.project.list.invalidate();
      router.push(`/${locale}/chantiers/${data.id}`);
    },
    onError: (error) => {
      toast.error(error.message || tCommon("errors.unexpected"));
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    createMutation.mutate({
      ...values,
      clientEmail: values.clientEmail || undefined,
    });
  }

  const isPending = createMutation.isPending || applyMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.name")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("placeholders.name")}
                  {...field}
                  className="bg-muted/30 focus-visible:bg-background h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.address")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("placeholders.address")}
                  {...field}
                  className="bg-muted/30 focus-visible:bg-background h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid sm:grid-cols-2 gap-5 pt-2">
          <FormField
            control={form.control}
            name="clientName"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">{t("fields.clientName")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("placeholders.clientName")}
                    {...field}
                    className="bg-muted/30 focus-visible:bg-background h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="clientPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-foreground">{t("fields.clientPhone")}</FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("placeholders.clientPhone")}
                    {...field}
                    className="bg-muted/30 focus-visible:bg-background h-10"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="clientEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-foreground">{t("fields.clientEmail")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("placeholders.clientEmail")}
                  {...field}
                  className="bg-muted/30 focus-visible:bg-background h-10"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Template selector — only shown when user has PRO templates */}
        {templates.length > 0 && (
          <div className="space-y-2 pt-1">
            <Label className="text-foreground">{t("new.templateLabel")}</Label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger className="bg-muted/30 focus:bg-background h-10">
                <SelectValue placeholder={t("new.templatePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("new.templateNone")}</SelectItem>
                {templates.map((tpl) => (
                  <SelectItem key={tpl.id} value={tpl.id}>
                    {tpl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">{t("new.templateHint")}</p>
          </div>
        )}

        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("new.title")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
