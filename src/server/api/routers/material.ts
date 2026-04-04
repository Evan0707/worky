import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { type VatScheme } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

/** Map VatScheme enum to the standard percentage for that regime. */
function vatRateForScheme(scheme: VatScheme): number {
  switch (scheme) {
    case "STANDARD":
      return 20; // FR 20%, adjust per country at display layer
    case "REDUCED":
      return 10; // FR 10% construction works
    case "MICRO_ENTREPRENEUR":
    case "EXEMPT":
    case "REVERSE_CHARGE":
      return 0;
    default:
      return 20;
  }
}

export const materialRouter = createTRPCRouter({
  /**
   * List materials for a project
   */
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const materials = await ctx.db.material.findMany({
        where: { projectId: input.projectId },
      });

      // Derive VAT rate from artisan's vatScheme (CDC §10.2 — stored in schema not on invoice)
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { vatScheme: true },
      });

      const vatRate = vatRateForScheme(user?.vatScheme ?? "STANDARD");

      const totalHT = materials.reduce(
        (sum, m) => sum + Number(m.unitPrice) * Number(m.quantity),
        0,
      );
      const totalTVA = totalHT * (vatRate / 100);
      const totalTTC = totalHT + totalTVA;

      return { materials, totalHT, totalTVA, totalTTC, vatRate };
    }),

  /**
   * Create a material
   */
  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        label: z.string().min(1).max(300),
        quantity: z.number().positive(),
        unitPrice: z.number().nonnegative(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId: ctx.session.user.id },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.material.create({
        data: {
          projectId: input.projectId,
          label: input.label,
          quantity: (input.quantity),
          unitPrice: (input.unitPrice),
        },
      });
    }),

  /**
   * Update a material
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        label: z.string().min(1).max(300).optional(),
        quantity: z.number().positive().optional(),
        unitPrice: z.number().nonnegative().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.db.material.findFirst({
        where: { id: input.id, project: { artisanId: ctx.session.user.id } },
      });

      if (!material) throw new TRPCError({ code: "NOT_FOUND" });

      const { id, quantity, unitPrice, ...rest } = input;

      return ctx.db.material.update({
        where: { id },
        data: {
          ...rest,
          ...(quantity !== undefined ? { quantity: (quantity) } : {}),
          ...(unitPrice !== undefined
            ? { unitPrice: (unitPrice) }
            : {}),
        },
      });
    }),

  /**
   * Delete a material
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const material = await ctx.db.material.findFirst({
        where: { id: input.id, project: { artisanId: ctx.session.user.id } },
      });

      if (!material) throw new TRPCError({ code: "NOT_FOUND" });

      await ctx.db.material.delete({ where: { id: input.id } });
      return { deleted: true };
    }),
});
