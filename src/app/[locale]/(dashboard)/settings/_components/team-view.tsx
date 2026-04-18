"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Loader2,
  Mail,
  Trash2,
  LogOut,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { type TeamRole } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useParams } from "next/navigation";
import { TeamActivityFeed } from "./team-activity";

// ─── Role badge ────────────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  TeamRole,
  { icon: typeof Crown; className: string }
> = {
  OWNER: { icon: Crown, className: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/20" },
  ADMIN: { icon: Shield, className: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/20" },
  MEMBER: { icon: User, className: "bg-muted text-muted-foreground border-border" },
};

function RoleBadge({ role, t }: { role: TeamRole; t: ReturnType<typeof useTranslations> }) {
  const { icon: Icon, className } = ROLE_CONFIG[role];
  return (
    <Badge variant="outline" className={cn("gap-1 font-medium text-xs", className)}>
      <Icon className="h-3 w-3" />
      {t(`roles.${role}`)}
    </Badge>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ name, image }: { name?: string | null; image?: string | null }) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() ?? "?";

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

// ─── Create team form ──────────────────────────────────────────────────────────

function CreateTeamForm({ onCreated }: { onCreated: () => void }) {
  const t = useTranslations("team");
  const [name, setName] = useState("");

  const mutation = api.team.create.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.created"));
      onCreated();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (name.trim()) mutation.mutate({ name: name.trim() });
      }}
      className="flex gap-2"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={t("create.placeholder")}
        className="h-10 bg-muted/30 focus-visible:bg-background"
        maxLength={100}
      />
      <Button type="submit" disabled={mutation.isPending || !name.trim()} className="shrink-0">
        {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
        {t("create.submit")}
      </Button>
    </form>
  );
}

// ─── Invite form ───────────────────────────────────────────────────────────────

