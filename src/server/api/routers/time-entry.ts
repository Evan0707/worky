import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const timeEntryRouter = createTRPCRouter({
  /**
   * List time entries for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const entries = await ctx.db.timeEntry.findMany({
        where: { projectId: input.projectId },
        orderBy: { date: "desc" },
      });

      const totalHours = entries.reduce(
        (sum, e) => sum + Number(e.hours),
        0,
      );

      return { entries, totalHours };
    }),

  /**
   * Create a time entry
   */
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
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      // Validate date is not in the future
      const inputDate = new Date(input.date);
      inputDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (inputDate > today) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "La date de pointage ne peut pas être dans le futur.",
        });
      }

      return ctx.db.timeEntry.create({
        data: {
          projectId: input.projectId,
          date: input.date,
          hours: new Decimal(input.hours),
          description: input.description,
        },
      });
    }),

  /**
   * Update a time entry
   */
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
      const entry = await ctx.db.timeEntry.findFirst({
        where: { id: input.id, project: { artisanId: ctx.session.user.id } },
      });

      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, hours, ...rest } = input;

      return ctx.db.timeEntry.update({
        where: { id },
        data: {
          ...rest,
          ...(hours !== undefined ? { hours: new Decimal(hours) } : {}),
        },
      });
    }),

  /**
   * Delete a time entry
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const entry = await ctx.db.timeEntry.findFirst({
        where: { id: input.id, project: { artisanId: ctx.session.user.id } },
      });

      if (!entry) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.timeEntry.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
