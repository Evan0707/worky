"use client";

import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { PenTool, Undo2, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { api } from "@/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ClientSignatureDialogProps {
  projectId: string;
  clientName: string;
}

export function ClientSignatureDialog({ projectId, clientName }: ClientSignatureDialogProps) {
  const t = useTranslations("projects"); // Reuse projects translation block
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [shouldClose, setShouldClose] = useState(true);
  const signatureRef = useRef<SignatureCanvas>(null);

  const signatureMutation = api.project.addClientSignature.useMutation({
    onSuccess: () => {
      if (shouldClose) {
        toast.success(t("signatureDialog.successWithClose"));
      } else {
        toast.success(t("signatureDialog.success"));
      }
      setIsOpen(false);
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message || t("signatureDialog.errorGen"));
    },
  });

  const handleClear = () => {
    signatureRef.current?.clear();
  };

  const handleSave = () => {
    if (signatureRef.current?.isEmpty()) {
      toast.error(t("signatureDialog.errorEmpty"));
      return;
    }

    const base64Canvas = signatureRef.current?.getTrimmedCanvas().toDataURL("image/png");
    if (base64Canvas) {
      signatureMutation.mutate({
        projectId,
        signatureBase64: base64Canvas,
        shouldClose,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <PenTool className="h-4 w-4 text-purple-600" />
          {t("signatureDialog.button")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] w-[95vw] p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>{t("signatureDialog.title", { clientName })}</DialogTitle>
          <DialogDescription>
            {t("signatureDialog.desc")}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden bg-white touch-none">
          <SignatureCanvas
            ref={signatureRef}
            penColor="black"
            canvasProps={{
              className: "w-full h-[250px] sm:h-[300px]",
            }}
          />
        </div>

        <div className="flex items-center space-x-3 bg-muted/40 p-4 rounded-xl border border-border/50">
          <Checkbox
            id="closeProject"
            checked={shouldClose}
            onCheckedChange={(checked) => setShouldClose(checked as boolean)}
          />
          <div className="grid gap-1.5 leading-none">
            <Label
              htmlFor="closeProject"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              {t("signatureDialog.closeProjectLabel")}
            </Label>
            <p className="text-xs text-muted-foreground">
              {t("signatureDialog.closeProjectDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" onClick={handleClear} disabled={signatureMutation.isPending}>
            <Undo2 className="h-4 w-4 mr-2" />
            {t("signatureDialog.clear")}
          </Button>

          <Button
            onClick={handleSave}
            disabled={signatureMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {signatureMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t("signatureDialog.submit")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
