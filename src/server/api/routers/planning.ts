import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";

export const planningRouter = createTRPCRouter({
  getEvents: protectedProcedure
    .input(
      z.object({
        startDate: z.string().datetime(),
        endDate: z.string().datetime(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      // PRO plan required for planning
      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
      }

      const start = new Date(input.startDate);
      const end = new Date(input.endDate);

      // For MEMBERs, only show events from their assigned projects
      const assignedProjectIds: string[] | null =
        role === "MEMBER"
          ? (await ctx.db.projectAssignment.findMany({
              where: { userId },
              select: { projectId: true },
            })).map((a) => a.projectId)
          : null;

      const [projects, tasks, timeEntries] = await Promise.all([
        // Projects with dates in range
        ctx.db.project.findMany({
          where: {
            artisanId,
            status: { in: ["ACTIVE", "PAUSED"] },
            ...(assignedProjectIds && { id: { in: assignedProjectIds } }),
            OR: [
              { startDate: { gte: start, lte: end } },
              { endDate: { gte: start, lte: end } },
              { startDate: { lte: start }, endDate: { gte: end } },
            ],
          },
          select: {
            id: true,
            name: true,
            startDate: true,
            endDate: true,
            status: true,
            clientName: true,
          },
        }),
        // Tasks with due dates in range
        ctx.db.task.findMany({
          where: {
            project: {
              artisanId,
              ...(assignedProjectIds && { id: { in: assignedProjectIds } }),
            },
            dueDate: { gte: start, lte: end },
            status: { not: "DONE" },
          },
          select: {
            id: true,
            title: true,
            dueDate: true,
            status: true,
            priority: true,
            assigneeId: true,
            projectId: true,
            project: { select: { name: true } },
          },
        }),
        // Time entries in range
        ctx.db.timeEntry.findMany({
          where: {
            project: {
              artisanId,
              ...(assignedProjectIds && { id: { in: assignedProjectIds } }),
            },
            date: { gte: start, lte: end },
          },
          select: {
            id: true,
            date: true,
            hours: true,
            description: true,
            projectId: true,
            project: { select: { name: true } },
          },
        }),
      ]);

      return {
        projects: projects.map((p) => ({
          type: "project" as const,
          id: p.id,
          title: p.name,
          subtitle: p.clientName,
          startDate: p.startDate,
          endDate: p.endDate,
          status: p.status,
        })),
        tasks: tasks.map((t) => ({
          type: "task" as const,
          id: t.id,
          title: t.title,
          date: t.dueDate!,
          priority: t.priority,
          projectId: t.projectId,
          projectName: t.project.name,
        })),
        timeEntries: timeEntries.map((e) => ({
          type: "timeEntry" as const,
          id: e.id,
          date: e.date,
          hours: Number(e.hours),
          description: e.description,
          projectId: e.projectId,
          projectName: e.project.name,
        })),
      };
    }),
});
