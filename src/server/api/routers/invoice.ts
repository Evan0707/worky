import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";
import { TRPCError } from "@trpc/server";

export const invoiceRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const invoices = await ctx.db.invoice.findMany({
        where: {
          project: {
            artisanId: ctx.session.user.id,
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
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: {
          project: {
            select: { name: true, clientName: true, clientEmail: true },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // Check if project belongs to artisan
      const project = await ctx.db.project.findUnique({
        where: { id: invoice.projectId },
      });

      if (!project || project.artisanId !== ctx.session.user.id) {
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
    
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
       const invoice = await ctx.db.invoice.findUnique({
         where: { id: input.id },
         include: { project: true }
       });
       if (!invoice || invoice.project.artisanId !== ctx.session.user.id) {
         throw new TRPCError({ code: "FORBIDDEN" });
       }
       
       await ctx.db.invoice.delete({ where: { id: input.id } });
       return true;
    }),

  sendToPDP: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // 1. Check ownership
      const invoice = await ctx.db.invoice.findUnique({
        where: { id: input.id },
        include: { project: true }
      });

      if (!invoice || invoice.project.artisanId !== ctx.session.user.id) {
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

      // 4. Update status to "SENT" (pending)
      const updated = await ctx.db.invoice.update({
        where: { id: input.id },
        data: { status: "SENT" },
      });

      return updated;
    }),
});
