import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";

export const reportRouter = createTRPCRouter({
  // Full project summary for PDF report
  projectSummary: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      // PRO plan required for reports
      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
      }

      const project = await ctx.db.project.findFirst({
        where: { id: input.projectId, artisanId },
        include: {
          photos: { orderBy: [{ order: "asc" }, { takenAt: "desc" }], take: 50 },
          timeEntries: {
            orderBy: { date: "asc" },
            include: { createdBy: { select: { name: true } } },
          },
          materials: {
            orderBy: { label: "asc" },
            include: { createdBy: { select: { name: true } } },
          },
          invoices: {
            where: { status: { not: "DRAFT" } },
            orderBy: { createdAt: "asc" },
            select: {
              id: true,
              number: true,
              type: true,
              status: true,
              totalHT: true,
              totalTVA: true,
              totalTTC: true,
              currency: true,
              issuedAt: true,
              paidAt: true,
            },
          },
          notes: {
            where: { isPinned: true },
            orderBy: { createdAt: "desc" },
            include: { createdBy: { select: { name: true } } },
          },
          tasks: {
            orderBy: [{ status: "asc" }, { createdAt: "asc" }],
            include: { assignee: { select: { name: true } } },
          },
        },
      });

      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const artisan = await ctx.db.user.findUnique({
        where: { id: artisanId },
        select: {
          name: true,
          companyName: true,
          email: true,
          companyAddress: true,
          hourlyRate: true,
          currency: true,
        },
      });

      const totalHours = project.timeEntries.reduce(
        (sum, e) => sum + Number(e.hours),
        0,
      );
      const hourlyRate = Number(artisan?.hourlyRate ?? 0);
      const laborCost = Math.round(totalHours * hourlyRate * 100); // cents

      const materialCost = project.materials.reduce(
        (sum, m) => sum + Math.round(Number(m.quantity) * Number(m.unitPrice) * 100),
        0,
      ); // cents

      const totalRevenue = project.invoices
        .filter((inv) => inv.status === "PAID")
        .reduce((sum, inv) => sum + inv.totalTTC, 0); // already cents

      const totalInvoiced = project.invoices.reduce(
        (sum, inv) => sum + inv.totalTTC,
        0,
      );

      return {
        project,
        artisan,
        stats: {
          totalHours,
          laborCost,
          materialCost,
          totalCost: laborCost + materialCost,
          totalRevenue,
          totalInvoiced,
          profit: totalRevenue - laborCost - materialCost,
          tasksDone: project.tasks.filter((t) => t.status === "DONE").length,
          tasksTotal: project.tasks.length,
        },
      };
    }),

  // Time export across projects
  timeExport: protectedProcedure
    .input(
      z.object({
        projectIds: z.array(z.string()).optional(),
        startDate: z.string().datetime().optional(),
        endDate: z.string().datetime().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      // PRO plan required for exports
      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
      }

      return ctx.db.timeEntry.findMany({
        where: {
          project: { artisanId },
          ...(input.projectIds?.length && { projectId: { in: input.projectIds } }),
          ...(input.startDate && { date: { gte: new Date(input.startDate) } }),
          ...(input.endDate && { date: { lte: new Date(input.endDate) } }),
        },
        orderBy: { date: "asc" },
        include: {
          project: { select: { name: true, clientName: true } },
          createdBy: { select: { name: true } },
        },
      });
    }),

  // Material cost export across projects
  materialExport: protectedProcedure
    .input(z.object({ projectIds: z.array(z.string()).optional() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      // PRO plan required for exports
      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") {
        throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
      }

      return ctx.db.material.findMany({
        where: {
          project: { artisanId },
          ...(input.projectIds?.length && { projectId: { in: input.projectIds } }),
        },
        orderBy: [{ projectId: "asc" }, { label: "asc" }],
        include: { project: { select: { name: true, clientName: true } } },
      });
    }),

  // Profitability summary per project
  profitability: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    const { artisanId, role } = await getArtisanContext(userId, ctx.db);
    requireRole(role, ["OWNER", "ADMIN"]);

    // PRO plan required for profitability
    const plan = await getEffectivePlan(userId, ctx.db);
    if (plan === "FREE") {
      throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });
    }

    const artisan = await ctx.db.user.findUnique({
      where: { id: artisanId },
      select: { hourlyRate: true },
    });
    const hourlyRate = Number(artisan?.hourlyRate ?? 0);

    const projects = await ctx.db.project.findMany({
      where: { artisanId },
      select: {
        id: true,
        name: true,
        clientName: true,
        status: true,
        timeEntries: { select: { hours: true } },
        materials: { select: { quantity: true, unitPrice: true } },
        invoices: { select: { totalTTC: true, status: true } },
      },
    });

    return projects.map((p) => {
      const totalHours = p.timeEntries.reduce((s, e) => s + Number(e.hours), 0);
      const laborCost = Math.round(totalHours * hourlyRate * 100);
      const materialCost = p.materials.reduce(
        (s, m) => s + Math.round(Number(m.quantity) * Number(m.unitPrice) * 100),
        0,
      );
      const totalInvoiced = p.invoices.reduce((s, i) => s + i.totalTTC, 0);
      const totalPaid = p.invoices
        .filter((i) => i.status === "PAID")
        .reduce((s, i) => s + i.totalTTC, 0);

      return {
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        status: p.status,
        totalHours,
        laborCost,
        materialCost,
        totalCost: laborCost + materialCost,
        totalInvoiced,
        totalPaid,
        margin: totalPaid - laborCost - materialCost,
      };
    });
  }),
});
