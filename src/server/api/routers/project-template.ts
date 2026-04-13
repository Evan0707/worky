import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";

const templateTaskSchema = z.object({
  title: z.string(),
  priority: z.number().int().min(0).max(2).default(0),
  order: z.number().int().default(0),
});

const templateMaterialSchema = z.object({
  label: z.string(),
  quantity: z.number().default(1),
  unitPrice: z.number().default(0),
  unit: z.string().default("u"),
});

export const projectTemplateRouter = createTRPCRouter({
  list: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const { artisanId, role } = await getArtisanContext(userId, ctx.db);
    requireRole(role, ["OWNER", "ADMIN"]);

    const plan = await getEffectivePlan(userId, ctx.db);
    if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

    return ctx.db.projectTemplate.findMany({
      where: { artisanId },
      orderBy: { name: "asc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        tasks: z.array(templateTaskSchema).default([]),
        materials: z.array(templateMaterialSchema).default([]),
        tags: z.array(z.string()).default([]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

      return ctx.db.projectTemplate.create({
        data: {
          name: input.name,
          description: input.description,
          tasks: input.tasks,
          materials: input.materials,
          tags: input.tags,
          artisanId,
        },
      });
    }),

  createFromProject: protectedProcedure
    .input(z.object({ projectId: z.string(), name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
        include: {
          tasks: { select: { title: true, priority: true }, orderBy: { createdAt: "asc" } },
          materials: { select: { label: true, quantity: true, unitPrice: true, unit: true } },
          tags: { include: { tag: { select: { name: true } } } },
        },
      });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectTemplate.create({
        data: {
          name: input.name,
          description: project.description ?? undefined,
          tasks: project.tasks.map((t, i) => ({ title: t.title, priority: t.priority, order: i })),
          materials: project.materials.map((m) => ({
            label: m.label,
            quantity: Number(m.quantity),
            unitPrice: Number(m.unitPrice),
            unit: m.unit,
          })),
          tags: project.tags.map((pt) => pt.tag.name),
          artisanId,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).nullable().optional(),
        tasks: z.array(templateTaskSchema).optional(),
        materials: z.array(templateMaterialSchema).optional(),
        tags: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

      const tpl = await ctx.db.projectTemplate.findUnique({ where: { id: input.id } });
      if (!tpl || tpl.artisanId !== artisanId) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectTemplate.update({
        where: { id: input.id },
        data: {
          ...(input.name !== undefined && { name: input.name }),
          ...(input.description !== undefined && { description: input.description }),
          ...(input.tasks !== undefined && { tasks: input.tasks }),
          ...(input.materials !== undefined && { materials: input.materials }),
          ...(input.tags !== undefined && { tags: input.tags }),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const tpl = await ctx.db.projectTemplate.findUnique({ where: { id: input.id } });
      if (!tpl || tpl.artisanId !== artisanId) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.projectTemplate.delete({ where: { id: input.id } });
    }),

  applyToProject: protectedProcedure
    .input(z.object({ templateId: z.string(), projectId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const [tpl, project] = await Promise.all([
        ctx.db.projectTemplate.findUnique({ where: { id: input.templateId } }),
        ctx.db.project.findFirst({ where: { id: input.projectId, artisanId } }),
      ]);
      if (!tpl || tpl.artisanId !== artisanId || !project)
        throw new TRPCError({ code: "NOT_FOUND" });

      const tasks = tpl.tasks as { title: string; priority: number; order: number }[];
      const materials = tpl.materials as { label: string; quantity: number; unitPrice: number; unit: string }[];

      await ctx.db.$transaction([
        ...tasks.map((t) =>
          ctx.db.task.create({
            data: {
              projectId: input.projectId,
              title: t.title,
              priority: t.priority,
              createdById: userId,
            },
          }),
        ),
        ...materials.map((m) =>
          ctx.db.material.create({
            data: {
              projectId: input.projectId,
              label: m.label,
              quantity: m.quantity,
              unitPrice: m.unitPrice,
              unit: m.unit,
              createdById: userId,
            },
          }),
        ),
      ]);

      return { ok: true };
    }),
});
