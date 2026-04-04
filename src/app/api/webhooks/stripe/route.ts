import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { env } from "@/env";
import { db } from "@/server/db";

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

        try {
          await db.user.update({
            where: { id: userId },
            data: {
              plan: "PRO",
              stripeCustomerId: customerId,
              stripeSubscriptionId: subscriptionId,
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

        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: isActive ? "PRO" : "FREE",
            stripeSubscriptionId: isActive ? subscription.id : null,
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        await db.user.update({
          where: { stripeCustomerId: customerId },
          data: {
            plan: "FREE",
            stripeSubscriptionId: null,
          },
        });
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
