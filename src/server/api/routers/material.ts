import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type VatScheme } from "@prisma/client";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";
import { pusher } from "@/lib/pusher";

function vatRateForScheme(scheme: VatScheme): number {
  switch (scheme) {
    case "STANDARD":
      return 20;
    case "REDUCED":
      return 10;
    case "MICRO_ENTREPRENEUR":
    case "EXEMPT":
    case "REVERSE_CHARGE":
      return 0;
    default:
      return 20;
  }
}

export const materialRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      const projectWhere = role === "MEMBER"
        ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
        : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const materials = await ctx.db.material.findMany({
        where: { projectId: input.projectId },
        include: { createdBy: { select: { name: true } } },
      });

      // Resolve VAT from the artisan owner (artisanId), not necessarily the current user
      const owner = await ctx.db.user.findUnique({
        where: { id: artisanId },
        select: { vatScheme: true },
      });

      const vatRate = vatRateForScheme(owner?.vatScheme ?? "STANDARD");

      const totalHT = materials.reduce(
        (sum, m) => sum + Number(m.unitPrice) * Number(m.quantity),
        0,
      );
      const totalTVA = totalHT * (vatRate / 100);
      const totalTTC = totalHT + totalTVA;

      return { materials, totalHT, totalTVA, totalTTC, vatRate };
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        label: z.string().min(1).max(300),
        quantity: z.number().positive(),
        unit: z.string().default("u"),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role, teamId } = await getArtisanContext(userId, ctx.db);
      // All roles can add materials — but MEMBER only on assigned projects
      const projectWhere = role === "MEMBER"
        ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
        : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const material = await ctx.db.material.create({
        data: {
          projectId: input.projectId,
          label: input.label,
          quantity: input.quantity,
          unit: input.unit,
          unitPrice: input.unitPrice,
          createdById: ctx.session.user.id,
        },
      });

      // Pusher: notify team channel
      if (teamId) {
        const memberName = ctx.session.user.name ?? ctx.session.user.email ?? "Quelqu'un";
        void pusher.trigger(`private-team-${teamId}`, "material:added", {
          memberName,
          projectName: project.name,
          label: input.label,
        });
      }

      return material;
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(300).optional(),
        quantity: z.number().positive().optional(),
        unit: z.string().optional(),
        unitPrice: z.number().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId, role } = await getArtisanContext(ctx.session.user.id, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const material = await ctx.db.material.findFirst({
        where: { id: input.id, project: { artisanId } },
      });

      if (!material) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, quantity, unitPrice, ...rest } = input;

      return ctx.db.material.update({
        where: { id },
        data: {
          ...rest,
          ...(quantity !== undefined ? { quantity } : {}),
          ...(unitPrice !== undefined ? { unitPrice } : {}),
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { artisanId, role } = await getArtisanContext(ctx.session.user.id, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const material = await ctx.db.material.findFirst({
        where: { id: input.id, project: { artisanId } },
      });

      if (!material) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.material.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
