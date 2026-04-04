import { NextResponse } from "next/server";
import { db } from "@/server/db";
import crypto from "crypto";

// Webhook Tiime (PDP)
// POST /api/webhooks/pdp
export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-tiime-signature");

    // Signature verification — required when TIIME_WEBHOOK_SECRET is set
    if (process.env.TIIME_WEBHOOK_SECRET) {
      const expectedSig = crypto
        .createHmac("sha256", process.env.TIIME_WEBHOOK_SECRET)
        .update(rawBody)
        .digest("hex");
      if (!signature || expectedSig !== signature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);

    // Tiime webhook structure typically sends the entity type and action
    // Example: { event: "invoice.status_changed", data: { id: "123", externalId: "abc", status: "VALidee" } }
    if (!event.data?.externalId || !event.data?.status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { externalId: invoiceId, status: tiimeStatus } = event.data;

    // Convert Tiime PDP Status to OpenChantier Internal Status
    // Tiime uses specific statuses for B2B/B2G flows
    let internalStatus: "SENT" | "ACCEPTED" | "REFUSED" | "PAID" | "OVERDUE" = "SENT";

    switch (tiimeStatus.toLowerCase()) {
      case "acceptee_par_client":
      case "mise_a_disposition":
        internalStatus = "ACCEPTED";
        break;
      case "refusee_par_client":
      case "rejetee":
        internalStatus = "REFUSED";
        break;
      case "payee":
      case "encaissee":
        internalStatus = "PAID";
        break;
      case "en_retard":
        internalStatus = "OVERDUE";
        break;
      default:
        internalStatus = "SENT";
    }

    // Update facture en base
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: internalStatus },
    });

    console.log(`[Tiime Webhook] Updated Invoice ${invoiceId} to ${internalStatus} (from ${tiimeStatus})`);

    return NextResponse.json({ ok: true, internalStatus });
  } catch (error) {
    console.error("[Tiime Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

