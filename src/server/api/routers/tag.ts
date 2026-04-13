import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

export const tagRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const { artisanId } = await getArtisanContext(userId, ctx.db);
    return ctx.db.tag.findMany({
      where: { artisanId },
      orderBy: { name: "asc" },
      include: { _count: { select: { projectTags: true } } },
    });
  }),

  create: protectedProcedure
    .input(z.object({ name: z.string().min(1).max(50), color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#6366f1") }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      return ctx.db.tag.create({
        data: { name: input.name, color: input.color, artisanId },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const tag = await ctx.db.tag.findUnique({ where: { id: input.id } });
      if (!tag || tag.artisanId !== artisanId) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.tag.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.color !== undefined && { color: input.color }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const tag = await ctx.db.tag.findUnique({ where: { id: input.id } });
      if (!tag || tag.artisanId !== artisanId) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.tag.delete({ where: { id: input.id } });
    }),

  attachToProject: protectedProcedure
    .input(z.object({ tagId: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const [tag, project] = await Promise.all([
        ctx.db.tag.findUnique({ where: { id: input.tagId } }),
        ctx.db.project.findFirst({ where: { id: input.projectId, artisanId } }),
      ]);
      if (!tag || tag.artisanId !== artisanId || !project)
        throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectTag.upsert({
        where: { projectId_tagId: { projectId: input.projectId, tagId: input.tagId } },
        create: { projectId: input.projectId, tagId: input.tagId },
        update: {},
      });
    }),

  detachFromProject: protectedProcedure
    .input(z.object({ tagId: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const project = await ctx.db.project.findFirst({ where: { id: input.projectId, artisanId } });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectTag.delete({
        where: { projectId_tagId: { projectId: input.projectId, tagId: input.tagId } },
      });
    }),

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

      const pts = await ctx.db.projectTag.findMany({
        where: { projectId: input.projectId },
        include: { tag: true },
      });
      return pts.map((pt) => pt.tag);
    }),
});