function InviteForm({ isOwner }: { isOwner: boolean }) {
  const t = useTranslations("team");
  const utils = api.useUtils();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"MEMBER" | "ADMIN">("MEMBER");

  const mutation = api.team.invite.useMutation({
    onSuccess: (data) => {
      toast.success(t("invite.sent", { email: data.email }));
      setEmail("");
      void utils.team.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  return (
    <Card className="shadow-none border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <UserPlus className="h-4 w-4 text-primary" />
          {t("invite.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.trim()) mutation.mutate({ email: email.trim(), role });
          }}
          className="flex flex-col sm:flex-row gap-2"
        >
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("invite.emailPlaceholder")}
            className="h-10 bg-muted/30 focus-visible:bg-background flex-1"
          />
          {isOwner && (
            <Select value={role} onValueChange={(v) => setRole(v as "MEMBER" | "ADMIN")}>
              <SelectTrigger className="h-10 bg-muted/30 w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">{t("invite.roleMember")}</SelectItem>
                <SelectItem value="ADMIN">{t("invite.roleAdmin")}</SelectItem>
              </SelectContent>
            </Select>
          )}
          <Button type="submit" disabled={mutation.isPending || !email.trim()} className="shrink-0">
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            {t("invite.submit")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Members list ──────────────────────────────────────────────────────────────

type Member = {
  id: string;
  role: TeamRole;
  joinedAt: Date;
  user: { id: string; name: string | null; email: string | null; image: string | null };
};

function MembersCard({
  members,
  owner,
  isOwner,
  locale,
  onRefresh,
}: {
  members: Member[];
  owner: { id: string; name: string | null; email: string | null; image: string | null };
  isOwner: boolean;
  locale: string;
  onRefresh: () => void;
}) {
  const t = useTranslations("team");
  const utils = api.useUtils();

  const removeMutation = api.team.removeMember.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.removed"));
      void utils.team.get.invalidate();
      onRefresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const roleMutation = api.team.updateMemberRole.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.roleUpdated"));
      void utils.team.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }).format(
      new Date(d),
    );

  return (
    <Card className="shadow-none border-primary/10">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {t("members.title")}
          <Badge variant="secondary" className="ml-auto text-xs font-normal">
            {members.length + 1}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 p-0 pb-2">
        {/* Owner row */}
        <div className="flex items-center gap-3 px-6 py-2.5">
          <Avatar name={owner.name} image={owner.image} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{owner.name ?? owner.email}</p>
            <p className="text-xs text-muted-foreground truncate">{owner.email}</p>
          </div>
          <RoleBadge role="OWNER" t={t} />
        </div>

        {members.length === 0 && (
          <p className="text-sm text-muted-foreground px-6 py-3">{t("members.empty")}</p>
        )}

        {members.map((m) => (
          <div
            key={m.id}
            className="flex flex-wrap items-center gap-3 px-6 py-2.5 hover:bg-muted/40 transition-colors group"
          >
            <Avatar name={m.user.name} image={m.user.image} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{m.user.name ?? m.user.email}</p>
              <p className="text-xs text-muted-foreground truncate">
                {m.user.email} · {formatDate(m.joinedAt)}
              </p>
            </div>

            {isOwner ? (
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <Select
                  value={m.role}
                  onValueChange={(v) =>
                    roleMutation.mutate({ memberId: m.id, role: v as "ADMIN" | "MEMBER" })
                  }
                >
                  <SelectTrigger className="h-7 text-xs w-32 bg-transparent border-muted-foreground/20">
                    <SelectValue />
                    <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEMBER">{t("invite.roleMember")}</SelectItem>
                    <SelectItem value="ADMIN">{t("invite.roleAdmin")}</SelectItem>
                  </SelectContent>
                </Select>
                <ConfirmDialog
                  title={t("actions.removeConfirm")}
                  confirmLabel={t("actions.remove")}
                  onConfirm={() => removeMutation.mutate({ memberId: m.id })}
                  trigger={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  }
                />
              </div>
            ) : (
              <RoleBadge role={m.role} t={t} />
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── Pending invitations ───────────────────────────────────────────────────────

type Invitation = { id: string; email: string; role: TeamRole; expiresAt: Date };

function PendingInvitations({ invitations, locale }: { invitations: Invitation[]; locale: string }) {
  const t = useTranslations("team");
  const utils = api.useUtils();

  const revokeMutation = api.team.revokeInvitation.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.revoked"));
      void utils.team.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (invitations.length === 0) return null;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(d));

  return (
    <Card className="shadow-none border-dashed border-muted-foreground/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {t("invite.pendingTitle")}
          <Badge variant="secondary" className="ml-auto text-xs font-normal">
            {invitations.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {invitations.map((inv) => (
          <div key={inv.id} className="flex items-center gap-3 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="flex-1 truncate text-muted-foreground">{inv.email}</span>
            <Badge variant="outline" className="text-xs shrink-0">
              {t(`roles.${inv.role}`)}
            </Badge>
            <span className="text-xs text-muted-foreground shrink-0">
              {t("invite.expires", { date: formatDate(inv.expiresAt) })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
              onClick={() => revokeMutation.mutate({ invitationId: inv.id })}
            >
              {t("invite.revoke")}
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// ─── User pending invitations ──────────────────────────────────────────────────

function UserInvitations({ locale, onAccepted }: { locale: string; onAccepted: () => void }) {
  const t = useTranslations("team");
  const utils = api.useUtils();

  const { data: invitations, isLoading } = api.team.getPendingInvitations.useQuery();

  const acceptMutation = api.team.acceptInvite.useMutation({
    onSuccess: (data) => {
      toast.success(t("inviteSuccess", { team: data.teamName }));
      void utils.team.get.invalidate();
      void utils.team.getPendingInvitations.invalidate();
      onAccepted();
    },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading || !invitations || invitations.length === 0) return null;

  const formatDate = (d: Date) =>
    new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }).format(new Date(d));

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">{t("myInvitations.title")}</h3>
      <div className="grid gap-3">
        {invitations.map((inv) => (
          <Card key={inv.id} className="shadow-sm border-primary/20 bg-primary/5">
            <CardContent className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {t("myInvitations.invitedBy", { team: inv.team.name })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("myInvitations.role", { role: t(`roles.${inv.role}`) })} ·{" "}
                    {t("invite.expires", { date: formatDate(inv.expiresAt) })}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => acceptMutation.mutate({ token: inv.token })}
                disabled={acceptMutation.isPending}
              >
                {acceptMutation.isPending && <Loader2 className="h-3 w-3 animate-spin mr-2" />}
                {t("myInvitations.accept")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function TeamView({ currentUserId, userPlan }: { currentUserId: string; userPlan?: string | null }) {
  const t = useTranslations("team");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) ?? "fr-FR";
  const utils = api.useUtils();

  const { data, isLoading, refetch } = api.team.get.useQuery();

  const leaveMutation = api.team.leave.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.left"));
      void utils.team.get.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = api.team.delete.useMutation({
    onSuccess: () => {
      toast.success(t("toasts.deleted"));
      void utils.team.get.invalidate();
      router.refresh();
    },
    onError: (err) => toast.error(err.message),
  });

  // Handle invite accept redirects
  useEffect(() => {
    const error = searchParams.get("invite_error");
    const success = searchParams.get("invite_success");
    const teamName = searchParams.get("team");

    if (success && teamName) {
      toast.success(t("inviteSuccess", { team: decodeURIComponent(teamName) }));
    }
    if (error) {
      const key = `inviteErrors.${error}` as Parameters<typeof t>[0];
      toast.error(t(key));
    }
    if (success || error) {
      const url = new URL(window.location.href);
      url.searchParams.delete("invite_error");
      url.searchParams.delete("invite_success");
      url.searchParams.delete("team");
      router.replace(url.pathname);
    }
  }, [searchParams, t, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Team header skeleton */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="bg-muted/40 px-6 py-5 flex items-center gap-4">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-40" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
        </div>
        {/* Members card skeleton */}
        <div className="rounded-lg border bg-card">
          <div className="px-6 py-4 border-b">
            <Skeleton className="h-5 w-24" />
          </div>
          <div className="divide-y">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 px-6 py-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-44" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { team, role, isOwner } = data ?? { team: null, role: null, isOwner: false };

  // ── No team yet ──────────────────────────────────────────────────────────────
  if (!team) {
    return (
      <div className="space-y-6">
        <UserInvitations locale={locale} onAccepted={() => void refetch()} />
        <Card className="shadow-none border-primary/10">
          <CardContent className="flex flex-col items-center gap-6 py-14 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-1.5 max-w-sm">
              <h3 className="font-semibold text-lg">{t("noTeam.heading")}</h3>
              <p className="text-sm text-muted-foreground">{t("noTeam.sub")}</p>
            </div>
            <div className="w-full max-w-sm">
              {userPlan === "FREE" || userPlan === "PRO" ? (
                <div className="p-4 bg-muted/30 border border-amber-500/20 rounded-lg flex flex-col items-center gap-3">
                  <p className="text-sm text-center font-medium text-amber-600 dark:text-amber-400">
                    {t("noTeam.upgradeRequired", { fallback: "Vous devez passer au plan PRO Équipe pour créer une équipe." })}
                  </p>
                  <Button asChild size="sm" className="w-full bg-amber-500 hover:bg-amber-600 text-white">
                    <a href={`/${locale}/settings/billing`}>{t("noTeam.upgradeBtn", { fallback: "Changer de plan" })}</a>
                  </Button>
                </div>
              ) : (
                <CreateTeamForm onCreated={() => void refetch()} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Member view ──────────────────────────────────────────────────────────────
  if (!isOwner) {
    const ownerUser = (team as { owner?: { id: string; name: string | null; email: string | null; image: string | null } }).owner ?? { id: "", name: null, email: null, image: null };
    return (
      <div className="space-y-6">
        <UserInvitations locale={locale} onAccepted={() => void refetch()} />
        {/* Team header */}
        <Card className="shadow-none border-primary/10 overflow-hidden">
          <CardContent className="p-0">
            <div className="bg-gradient-to-r from-primary/8 to-primary/4 px-6 py-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                  {t("title")}
                </p>
                <h3 className="text-xl font-bold tracking-tight truncate">{team.name}</h3>
              </div>
              <RoleBadge role={role!} t={t} />
            </div>
          </CardContent>
        </Card>

        <MembersCard
          members={team.members as Member[]}
          owner={ownerUser}
          isOwner={false}
          locale={locale}
          onRefresh={() => void refetch()}
        />

        {/* Activity feed */}
        <TeamActivityFeed />

        {/* Leave */}
        <div className="pt-2 border-t border-border/50">
          <ConfirmDialog
            title={t("actions.leaveConfirm")}
            confirmLabel={t("actions.leave")}
            onConfirm={() => leaveMutation.mutate()}
            trigger={
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/5 text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                {t("actions.leave")}
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  // ── Owner view ───────────────────────────────────────────────────────────────
  type OwnerShape = { id: string; name: string | null; email: string | null; image: string | null };
  // owner data is included in the query via the "owner" relation
  const ownerUser = (team as { owner?: OwnerShape | null }).owner ?? { id: currentUserId, name: null, email: null, image: null };

  return (
    <div className="space-y-6">
      <UserInvitations locale={locale} onAccepted={() => void refetch()} />
      {/* Team header */}
      <Card className="shadow-none border-primary/10 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gradient-to-r from-primary/8 to-primary/4 px-6 py-5 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                {t("title")}
              </p>
              <h3 className="text-xl font-bold tracking-tight truncate">{team.name}</h3>
            </div>
            <RoleBadge role="OWNER" t={t} />
          </div>
        </CardContent>
      </Card>

      {/* Members */}
      <MembersCard
        members={team.members as Member[]}
        owner={ownerUser}
        isOwner
        locale={locale}
        onRefresh={() => void refetch()}
      />

      {/* Activity feed */}
      <TeamActivityFeed />

      {/* Pending invitations */}
      <PendingInvitations invitations={team.invitations as Invitation[]} locale={locale} />

      {/* Invite form */}
      <InviteForm isOwner />

      {/* Danger zone */}
      <div className="pt-2 border-t border-border/50">
        <ConfirmDialog
          title={t("actions.deleteConfirm")}
          confirmLabel={t("actions.deleteTeam")}
          onConfirm={() => deleteMutation.mutate()}
          trigger={
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              {t("actions.deleteTeam")}
            </Button>
          }
        />
      </div>
    </div>
  );
}
