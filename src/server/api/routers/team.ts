import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { render } from "@react-email/render";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { getEffectivePlan } from "@/server/lib/team-context";
import { type TeamRole } from "@prisma/client";
import { TeamInviteEmail } from "../../../../emails/team-invite";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const INVITE_EXPIRY_DAYS = 7;

// ─── Router ───────────────────────────────────────────────────────────────────

export const teamRouter = createTRPCRouter({
  /**
   * Get the team for the current user (as owner or member).
   */
  get: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;

    // Check if user owns a team
    const ownedTeam = await ctx.db.team.findUnique({
      where: { ownerId: userId },
      include: {
        owner: { select: { id: true, name: true, email: true, image: true } },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
          orderBy: { joinedAt: "asc" },
        },
        invitations: {
          where: { acceptedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (ownedTeam) {
      return { team: ownedTeam, role: "OWNER" as TeamRole, isOwner: true };
    }

    // Check if user is a member of a team
    const membership = await ctx.db.teamMember.findUnique({
      where: { userId },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            members: {
              include: {
                user: { select: { id: true, name: true, email: true, image: true } },
              },
              orderBy: { joinedAt: "asc" },
            },
          },
        },
      },
    });

    if (membership) {
      return {
        team: { ...membership.team, invitations: [] },
        role: membership.role,
        isOwner: false,
      };
    }

    return { team: null, role: null, isOwner: false };
  }),

  getPendingInvitations: protectedProcedure.query(async ({ ctx }) => {
    const userEmail = ctx.session.user.email!;
    return ctx.db.teamInvitation.findMany({
      where: {
        email: userEmail,
        acceptedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        team: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Create a team (user becomes OWNER).
   * A user can only own one team and cannot be a member of another team.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      // [SEC-05] Check PRO plan from DB, not from stale session
      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
      }

      // Guard: already owns a team
      const existing = await ctx.db.team.findUnique({ where: { ownerId: userId } });
      if (existing) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already own a team" });
      }

      // Guard: already a member of another team
      const membership = await ctx.db.teamMember.findUnique({ where: { userId } });
      if (membership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Leave your current team before creating one",
        });
      }

      return ctx.db.team.create({
        data: { name: input.name, ownerId: userId },
      });
    }),

  /**
   * Rename team (OWNER only).
   */
  rename: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { ownerId: ctx.session.user.id! },
      });
      if (!team) throw new TRPCError({ code: "FORBIDDEN" });

      return ctx.db.team.update({
        where: { id: team.id },
        data: { name: input.name },
      });
    }),

  /**
   * Invite a user by email (OWNER or ADMIN).
   * Creates a TeamInvitation and sends an email.
   */
  invite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      // Resolve team: owner or admin
      let teamId: string;
      const ownedTeam = await ctx.db.team.findUnique({ where: { ownerId: userId } });
      if (ownedTeam) {
        teamId = ownedTeam.id;
      } else {
        const membership = await ctx.db.teamMember.findUnique({
          where: { userId },
          select: { teamId: true, role: true },
        });
        if (!membership || membership.role === "MEMBER") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Only owners and admins can invite" });
        }
        // Admins can only invite MEMBERs
        if (membership.role === "ADMIN" && input.role === "ADMIN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Admins can only invite members" });
        }
        teamId = membership.teamId;
      }

      // Guard: team member limit (based on owner's maxTeamMembers)
      const ownerUserId = ownedTeam?.ownerId ?? (await ctx.db.teamMember.findUnique({
        where: { userId },
        select: { team: { select: { ownerId: true } } },
      }))?.team.ownerId ?? userId;

      const owner = await ctx.db.user.findUnique({
        where: { id: ownerUserId },
        select: { maxTeamMembers: true },
      });
      const limit = owner?.maxTeamMembers ?? 0;

      if (limit === 0) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Your current plan does not include team members. Upgrade to PRO Équipe.",
        });
      }

      const currentMemberCount = await ctx.db.teamMember.count({ where: { teamId } });
      if (currentMemberCount >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `Team member limit reached (${limit}). Upgrade to PRO+ for unlimited members.`,
        });
      }

      // Guard: email already a member
      const alreadyMember = await ctx.db.user.findFirst({
        where: {
          email: input.email,
          OR: [
            { teamMember: { teamId } },
            { ownedTeam: { id: teamId } },
          ],
        },
      });
      if (alreadyMember) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "This user is already in the team" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

      // Upsert: refresh invite if already pending
      const invitation = await ctx.db.teamInvitation.upsert({
        where: { teamId_email: { teamId, email: input.email } },
        update: {
          role: input.role as TeamRole,
          token: crypto.randomUUID(),
          expiresAt,
          acceptedAt: null,
        },
        create: {
          teamId,
          email: input.email,
          role: input.role as TeamRole,
          expiresAt,
        },
        include: { team: { select: { name: true } } },
      });

      // Send email
      const inviteUrl = `${env.NEXT_PUBLIC_APP_URL}/api/team/accept/${invitation.token}`;
      const inviterUser = await ctx.db.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      });

      if (resend) {
        const inviterName = inviterUser?.name ?? inviterUser?.email ?? "Un utilisateur";
        const emailHtml = await render(
          TeamInviteEmail({
            teamName: invitation.team.name,
            inviterName,
            role: input.role as "ADMIN" | "MEMBER",
            inviteUrl,
            expiryDays: INVITE_EXPIRY_DAYS,
            host: new URL(env.NEXT_PUBLIC_APP_URL).host,
          })
        );
        await resend.emails.send({
          from: env.AUTH_EMAIL_FROM,
          to: input.email,
          subject: `${inviterName} vous invite à rejoindre ${invitation.team.name} sur OpenChantier`,
          html: emailHtml,
        });
      }

      return { success: true, email: input.email };
    }),

  /**
   * Accept an invitation by token.
   * Called from the API route after auth check.
   */
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const userEmail = ctx.session.user.email!;

      const invitation = await ctx.db.teamInvitation.findUnique({
        where: { token: input.token },
        include: { team: true },
      });

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }
      if (invitation.acceptedAt) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation already used" });
      }
      if (invitation.expiresAt < new Date()) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expired" });
      }
      if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invitation was sent to a different email address",
        });
      }

      // Guard: already in another team
      const existingMembership = await ctx.db.teamMember.findUnique({ where: { userId } });
      if (existingMembership) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Leave your current team before accepting this invitation",
        });
      }

      // Guard: user owns a team (cannot be member and owner simultaneously)
      const ownedTeam = await ctx.db.team.findUnique({ where: { ownerId: userId } });
      if (ownedTeam) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Team owners cannot join another team",
        });
      }

      await ctx.db.$transaction([
        ctx.db.teamMember.create({
          data: {
            teamId: invitation.teamId,
            userId,
            role: invitation.role,
          },
        }),
        ctx.db.teamInvitation.update({
          where: { id: invitation.id },
          data: { acceptedAt: new Date() },
        }),
      ]);

      return { teamName: invitation.team.name };
    }),

  /**
   * Update a member's role (OWNER only, cannot change OWNER role).
   */
  updateMemberRole: protectedProcedure
    .input(
      z.object({
        memberId: z.string(),
        role: z.enum(["ADMIN", "MEMBER"]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.team.findUnique({
        where: { ownerId: ctx.session.user.id! },
      });
      if (!team) throw new TRPCError({ code: "FORBIDDEN" });

      const member = await ctx.db.teamMember.findFirst({
        where: { id: input.memberId, teamId: team.id },
      });
      if (!member) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.teamMember.update({
        where: { id: input.memberId },
        data: { role: input.role as TeamRole },
      });
    }),

  /**
   * Remove a member (OWNER or ADMIN removing MEMBERs).
   */
  removeMember: protectedProcedure
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      const ownedTeam = await ctx.db.team.findUnique({ where: { ownerId: userId } });
      let teamId: string;

      if (ownedTeam) {
        teamId = ownedTeam.id;
      } else {
        const membership = await ctx.db.teamMember.findUnique({
          where: { userId },
          select: { teamId: true, role: true },
        });
        if (!membership || membership.role === "MEMBER") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        teamId = membership.teamId;
      }

      const target = await ctx.db.teamMember.findFirst({
        where: { id: input.memberId, teamId },
      });
      if (!target) throw new TRPCError({ code: "NOT_FOUND" });

      // Admin cannot remove other admins
      const callerMembership = ownedTeam
        ? null
        : await ctx.db.teamMember.findUnique({ where: { userId } });
      if (callerMembership?.role === "ADMIN" && target.role === "ADMIN") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admins cannot remove other admins" });
      }

      // Clean up orphaned ProjectAssignments for the removed member
      await ctx.db.projectAssignment.deleteMany({
        where: { userId: target.userId },
      });

      return ctx.db.teamMember.delete({ where: { id: input.memberId } });
    }),

  /**
   * Leave the team (MEMBER or ADMIN only — OWNER must delete the team).
   */
  leave: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id!;

    const membership = await ctx.db.teamMember.findUnique({ where: { userId } });
    if (!membership) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "You are not a team member" });
    }

    // Clean up orphaned ProjectAssignments for the leaving member
    await ctx.db.projectAssignment.deleteMany({ where: { userId } });

    return ctx.db.teamMember.delete({ where: { userId } });
  }),

  /**
   * Revoke a pending invitation (OWNER or ADMIN).
   */
  revokeInvitation: protectedProcedure
    .input(z.object({ invitationId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

      const ownedTeam = await ctx.db.team.findUnique({ where: { ownerId: userId } });
      let teamId: string;

      if (ownedTeam) {
        teamId = ownedTeam.id;
      } else {
        const membership = await ctx.db.teamMember.findUnique({
          where: { userId },
          select: { teamId: true, role: true },
        });
        if (!membership || membership.role === "MEMBER") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        teamId = membership.teamId;
      }

      const invitation = await ctx.db.teamInvitation.findFirst({
        where: { id: input.invitationId, teamId },
      });
      if (!invitation) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.teamInvitation.delete({ where: { id: input.invitationId } });
    }),

  /**
   * Delete the team entirely (OWNER only).
   * Members lose access and become solo FREE users.
   */
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    const team = await ctx.db.team.findUnique({
      where: { ownerId: ctx.session.user.id! },
    });
    if (!team) throw new TRPCError({ code: "FORBIDDEN" });

    return ctx.db.team.delete({ where: { id: team.id } });
  }),

  /**
   * Get the 50 most recent activity events across the team
   * (photos, time entries, materials, invoices).
   * Available to all team members (owner + members).
   */
  activity: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;

    // Resolve team and role
    const ownedTeam = await ctx.db.team.findUnique({ where: { ownerId: userId } });
    let artisanId: string;
    let teamId: string | null = null;
    let isMember = false;

    if (ownedTeam) {
      artisanId = userId;
      teamId = ownedTeam.id;
    } else {
      const membership = await ctx.db.teamMember.findUnique({
        where: { userId },
        select: { teamId: true, role: true, team: { select: { ownerId: true } } },
      });
      if (!membership) throw new TRPCError({ code: "FORBIDDEN", message: "Not in a team" });
      artisanId = membership.team.ownerId;
      teamId = membership.teamId;
      isMember = membership.role === "MEMBER";
    }

    // MEMBER: restrict to projects they are assigned to
    let projectIdFilter: { in: string[] } | undefined;
    if (isMember) {
      const assignments = await ctx.db.projectAssignment.findMany({
        where: { userId },
        select: { projectId: true },
      });
      projectIdFilter = { in: assignments.map((a) => a.projectId) };
    }

    // Build project filter — MEMBER sees only assigned projects
    const projectFilter = isMember && projectIdFilter
      ? { artisanId, id: projectIdFilter }
      : { artisanId };

    const creatorSelect = { select: { id: true, name: true, image: true } } as const;

    const [photos, timeEntries, materials, invoices] = await Promise.all([
      ctx.db.photo.findMany({
        where: { project: projectFilter, createdById: { not: null } },
        orderBy: { takenAt: "desc" },
        take: 50,
        select: {
          id: true,
          takenAt: true,
          note: true,
          url: true,
          createdBy: creatorSelect,
          project: { select: { id: true, name: true } },
        },
      }),
      ctx.db.timeEntry.findMany({
        where: { project: projectFilter, createdById: { not: null } },
        orderBy: { date: "desc" },
        take: 50,
        select: {
          id: true,
          date: true,
          hours: true,
          description: true,
          createdBy: creatorSelect,
          project: { select: { id: true, name: true } },
        },
      }),
      ctx.db.material.findMany({
        where: { project: projectFilter, createdById: { not: null } },
        orderBy: { id: "desc" },
        take: 50,
        select: {
          id: true,
          label: true,
          quantity: true,
          unit: true,
          createdBy: creatorSelect,
          project: { select: { id: true, name: true } },
        },
      }),
      ctx.db.invoice.findMany({
        where: { project: projectFilter, createdById: { not: null } },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          number: true,
          type: true,
          createdAt: true,
          createdBy: creatorSelect,
          project: { select: { id: true, name: true } },
        },
      }),
    ]);

    const events = [
      ...photos.map((p) => ({
        id: `photo-${p.id}`,
        type: "photo" as const,
        createdAt: p.takenAt,
        createdBy: p.createdBy,
        project: p.project,
        meta: { note: p.note, url: p.url },
      })),
      ...timeEntries.map((e) => ({
        id: `time-${e.id}`,
        type: "time" as const,
        createdAt: new Date(e.date),
        createdBy: e.createdBy,
        project: e.project,
        meta: { hours: Number(e.hours), description: e.description },
      })),
      ...materials.map((m) => ({
        id: `material-${m.id}`,
        type: "material" as const,
        createdAt: new Date(),
        createdBy: m.createdBy,
        project: m.project,
        meta: { label: m.label, quantity: Number(m.quantity), unit: m.unit },
      })),
      ...invoices.map((i) => ({
        id: `invoice-${i.id}`,
        type: "invoice" as const,
        createdAt: i.createdAt,
        createdBy: i.createdBy,
        project: i.project,
        meta: { number: i.number, invoiceType: i.type },
      })),
    ]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 50);

    return { events, teamId };
  }),
});
