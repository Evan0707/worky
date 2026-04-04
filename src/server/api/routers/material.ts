import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type VatScheme } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { getArtisanContext } from "@/server/lib/team-context";

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
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const materials = await ctx.db.material.findMany({
        where: { projectId: input.projectId },
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
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.material.create({
        data: {
          projectId: input.projectId,
          label: input.label,
          quantity: input.quantity,
          unit: input.unit,
          unitPrice: input.unitPrice,
        },
      });
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
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

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
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const material = await ctx.db.material.findFirst({
        where: { id: input.id, project: { artisanId } },
      });

      if (!material) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.material.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
