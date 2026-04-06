import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { render } from "@react-email/render";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";
import { env } from "@/env";
import { ClientShareEmail } from "../../../../emails/client-share";

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

const FREE_PLAN_PROJECT_LIMIT = 3;

const nextStepSchema = z.object({ text: z.string(), done: z.boolean() });
const nextStepsSchema = z.array(nextStepSchema);
export type NextStep = z.infer<typeof nextStepSchema>;

export const projectRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);
    return ctx.db.project.findMany({
      where: { artisanId },
      include: { _count: { select: { photos: true } } },
      orderBy: { createdAt: "desc" },
    });
  }),

  getDashboardStats: protectedProcedure.query(async ({ ctx }) => {
    const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);

    const [totalProjects, activeProjects, totalPhotos, timeAggregation] =
      await Promise.all([
        ctx.db.project.count({ where: { artisanId } }),
        ctx.db.project.count({ where: { artisanId, status: "ACTIVE" } }),
        ctx.db.photo.count({ where: { project: { artisanId } } }),
        ctx.db.timeEntry.aggregate({
          where: { project: { artisanId } },
          _sum: { hours: true },
        }),
      ]);

    const totalHours = Number(timeAggregation._sum.hours || 0);

    return { totalProjects, activeProjects, totalPhotos, totalHours };
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId },
        include: {
          photos: { orderBy: { takenAt: "desc" } },
          timeEntries: { orderBy: { date: "desc" } },
          materials: true,
          clientActions: { orderBy: { createdAt: "desc" } }
        },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      return project;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        address: z.string().min(1).max(500),
        clientName: z.string().min(1).max(200),
        clientPhone: z.string().optional(),
        clientEmail: z.string().email().optional(),
        description: z.string().max(2000).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);
      const plan = await getEffectivePlan(ctx.session.user.id!, ctx.db);

      if (plan === "FREE") {
        const activeCount = await ctx.db.project.count({
          where: { artisanId, status: { in: ["ACTIVE", "PAUSED"] } },
        });
        if (activeCount >= FREE_PLAN_PROJECT_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Plan FREE limité à ${FREE_PLAN_PROJECT_LIMIT} chantiers actifs. Passez au plan PRO pour des chantiers illimités.`,
          });
        }
      }

      return ctx.db.project.create({
        data: { ...input, artisanId, shareToken: crypto.randomUUID() },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        address: z.string().min(1).max(500).optional(),
        status: z.enum(["ACTIVE", "PAUSED", "DONE"]).optional(),
        progress: z.number().min(0).max(100).optional(),
        budget: z.number().positive().nullable().optional(),
        clientName: z.string().min(1).max(200).optional(),
        clientPhone: z.string().optional(),
        clientEmail: z.string().email().optional(),
        description: z.string().max(2000).optional(),
        nextSteps: nextStepsSchema.optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        shareExpiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);
      const { id, ...data } = input;

      const project = await ctx.db.project.findFirst({
        where: { id, artisanId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.project.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.project.update({
        where: { id: input.id },
        data: { status: "DONE" },
      });
    }),

  /**
   * Public — no auth. NEVER expose artisanId or financial data.
   */
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findUnique({
        where: { shareToken: input.token },
        select: {
          id: true,
          name: true,
          status: true,
          description: true,
          address: true,
          startDate: true,
          endDate: true,
          nextSteps: true,
          clientName: true,
          shareExpiresAt: true,
          photos: {
            select: { id: true, url: true, note: true, takenAt: true },
            orderBy: { takenAt: "desc" },
          },
          invoices: {
            where: { status: { in: ["SENT", "PAID"] } },
            select: { id: true, number: true, totalTTC: true, status: true, dueAt: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
          clientActions: {
            select: { id: true, type: true, payload: true, createdAt: true },
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { photos: true } },
          artisan: {
            select: { name: true, companyName: true, image: true, logoUrl: true },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ce lien de partage est invalide ou a expiré.",
        });
      }

      if (project.shareExpiresAt && project.shareExpiresAt < new Date()) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce lien de partage a expiré.",
        });
      }

      return project;
    }),

  markClientViewed: publicProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.project.update({
        where: { shareToken: input.token },
        data: { clientLastViewedAt: new Date() },
      });
      return { success: true };
    }),

  regenerateToken: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        shareExpiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.project.update({
        where: { id: input.id },
        data: { shareToken: crypto.randomUUID(), shareExpiresAt: input.shareExpiresAt },
        select: { shareToken: true, shareExpiresAt: true },
      });
    }),

  addClientSignature: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        signatureBase64: z.string(),
        shouldClose: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);
      
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Run as transaction if we need to update project status too
      return ctx.db.$transaction(async (tx) => {
        const action = await tx.clientAction.create({
          data: {
            projectId: input.projectId,
            type: "SIGNATURE",
            payload: { signature: input.signatureBase64 },
          },
        });

        if (input.shouldClose) {
          await tx.project.update({
            where: { id: input.projectId },
            data: { status: "DONE" },
          });
        }

        return action;
      });
    }),

  /**
   * Send the project share link to the client by email via Resend.
   * Requires clientEmail on the project.
   */
  sendShareEmail: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id!, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId },
        select: {
          id: true, name: true, clientName: true, clientEmail: true,
          shareToken: true,
        },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });
      if (!project.clientEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No client email on this project." });
      }
      if (!resend) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Email service not configured." });
      }

      const artisan = await ctx.db.user.findUnique({
        where: { id: artisanId },
        select: { name: true, companyName: true, locale: true },
      });

      const shareUrl = `${env.NEXT_PUBLIC_APP_URL}/c/${project.shareToken}`;
      const locale = (artisan?.locale ?? "fr-FR") as "fr-FR" | "en-GB" | "de-DE" | "es-ES";
      const host = new URL(env.NEXT_PUBLIC_APP_URL).host;

      const emailHtml = await render(
        ClientShareEmail({
          clientName: project.clientName,
          artisanName: artisan?.companyName ?? artisan?.name ?? "",
          projectName: project.name,
          shareUrl,
          host,
          locale,
        })
      );

      await resend.emails.send({
        from: env.AUTH_EMAIL_FROM,
        to: project.clientEmail,
        subject: `${artisan?.companyName ?? artisan?.name} — Suivi de votre chantier`,
        html: emailHtml,
      });

      return { success: true };
    }),
});
