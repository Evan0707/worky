import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const photoRouter = createTRPCRouter({
  /**
   * List photos by project ID
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      // Verify ownership
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.photo.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ order: "asc" }, { takenAt: "desc" }],
      });
    }),

  /**
   * Update photos order
   */
  updateOrder: protectedProcedure
    .input(z.object({
      projectId: z.string(),
      orders: z.array(z.object({ id: z.string(), order: z.number() })),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Execute a transaction to update all orders
      await ctx.db.$transaction(
        input.orders.map((item) =>
          ctx.db.photo.update({
            where: { id: item.id },
            data: { order: item.order },
          })
        )
      );

      return { success: true };
    }),

  /**
   * Update photo note
   */
  updateNote: protectedProcedure
    .input(z.object({ id: z.string(), note: z.string().max(1000) }))
    .mutation(async ({ ctx, input }) => {
      // Verify ownership via project relation
      const photo = await ctx.db.photo.findFirst({
        where: {
          id: input.id,
          project: { artisanId: ctx.session.user.id },
        },
      });

      if (!photo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.photo.update({
        where: { id: input.id },
        data: { note: input.note },
      });
    }),

  /**
   * Delete photo (also deletes from UploadThing via UTApi)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const photo = await ctx.db.photo.findFirst({
        where: {
          id: input.id,
          project: { artisanId: ctx.session.user.id },
        },
      });

      if (!photo) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Delete from DB (UploadThing deletion handled separately if needed)
      await ctx.db.photo.delete({ where: { id: input.id } });

      return { deleted: true, key: photo.key };
    }),

  /**
   * Save photo metadata after UploadThing upload
   * Called from UploadThing onUploadComplete callback
   */
  save: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        url: z.string().url(),
        key: z.string(),
        note: z.string().optional(),
        lat: z.number().optional(),
        lng: z.number().optional(),
        takenAt: z.date().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify ownership
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      return ctx.db.photo.create({
        data: {
          projectId: input.projectId,
          url: input.url,
          key: input.key,
          note: input.note,
          lat: input.lat,
          lng: input.lng,
          takenAt: input.takenAt ?? new Date(),
        },
      });
    }),
});
