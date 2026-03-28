import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const userRouter = createTRPCRouter({
  /**
   * Get artisan profile
   */
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        plan: true,
        companyName: true,
        siret: true,
        companyAddress: true,
        logoUrl: true,
        hourlyRate: true,
        vatRate: true,
        iban: true,
        createdAt: true,
        // NEVER expose stripeCustomerId, stripeSubscriptionId
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    return user;
  }),

  /**
   * Update artisan profile
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200).optional(),
        companyName: z.string().max(200).optional(),
        siret: z.string().max(14).optional(),
        companyAddress: z.string().max(500).optional(),
        logoUrl: z.string().url().optional(),
        logoKey: z.string().optional(),
        hourlyRate: z.number().nonnegative().optional(),
        vatRate: z.number().min(0).max(100).optional(),
        iban: z.string().max(34).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { hourlyRate, vatRate, ...rest } = input;
      const { Decimal } = await import("@prisma/client/runtime/library");

      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...rest,
          ...(hourlyRate !== undefined
            ? { hourlyRate: new Decimal(hourlyRate) }
            : {}),
          ...(vatRate !== undefined ? { vatRate: new Decimal(vatRate) } : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          siret: true,
          companyAddress: true,
          logoUrl: true,
          hourlyRate: true,
          vatRate: true,
          iban: true,
        },
      });
    }),
});
