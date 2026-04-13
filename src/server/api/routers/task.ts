import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type TaskStatus } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

export const taskRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.task.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    }),

  listMyTasks: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const { artisanId } = await getArtisanContext(userId, ctx.db);

    return ctx.db.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        project: { artisanId },
      },
      orderBy: [{ priority: "desc" }, { dueDate: "asc" }],
      include: {
        project: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        dueDate: z.string().datetime().optional(),
        assigneeId: z.string().optional(),
        priority: z.number().int().min(0).max(2).default(0),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.task.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
          assigneeId: input.assigneeId,
          priority: input.priority,
          createdById: userId,
        },
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).max(200).optional(),
        description: z.string().max(1000).nullable().optional(),
        status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
        dueDate: z.string().datetime().nullable().optional(),
        assigneeId: z.string().nullable().optional(),
        priority: z.number().int().min(0).max(2).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true, id: true } } },
      });
      if (!task || task.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // MEMBERs can only update status of tasks assigned to them,
      // AND only on projects they are assigned to
      if (role === "MEMBER") {
        const assignment = await ctx.db.projectAssignment.findUnique({
          where: { projectId_userId: { projectId: task.project.id, userId } },
        });
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });

        const allowedFields = Object.keys(input).filter((k) => k !== "id");
        if (allowedFields.some((k) => k !== "status") || task.assigneeId !== userId) {
          requireRole(role, ["OWNER", "ADMIN"]);
        }
      }

      const completedAt =
        input.status === "DONE" && task.status !== "DONE"
          ? new Date()
          : input.status !== "DONE" && task.status === "DONE"
            ? null
            : undefined;

      return ctx.db.task.update({
        where: { id: input.id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.status !== undefined && { status: input.status as TaskStatus }),
          ...(input.dueDate !== undefined && { dueDate: input.dueDate ? new Date(input.dueDate) : null }),
          ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
          ...(input.priority !== undefined && { priority: input.priority }),
          ...(completedAt !== undefined && { completedAt }),
        },
        include: {
          assignee: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const task = await ctx.db.task.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true, id: true } } },
      });
      if (!task || task.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // MEMBER must be assigned to the project to delete their own tasks
      if (role === "MEMBER") {
        const assignment = await ctx.db.projectAssignment.findUnique({
          where: { projectId_userId: { projectId: task.project.id, userId } },
        });
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (task.createdById !== userId) {
        requireRole(role, ["OWNER", "ADMIN"]);
      }

      return ctx.db.task.delete({ where: { id: input.id } });
    }),
});
