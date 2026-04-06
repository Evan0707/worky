import { env } from "@/env";

/**
 * Maps Stripe Price IDs to team member limits.
 * PRO Solo (15€)  → 0 members
 * PRO Équipe (29€) → 5 members
 * PRO+ (49€)       → 999 (unlimited)
 */
export function maxTeamMembersForPriceId(priceId: string | null | undefined): number {
  if (!priceId) return 0;
  if (priceId === env.STRIPE_PRICE_ID_PRO_PLUS) return 999;
  if (priceId === env.STRIPE_PRICE_ID_PRO_TEAM) return 5;
  return 0; // PRO Solo or unknown
}

export type PlanTier = "PRO" | "PRO_TEAM" | "PRO_PLUS";

/**
 * Derives the PlanTier from a Stripe Price ID.
 */
export function tierFromPriceId(priceId: string | null | undefined): PlanTier | null {
  if (!priceId) return null;
  if (priceId === env.STRIPE_PRICE_ID_PRO_PLUS) return "PRO_PLUS";
  if (priceId === env.STRIPE_PRICE_ID_PRO_TEAM) return "PRO_TEAM";
  if (priceId === env.STRIPE_PRICE_ID_PRO) return "PRO";
  return null;
}

/**
 * Maps our internal PlanTier to actual Stripe Price IDs.
 */
export function getPriceIdForTier(tier: PlanTier): string | undefined {
  switch (tier) {
    case "PRO":
      return env.STRIPE_PRICE_ID_PRO;
    case "PRO_TEAM":
      return env.STRIPE_PRICE_ID_PRO_TEAM;
    case "PRO_PLUS":
      return env.STRIPE_PRICE_ID_PRO_PLUS;
    default:
      return undefined;
  }
}
