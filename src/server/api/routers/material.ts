import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { Decimal } from "@prisma/client/runtime/library";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

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

      // Fetch artisan VAT rate
      const user = await ctx.db.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { vatRate: true },
      });

      const vatRate = Number(user?.vatRate ?? 20);

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
          quantity: new Decimal(input.quantity),
          unitPrice: new Decimal(input.unitPrice),
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
          ...(quantity !== undefined ? { quantity: new Decimal(quantity) } : {}),
          ...(unitPrice !== undefined
            ? { unitPrice: new Decimal(unitPrice) }
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
