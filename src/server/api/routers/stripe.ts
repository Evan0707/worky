import Stripe from "stripe";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { env } from "@/env";

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export const stripeRouter = createTRPCRouter({
  /**
   * Create (or resume) a Stripe subscription intent for in-app Payment Element.
   *
   * Security guarantees:
   *  - Already PRO → rejected
   *  - Pending subscription exists → returns its existing intent (idempotent, no duplicate)
   *  - proTrialUsed = true → resubscribe without trial
   *  - Stripe idempotency key on subscription create → safe against concurrent calls
   */
  createSubscriptionIntent: protectedProcedure.mutation(async ({ ctx }) => {
    if (!env.STRIPE_PRICE_ID_PRO) {
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Stripe price not configured" });
    }

    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: {
        email: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        plan: true,
        proTrialUsed: true,
      },
    });

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // ── Guard: already an active PRO subscriber ──────────────────────────────
    if (user.plan === "PRO") {
      throw new TRPCError({ code: "BAD_REQUEST", message: "Already subscribed to PRO" });
    }

    // ── Guard: pending subscription already exists — return existing intent ──
    // This makes the mutation idempotent: re-opening the dialog returns the same
    // intent instead of creating a duplicate subscription.
    if (user.stripeSubscriptionId) {
      try {
        const existing = await stripe.subscriptions.retrieve(user.stripeSubscriptionId, {
          expand: ["pending_setup_intent", "latest_invoice.payment_intent"],
        });

        if (["active", "trialing"].includes(existing.status)) {
          // Somehow already active but plan not updated — activate silently
          await ctx.db.user.update({
            where: { id: ctx.session.user.id },
            data: { plan: "PRO", proTrialUsed: true },
          });
          throw new TRPCError({ code: "BAD_REQUEST", message: "Already subscribed to PRO" });
        }

        if (existing.status === "incomplete" || existing.status === "trialing") {
          // Return the existing pending intent — do NOT create a new subscription
          if (existing.pending_setup_intent) {
            const si = existing.pending_setup_intent as Stripe.SetupIntent;
            if (si.client_secret) {
              return { clientSecret: si.client_secret, type: "setup" as const };
            }
          }
          const invoice = existing.latest_invoice as Stripe.Invoice | null;
          const pi = invoice?.payment_intent as Stripe.PaymentIntent | null;
          if (pi?.client_secret) {
            return { clientSecret: pi.client_secret, type: "payment" as const };
          }
        }

        // Subscription is cancelled/incomplete_expired → clean up and continue
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { stripeSubscriptionId: null },
        });
      } catch (err) {
        if (err instanceof TRPCError) throw err;
        // Stripe returned 404 (deleted sub) → clean up reference and continue
        await ctx.db.user.update({
          where: { id: ctx.session.user.id },
          data: { stripeSubscriptionId: null },
        });
      }
    }

    // ── Find or create Stripe customer ───────────────────────────────────────
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { userId: ctx.session.user.id },
      });
      customerId = customer.id;
      await ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // ── Create subscription ──────────────────────────────────────────────────
    // Trial only offered once. Idempotency key prevents duplicate subscriptions
    // if the client fires this mutation twice concurrently.
    const withTrial = !user.proTrialUsed;

    const subscription = await stripe.subscriptions.create(
      {
        customer: customerId,
        items: [{ price: env.STRIPE_PRICE_ID_PRO }],
        ...(withTrial ? { trial_period_days: 14 } : {}),
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["pending_setup_intent", "latest_invoice.payment_intent"],
        metadata: { userId: ctx.session.user.id },
      },
      {
        // Deterministic key: only one subscription can be created per user per day.
        // Stripe returns the existing object if called again within 24h.
        idempotencyKey: `sub_create_${ctx.session.user.id}_${new Date().toISOString().slice(0, 10)}`,
      },
    );

    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: { stripeSubscriptionId: subscription.id },
    });

    // Trialing → SetupIntent (collect card, no charge yet)
    if (subscription.status === "trialing" && subscription.pending_setup_intent) {
      const si = subscription.pending_setup_intent as Stripe.SetupIntent;
      if (si.client_secret) {
        return { clientSecret: si.client_secret, type: "setup" as const };
      }
    }

    // Immediate payment (no trial)
    const invoice = subscription.latest_invoice as Stripe.Invoice;
    const pi = invoice?.payment_intent as Stripe.PaymentIntent | null;
    if (pi?.client_secret) {
      return { clientSecret: pi.client_secret, type: "payment" as const };
    }

    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not retrieve payment intent" });
  }),

  /**
   * Called client-side after Stripe confirms the intent successfully.
   * Verifies the subscription with Stripe (source of truth) and activates PRO in DB.
   *
   * Security guarantees:
   *  - Only updates the authenticated user's own record
   *  - Cross-checks that the stored subscriptionId belongs to this user's customerId (IDOR)
   *  - Verifies status with Stripe — cannot be faked client-side
   *  - Sets proTrialUsed = true to prevent future trials
   */
  activateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeSubscriptionId: true, stripeCustomerId: true, plan: true },
    });

    if (user?.plan === "PRO") {
      // Already activated (idempotent call — no error)
      return { plan: "PRO" as const };
    }

    if (!user?.stripeSubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No subscription found" });
    }

    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    // IDOR check: subscription must belong to this user's Stripe customer
    if (user.stripeCustomerId && subscription.customer !== user.stripeCustomerId) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Subscription does not belong to this account" });
    }

    const isActive = ["active", "trialing"].includes(subscription.status);
    if (!isActive) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Subscription not yet active (status: ${subscription.status})`,
      });
    }

    await ctx.db.user.update({
      where: { id: ctx.session.user.id },
      data: {
        plan: "PRO",
        proTrialUsed: true, // prevent future free trials
      },
    });

    return { plan: "PRO" as const };
  }),

  /**
   * Get current subscription details directly from Stripe
   */
  getSubscriptionDetails: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeSubscriptionId: true, plan: true },
    });

    if (!user?.stripeSubscriptionId) {
      return { plan: user?.plan ?? "FREE", subscription: null };
    }

    try {
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      return {
        plan: user.plan,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          current_period_end: subscription.current_period_end,
          cancel_at_period_end: subscription.cancel_at_period_end,
          trial_end: subscription.trial_end,
        },
      };
    } catch {
      return { plan: user.plan, subscription: null };
    }
  }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return { success: true, cancel_at_period_end: subscription.cancel_at_period_end };
  }),

  /**
   * Resume a subscription set to cancel at period end
   */
  resumeSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { stripeSubscriptionId: true },
    });

    if (!user?.stripeSubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No subscription found" });
    }

    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return { success: true, cancel_at_period_end: subscription.cancel_at_period_end };
  }),
});
