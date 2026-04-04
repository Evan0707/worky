import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

export const timeEntryRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const entries = await ctx.db.timeEntry.findMany({
        where: { projectId: input.projectId },
        orderBy: { date: "desc" },
      });

      const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

      return { entries, totalHours };
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        date: z.date(),
        hours: z.number().min(0.5).max(24),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const inputDate = new Date(input.date);
      inputDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Time entry date cannot be in the future.",
        });
      }

      return ctx.db.timeEntry.create({
        data: {
          projectId: input.projectId,
          date: input.date,
          hours: input.hours,
          description: input.description,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        date: z.date().optional(),
        hours: z.number().min(0.5).max(24).optional(),
        description: z.string().max(500).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const entry = await ctx.db.timeEntry.findFirst({
        where: { id: input.id, project: { artisanId } },
      });

      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, hours, ...rest } = input;

      return ctx.db.timeEntry.update({
        where: { id },
        data: {
          ...rest,
          ...(hours !== undefined ? { hours } : {}),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const entry = await ctx.db.timeEntry.findFirst({
        where: { id: input.id, project: { artisanId } },
      });

      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.timeEntry.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
