import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { renderInvoiceHtml, type InvoiceData } from "@/server/api/invoice-template";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Require PRO plan for Factur-X generation
    if (session.user.plan !== "PRO") {
      return NextResponse.json({ error: "Forbidden - PRO plan required" }, { status: 403 });
    }

    const { invoiceId } = await req.json();

    if (!invoiceId) {
      return NextResponse.json({ error: "Missing invoiceId" }, { status: 400 });
    }

    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: true },
    });

    if (!invoice || invoice.project.artisanId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    const artisan = await db.user.findUnique({
      where: { id: session.user.id },
    });

    // 1. Generate HTML
    const htmlString = renderInvoiceHtml(
      invoice as unknown as InvoiceData,
      artisan ?? {},
      invoice.project,
      invoice.locale
    );

    // 2. Prepare payload for Python Microservice
    const payload = {
      html: htmlString,
      invoice_data: {
        number: invoice.number,
        currency: invoice.currency,
        totalHT: invoice.totalHT,
        totalTVA: invoice.totalTVA,
        totalTTC: invoice.totalTTC,
        artisan: {
          companyName: artisan?.companyName || artisan?.name,
          siret: artisan?.siret,
          vatNumber: artisan?.vatNumber,
        },
        client: {
          name: invoice.project.clientName,
          vatNumber: "", // In a real app we would have client VAT number
        }
      },
      profile: "MINIMUM",
      country: artisan?.country || "FR",
    };

    // 3. Call Python Microservice
    // The Python service runs on port 8000. In production, this URL should be an env var pointing to Fly.io
    const microserviceUrl = process.env.FACTURX_API_URL || "http://localhost:8000/generate";

    const response = await fetch(microserviceUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Microservice error:", errText);
      return NextResponse.json({ error: "Factur-X generation failed" }, { status: 500 });
    }

    const result = await response.json();

    // We get base64 PDF back
    // In a full implementation, we would upload this base64 string to UploadThing / S3 
    // and save the URL into invoice.facturXPath. 
    // For now we return it to the client so they can download it.

    return NextResponse.json({ pdfBase64: result.pdfBase64 });
  } catch (error: unknown) {
    console.error("Factur-X Route Error", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
