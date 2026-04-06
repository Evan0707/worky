"use client";

import { useTranslations } from "next-intl";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Loader2, Users, Shield, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ROLE_CONFIG: Record<"ADMIN" | "MEMBER", { icon: typeof Shield; className: string }> = {
  ADMIN: { icon: Shield, className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  MEMBER: { icon: User, className: "bg-muted text-muted-foreground border-border" },
};

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = name?.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase() ?? "?";
  return (
    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-background">
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={name ?? ""} className="h-full w-full object-cover" />
      ) : (
        <span className="text-xs font-semibold text-primary">{initials}</span>
      )}
    </div>
  );
}

interface TeamAssignmentViewProps {
  projectId: string;
}

export function TeamAssignmentView({ projectId }: TeamAssignmentViewProps) {
  const t = useTranslations("projects.team");
  const utils = api.useUtils();

  const { data: members, isLoading } = api.project.getTeamAssignments.useQuery({ projectId });

  const assignMutation = api.project.assignMember.useMutation({
    onSuccess: () => {
      toast.success(t("assignSuccess"));
      void utils.project.getTeamAssignments.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const unassignMutation = api.project.unassignMember.useMutation({
    onSuccess: () => {
      toast.success(t("unassignSuccess"));
      void utils.project.getTeamAssignments.invalidate({ projectId });
    },
    onError: () => toast.error(t("error")),
  });

  const isPending = assignMutation.isPending || unassignMutation.isPending;

  function handleToggle(userId: string, isAssigned: boolean) {
    if (isAssigned) {
      unassignMutation.mutate({ projectId, userId });
    } else {
      assignMutation.mutate({ projectId, userId });
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!members) return null;

  if (members.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-muted flex items-center justify-center">
          <Users className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">{t("noMembers")}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card divide-y divide-border/50">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold">{t("title")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("description")}</p>
      </div>

      {members.map((m) => {
        const cfg = ROLE_CONFIG[m.role as "ADMIN" | "MEMBER"];
        const Icon = cfg?.icon ?? User;
        return (
          <div
            key={m.userId}
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors"
          >
            <Avatar name={m.name} image={m.image} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.name ?? m.email}</p>
              <p className="text-xs text-muted-foreground truncate">{m.email}</p>
            </div>

            <Badge
              variant="outline"
              className={cn("gap-1 font-medium text-xs shrink-0", cfg?.className)}
            >
              <Icon className="h-3 w-3" />
              {m.role}
            </Badge>

            <Button
              variant={m.isAssigned ? "default" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={() => handleToggle(m.userId, m.isAssigned)}
              className={cn(
                "h-7 text-xs shrink-0 gap-1.5",
                m.isAssigned && "bg-primary/90 hover:bg-primary/80"
              )}
            >
              {m.isAssigned && <Check className="h-3 w-3" />}
              {m.isAssigned ? t("assigned") : t("notAssigned")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
