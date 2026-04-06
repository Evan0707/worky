import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/env";
import { db } from "@/server/db";
import { maxTeamMembersForPriceId } from "@/server/lib/stripe-utils";

const stripe = new Stripe(env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2025-02-24.acacia",
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  console.log("🔔 Webhook Stripe reçu !");

  if (!signature || !env.STRIPE_WEBHOOK_SECRET) {
    console.error("❌ Signature ou Secret manquant");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET,
    );
    console.log(`✅ Événement vérifié : ${event.type}`);
  } catch (err) {
    console.error("❌ Échec de la vérification de la signature Stripe");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        console.log("📦 Session Metadata:", JSON.stringify(session.metadata, null, 2));
        console.log("👤 User ID de la metadata:", userId);

        if (!userId) {
          console.error("❌ Erreur: Missing userId in session metadata:", session.id);
          return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        console.log(`🚀 Mise à jour de l'utilisateur ${userId} vers le plan PRO...`);

        // Retrieve the subscription to get the price ID
        let priceId: string | null = null;
        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          priceId = sub.items.data[0]?.price.id ?? null;
        }

        try {
          await db.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
              maxTeamMembers: maxTeamMembersForPriceId(priceId),
            },
          });
          console.log("✅ Plan mis à jour en base de données !");
        } catch (dbErr) {
          console.error("❌ Échec de la mise à jour DB:", dbErr);
          throw dbErr;
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const isActive = ["active", "trialing"].includes(subscription.status);
        const priceId = subscription.items.data[0]?.price.id ?? null;

        // userId can come from subscription metadata (set at creation time)
        const userId = subscription.metadata?.userId;

        const user = userId
          ? await db.user.findUnique({ where: { id: userId }, select: { id: true } })
          : await db.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } });

        if (!user) {
          console.warn(`⚠️ No user found for customerId=${customerId} / userId=${userId}`);
          break; // 200 OK to Stripe — avoid retries for unknown customers
        }

        await db.user.update({
          where: { id: user.id },
          data: {
            plan: isActive ? "PRO" : "FREE",
            stripeCustomerId: customerId,
            stripeSubscriptionId: ["canceled", "incomplete_expired"].includes(subscription.status) ? null : subscription.id,
            maxTeamMembers: isActive ? maxTeamMembersForPriceId(priceId) : 0,
          },
        });
        console.log(`✅ subscription.${event.type.split(".").pop()} → user ${user.id} → plan=${isActive ? "PRO" : "FREE"}`);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata?.userId;

        const user = userId
          ? await db.user.findUnique({ where: { id: userId }, select: { id: true } })
          : await db.user.findUnique({ where: { stripeCustomerId: customerId }, select: { id: true } });

        if (!user) {
          console.warn(`⚠️ No user found for customerId=${customerId}`);
          break;
        }

        await db.user.update({
          where: { id: user.id },
          data: { plan: "FREE", stripeSubscriptionId: null, maxTeamMembers: 0 },
        });
        console.log(`✅ subscription.deleted → user ${user.id} → plan=FREE`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Error processing Stripe webhook:", err);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 },
    );
  }

  return NextResponse.json({ received: true });
}
