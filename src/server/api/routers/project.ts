import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";

const FREE_PLAN_PROJECT_LIMIT = 3;

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

    const [totalProjects, activeProjects, totalPhotos, totalTimeEntries] =
      await Promise.all([
        ctx.db.project.count({ where: { artisanId } }),
        ctx.db.project.count({ where: { artisanId, status: "ACTIVE" } }),
        ctx.db.photo.count({ where: { project: { artisanId } } }),
        ctx.db.timeEntry.findMany({
          where: { project: { artisanId } },
          select: { hours: true },
        }),
      ]);

    const totalHours = totalTimeEntries.reduce(
      (sum, entry) => sum + Number(entry.hours),
      0,
    );

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
        data: { ...input, artisanId, shareToken: uuidv4() },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(200).optional(),
        address: z.string().min(1).max(500).optional(),
        status: z.enum(["ACTIVE", "PAUSED", "DONE"]).optional(),
        clientName: z.string().min(1).max(200).optional(),
        clientPhone: z.string().optional(),
        clientEmail: z.string().email().optional(),
        description: z.string().max(2000).optional(),
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
          clientName: true,
          shareExpiresAt: true,
          photos: {
            select: { id: true, url: true, note: true, takenAt: true },
            orderBy: { takenAt: "desc" },
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
        data: { shareToken: uuidv4(), shareExpiresAt: input.shareExpiresAt },
        select: { shareToken: true, shareExpiresAt: true },
      });
    }),
});
