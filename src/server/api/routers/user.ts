import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { type VatScheme } from "@prisma/client";

const SUPPORTED_LOCALES = ["fr-FR", "en-GB", "de-DE", "es-ES"] as const;
const SUPPORTED_CURRENCIES = ["EUR", "GBP", "CHF"] as const;
const SUPPORTED_COUNTRIES = ["FR", "BE", "DE", "ES", "NL", "GB", "CH"] as const;

export const userRouter = createTRPCRouter({
  /**
   * Get artisan profile
   * NEVER expose stripeCustomerId, stripeSubscriptionId (CDC §10.1 rule 1)
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
        locale: true,
        country: true,
        currency: true,
        vatScheme: true,
        vatNumber: true,
        companyName: true,
        siret: true,
        steuernummer: true,
        bceNumber: true,
        companyAddress: true,
        logoUrl: true,
        hourlyRate: true,
        iban: true,
        createdAt: true,
        // NEVER expose: stripeCustomerId, stripeSubscriptionId
      },
    });

    if (!user) throw new TRPCError({ code: "NOT_FOUND" });

    return {
      ...user,
      hourlyRate: user.hourlyRate ? Number(user.hourlyRate) : null,
    };
  }),

  /**
   * Update artisan profile (general fields)
   */
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200).optional(),
        companyName: z.string().max(200).optional(),
        siret: z.string().max(14).optional(),
        steuernummer: z.string().max(20).optional(),
        bceNumber: z.string().max(12).optional(),
        vatNumber: z.string().max(20).optional(),
        companyAddress: z.string().max(500).optional(),
        logoUrl: z.string().url().optional(),
        logoKey: z.string().optional(),
        hourlyRate: z.number().nonnegative().optional(),
        iban: z.string().max(34).optional(),
        vatScheme: z
          .enum(["STANDARD", "REDUCED", "MICRO_ENTREPRENEUR", "EXEMPT", "REVERSE_CHARGE"])
          .optional(),
        country: z.enum(SUPPORTED_COUNTRIES).optional(),
        currency: z.enum(SUPPORTED_CURRENCIES).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { hourlyRate, vatScheme, ...rest } = input;

      const updated = await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          ...rest,
          ...(hourlyRate !== undefined ? { hourlyRate } : {}),
          ...(vatScheme !== undefined
            ? { vatScheme: vatScheme as VatScheme }
            : {}),
        },
        select: {
          id: true,
          name: true,
          email: true,
          companyName: true,
          siret: true,
          steuernummer: true,
          bceNumber: true,
          vatNumber: true,
          companyAddress: true,
          logoUrl: true,
          hourlyRate: true,
          iban: true,
          locale: true,
          country: true,
          currency: true,
          vatScheme: true,
        },
      });

      return {
        ...updated,
        hourlyRate: updated.hourlyRate ? Number(updated.hourlyRate) : null,
      };
    }),

  /**
   * Update user locale — persists language preference to DB
   * Used by LocaleSwitcher component (CDC §1.13)
   */
  updateLocale: protectedProcedure
    .input(
      z.object({
        locale: z.enum(SUPPORTED_LOCALES),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { locale: input.locale },
      });
      return { locale: input.locale };
    }),
});
