import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "@/server/api/trpc";

// Max ACTIVE/PAUSED projects for FREE plan
const FREE_PLAN_PROJECT_LIMIT = 3;

export const projectRouter = createTRPCRouter({
  /**
   * List all projects for the authenticated artisan
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.project.findMany({
      where: { artisanId: ctx.session.user.id! },
      include: {
        _count: { select: { photos: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  /**
   * Get a single project by ID (must belong to the artisan)
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: {
          id: input.id,
          artisanId: ctx.session.user.id!,
        },
        include: {
          photos: { orderBy: { takenAt: "desc" } },
          timeEntries: { orderBy: { date: "desc" } },
          materials: true,
        },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return project;
    }),

  /**
   * Create a new project (enforces FREE plan limit of 3 active/paused)
   */
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
      // Check FREE plan limit
      if (ctx.session.user.plan === "FREE") {
        const activeCount = await ctx.db.project.count({
          where: {
            artisanId: ctx.session.user.id!,
            status: { in: ["ACTIVE", "PAUSED"] },
          },
        });
        if (activeCount >= FREE_PLAN_PROJECT_LIMIT) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `Plan FREE limité à ${FREE_PLAN_PROJECT_LIMIT} chantiers actifs. Passez au plan PRO pour des chantiers illimités.`,
          });
        }
      }

      return ctx.db.project.create({
        data: {
          ...input,
          artisanId: ctx.session.user.id!,
          shareToken: uuidv4(),
        },
      });
    }),

  /**
   * Update a project
   */
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
      const { id, ...data } = input;

      const project = await ctx.db.project.findFirst({
        where: { id, artisanId: ctx.session.user.id! },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.project.update({
        where: { id },
        data,
      });
    }),

  /**
   * Soft delete: set status to DONE
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId: ctx.session.user.id! },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: { status: "DONE" },
      });
    }),

  /**
   * Get project by share token (public - no auth required)
   * NEVER expose artisanId, stripeCustomerId, or financial data
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
            select: {
              name: true,
              companyName: true,
              image: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Ce lien de partage est invalide ou a expiré.",
        });
      }

      // Check expiration
      if (
        project.shareExpiresAt &&
        project.shareExpiresAt < new Date()
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce lien de partage a expiré.",
        });
      }

      return project;
    }),

  /**
   * Regenerate share token (invalidates the old link)
   */
  regenerateToken: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        shareExpiresAt: z.date().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.id, artisanId: ctx.session.user.id! },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.project.update({
        where: { id: input.id },
        data: {
          shareToken: uuidv4(),
          shareExpiresAt: input.shareExpiresAt,
        },
        select: { shareToken: true, shareExpiresAt: true },
      });
    }),
});
