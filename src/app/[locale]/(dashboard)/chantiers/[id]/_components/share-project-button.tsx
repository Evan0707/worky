"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import {
  Copy,
  MessageSquare,
  Mail,
  Smartphone,
  Check,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface ShareProjectButtonProps {
  url: string;
  projectId: string;
}

export function ShareProjectButton({ url, projectId }: ShareProjectButtonProps) {
  const t = useTranslations("projects.share");
  const tToasts = useTranslations("projects.toasts");
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  
  const utils = api.useUtils();
  const regenerateMutation = api.project.regenerateToken.useMutation({
    onSuccess: () => {
      toast.success(tToasts("regenerated"));
      utils.project.getById.invalidate({ id: projectId });
      router.refresh();
    },
  });

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success(tToasts("shared"));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(tToasts("copyError"));
    }
  };

  const smsUrl = `sms:?body=${encodeURIComponent(t("smsMessage", { url }))}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(t("emailSubject"))}&body=${encodeURIComponent(t("emailBody", { url }))}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(t("smsMessage", { url }))}`;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="secondary"
          className="w-full justify-start hover:bg-muted"
          onClick={handleCopy}
        >
          {copied ? (
            <Check className="mr-2 h-4 w-4 text-emerald-500" />
          ) : (
            <Copy className="mr-2 h-4 w-4" />
          )}
          {t("copyLink")}
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start hover:bg-muted"
          asChild
        >
          <a href={smsUrl}>
            <Smartphone className="mr-2 h-4 w-4" />
            {t("sendSms")}
          </a>
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start hover:bg-muted"
          asChild
        >
          <a href={emailUrl} target="_blank" rel="noopener noreferrer">
            <Mail className="mr-2 h-4 w-4" />
            {t("sendEmail")}
          </a>
        </Button>
        <Button
          variant="secondary"
          className="w-full justify-start hover:bg-muted"
          asChild
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageSquare className="mr-2 h-4 w-4" />
            {t("sendWhatsapp")}
          </a>
        </Button>
      </div>

      <div className="relative pt-4 flex">
        <ConfirmDialog
          title={t("regenerateWarning")}
          confirmLabel={t("regenerate")}
          onConfirm={() => regenerateMutation.mutate({ id: projectId })}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-destructive w-auto ml-auto"
              disabled={regenerateMutation.isPending}
            >
              <RefreshCw className={`mr-1.5 h-3 w-3 ${regenerateMutation.isPending ? "animate-spin" : ""}`} />
              {t("regenerate")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
