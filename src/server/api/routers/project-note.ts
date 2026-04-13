import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

export const projectNoteRouter = createTRPCRouter({
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

      return ctx.db.projectNote.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
        include: { createdBy: { select: { id: true, name: true } } },
      });
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.string(), content: z.string().min(1).max(5000) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectNote.create({
        data: {
          projectId: input.projectId,
          content: input.content,
          createdById: userId,
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().min(1).max(5000).optional(),
        isPinned: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const note = await ctx.db.projectNote.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true } } },
      });

      if (!note || note.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator or OWNER/ADMIN can edit
      if (note.createdById !== userId) {
        requireRole(role, ["OWNER", "ADMIN"]);
      }

      return ctx.db.projectNote.update({
        where: { id: input.id },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.isPinned !== undefined && { isPinned: input.isPinned }),
        },
        include: { createdBy: { select: { id: true, name: true } } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const note = await ctx.db.projectNote.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true } } },
      });

      if (!note || note.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // Only creator or OWNER/ADMIN can delete
      if (note.createdById !== userId) {
        requireRole(role, ["OWNER", "ADMIN"]);
      }

      return ctx.db.projectNote.delete({ where: { id: input.id } });
    }),
});
