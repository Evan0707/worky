import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { getArtisanContext } from "@/server/lib/team-context";

export const invoiceRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);
      const invoices = await ctx.db.invoice.findMany({
        where: {
          project: {
            artisanId,
          },
        },
        include: {
          project: {
            select: { name: true, clientName: true },
          },
        },
        orderBy: { createdAt: "desc" },
        take: input?.limit,
      });
      return invoices;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: { name: true, clientName: true, clientEmail: true, artisanId: true },
          },
        },
      });

      if (!invoice || invoice.project.artisanId !== artisanId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return invoice;
    }),

  create: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        type: z.enum(["QUOTE", "INVOICE"]),
        lines: z.array(
          z.object({
            label: z.string(),
            quantity: z.number(),
            unitPrice: z.number(), // in cents
            vatRate: z.number(),   // percentage (e.g. 20)
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Verify project
      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project || project.artisanId !== ctx.session.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // 2. Generate Number
      const prefix = input.type === "INVOICE" ? "FA" : "DE";
      const count = await ctx.db.invoice.count({
        where: { type: input.type, project: { artisanId: ctx.session.user.id } },
      });
      const year = new Date().getFullYear().toString().slice(-2);
      const number = `${prefix}${year}-${String(count + 1).padStart(4, "0")}`;

      // 3. Compute Totals
      let totalHT = 0;
      let totalTVA = 0;

      for (const line of input.lines) {
        const lineHT = Math.round(line.quantity * line.unitPrice);
        const lineTVA = Math.round(lineHT * (line.vatRate / 100));
        totalHT += lineHT;
        totalTVA += lineTVA;
      }

      const totalTTC = totalHT + totalTVA;

      // 4. Create Invoice
      const invoice = await ctx.db.invoice.create({
        data: {
          projectId: input.projectId,
          number,
          type: input.type,
          lines: input.lines,
          totalHT,
          totalTVA,
          totalTTC,
          // user locale/currency (could be fetched from artisan profile)
          currency: "EUR",
          locale: "fr-FR",
        },
      });

      return invoice;
    }),
    
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        lines: z.array(
          z.object({
            label: z.string(),
            quantity: z.number(),
            unitPrice: z.number(),
            vatRate: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!invoice || invoice.project.artisanId !== artisanId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      if (invoice.status !== "DRAFT") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Only DRAFT invoices can be updated." });
      }

      let totalHT = 0;
      let totalTVA = 0;
      for (const line of input.lines) {
        const lineHT = Math.round(line.quantity * line.unitPrice);
        totalHT += lineHT;
        totalTVA += Math.round(lineHT * (line.vatRate / 100));
      }

      return ctx.db.invoice.update({
        where: { id: input.id },
        data: { lines: input.lines, totalHT, totalTVA, totalTTC: totalHT + totalTVA },
      });
    }),

  createFromProject: protectedProcedure
    .input(
      z.object({
        projectId: z.string(),
        type: z.enum(["QUOTE", "INVOICE"]),
        defaultVatRate: z.number().default(20),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const project = await ctx.db.project.findUnique({
        where: { id: input.projectId },
        include: { timeEntries: true, materials: true },
      });

      if (!project || project.artisanId !== artisanId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Fetch artisan's hourly rate
      const artisan = await ctx.db.user.findUnique({
        where: { id: artisanId },
        select: { hourlyRate: true, currency: true, locale: true },
      });

      const hourlyRateCents = artisan?.hourlyRate
        ? Math.round(Number(artisan.hourlyRate) * 100)
        : 0;

      const lines: { label: string; quantity: number; unitPrice: number; vatRate: number }[] = [];

      // Time entries → labour lines (grouped by description)
      for (const entry of project.timeEntries) {
        lines.push({
          label: entry.description ?? "Main d'œuvre",
          quantity: Number(entry.hours),
          unitPrice: hourlyRateCents,
          vatRate: input.defaultVatRate,
        });
      }

      // Materials → material lines
      for (const mat of project.materials) {
        lines.push({
          label: mat.label,
          quantity: Number(mat.quantity),
          unitPrice: Number(mat.unitPrice) * 100, // already stored as decimal price → convert to cents
          vatRate: input.defaultVatRate,
        });
      }

      if (lines.length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No time entries or materials to invoice." });
      }

      // Compute totals
      let totalHT = 0;
      let totalTVA = 0;
      for (const line of lines) {
        const lineHT = Math.round(line.quantity * line.unitPrice);
        totalHT += lineHT;
        totalTVA += Math.round(lineHT * (line.vatRate / 100));
      }

      // Generate invoice number
      const prefix = input.type === "INVOICE" ? "FA" : "DE";
      const count = await ctx.db.invoice.count({
        where: { type: input.type, project: { artisanId } },
      });
      const year = new Date().getFullYear().toString().slice(-2);
      const number = `${prefix}${year}-${String(count + 1).padStart(4, "0")}`;

      return ctx.db.invoice.create({
        data: {
          projectId: input.projectId,
          number,
          type: input.type,
          lines,
          totalHT,
          totalTVA,
          totalTTC: totalHT + totalTVA,
          currency: artisan?.currency ?? "EUR",
          locale: artisan?.locale ?? "fr-FR",
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: { project: true },
      });
      if (!invoice || invoice.project.artisanId !== artisanId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      await ctx.db.invoice.delete({ where: { id: input.id } });
      return true;
    }),

  sendToPDP: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Resolve effective artisanId (handles team members)
      const { artisanId } = await getArtisanContext(ctx.session.user.id, ctx.db);

      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!invoice || invoice.project.artisanId !== artisanId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // 2. Format invoice for e-invoicing (future: Factur-X / Tiime integration)
      const user = ctx.session.user as { id: string; name?: string | null; siret?: string; companyName?: string };
      const tiimePayload = {
        externalId: invoice.id,
        number: invoice.number,
        issueDate: invoice.createdAt.toISOString().split("T")[0],
        seller: {
          siret: user.siret ?? "MISSING_SIRET",
          name: user.companyName ?? user.name ?? "",
        },
        buyer: {
          name: invoice.project.clientName,
          // B2B Requires a SIRET, MVP handles general names
          siret: invoice.project.clientEmail ? undefined : undefined, 
        },
        items: (invoice.lines as any[]).map((line) => ({
          description: line.label,
          quantity: line.quantity,
          unitPrice: line.unitPrice / 100, // Cents to decimal for specific API
          vatRate: line.vatRate,
        })),
        totals: {
          totalHT: invoice.totalHT / 100,
          totalTVA: invoice.totalTVA / 100,
          totalTTC: invoice.totalTTC / 100,
        },
      };

      // 3. Mock Call to external Tiime API
      // In production:
      // await fetch("https://api.tiime.fr/v1/invoices/b2b", {
      //   method: "POST",
      //   headers: { "Authorization": `Bearer ${process.env.TIIME_API_KEY}`, "Content-Type": "application/json" },
      //   body: JSON.stringify(tiimePayload),
      // });
      console.log("[Tiime API] Sending invoice to Tiime:", JSON.stringify(tiimePayload, null, 2));

      // Simulate a small delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // 4. Update status to "SENT" — filter by artisanId to prevent IDOR
      const updated = await ctx.db.invoice.update({
        where: { id: input.id, project: { artisanId } },
        data: { status: "SENT", issuedAt: new Date() },
      });

      return updated;
    }),
});
