import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { type PrismaClient } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";
import { type TeamRole } from "@prisma/client";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const INVITE_EXPIRY_DAYS = 7;

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireOwner(userId: string, db: PrismaClient) {
  const team = await db.team.findUnique({
    where: { ownerId: userId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: "asc" },
      },
      invitations: {
        where: { acceptedAt: null, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!team) {
    throw new TRPCError({ code: "FORBIDDEN", message: "You are not a team owner" });
  }
  return team;
}

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

  /**
   * Create a team (user becomes OWNER).
   * A user can only own one team and cannot be a member of another team.
   */
  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;

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
        await resend.emails.send({
          from: env.AUTH_EMAIL_FROM,
          to: input.email,
          subject: `${inviterUser?.name ?? "Someone"} vous invite à rejoindre ${invitation.team.name} sur Worky`,
          html: buildInviteEmail({
            teamName: invitation.team.name,
            inviterName: inviterUser?.name ?? inviterUser?.email ?? "Un utilisateur",
            role: input.role,
            inviteUrl,
            expiryDays: INVITE_EXPIRY_DAYS,
          }),
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
});

// ─── Email builder ────────────────────────────────────────────────────────────

function buildInviteEmail(opts: {
  teamName: string;
  inviterName: string;
  role: string;
  inviteUrl: string;
  expiryDays: number;
}): string {
  const roleLabel = opts.role === "ADMIN" ? "Administrateur" : "Membre";
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:40px 20px;background:#fff;border-radius:8px">
      <h1 style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 8px">Worky</h1>
      <h2 style="color:#333;font-size:18px;font-weight:600;margin:0 0 20px">Invitation à rejoindre une équipe</h2>
      <p style="color:#444;font-size:15px;line-height:1.6">
        <strong>${opts.inviterName}</strong> vous invite à rejoindre l'équipe <strong>${opts.teamName}</strong>
        sur Worky en tant que <strong>${roleLabel}</strong>.
      </p>
      <div style="text-align:center;margin:32px 0">
        <a href="${opts.inviteUrl}"
           style="background:#1A4F8A;color:#fff;padding:14px 32px;border-radius:6px;
                  font-size:16px;font-weight:600;text-decoration:none;display:inline-block">
          Rejoindre l'équipe
        </a>
      </div>
      <p style="color:#666;font-size:13px">
        Ce lien est valable ${opts.expiryDays} jours. Si vous n'attendiez pas cette invitation, ignorez cet email.
      </p>
    </div>
  `;
}
