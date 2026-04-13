import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

export const messageRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(30),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const items = await ctx.db.message.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
        include: { author: { select: { id: true, name: true } } },
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items: items.reverse(), nextCursor };
    }),

  send: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        content: z.string().min(1).max(2000),
        photoUrl: z.string().url().optional(),
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

      return ctx.db.message.create({
        data: {
          projectId: input.projectId,
          content: input.content,
          photoUrl: input.photoUrl,
          authorId: userId,
        },
        include: { author: { select: { id: true, name: true } } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const message = await ctx.db.message.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true } } },
      });

      if (!message || message.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      if (message.authorId !== userId) {
        requireRole(role, ["OWNER", "ADMIN"]);
      }

      return ctx.db.message.delete({ where: { id: input.id } });
    }),
});
