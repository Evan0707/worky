import { z } from "zod";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, requireRole } from "@/server/api/trpc";
import { getArtisanContext, getEffectivePlan } from "@/server/lib/team-context";

// Static checklist templates — one source of truth, no DB needed
export const CHECKLIST_TEMPLATES: Record<string, { label: string; items: string[] }> = {
  EPI: {
    label: "Équipements de Protection Individuelle",
    items: [
      "Casque de chantier présent et en bon état",
      "Chaussures de sécurité portées",
      "Gilet haute visibilité",
      "Gants de protection adaptés",
      "Lunettes/masque de protection si nécessaire",
      "Harnais de sécurité si travail en hauteur",
    ],
  },
  ECHAFAUDAGE: {
    label: "Échafaudage",
    items: [
      "Plateforme de travail stable et de niveau",
      "Garde-corps à 1 m minimum",
      "Plinthes anti-chute en place",
      "Accès sécurisé (échelle ou escalier)",
      "Charge maximale affichée et respectée",
      "Roues bloquées (si échafaudage roulant)",
      "Sol portant vérifié",
    ],
  },
  ELECTRIQUE: {
    label: "Sécurité électrique",
    items: [
      "Consignation / déconsignation réalisée",
      "Habilitation électrique vérifiée",
      "Outillage isolé adapté à la tension",
      "Câbles non endommagés et bien fixés",
      "Tableau électrique sécurisé et signalé",
      "Présence d'un extincteur CO2 à proximité",
    ],
  },
  AMIANTE: {
    label: "Risque amiante",
    items: [
      "Repérage amiante effectué avant travaux",
      "Zone délimitée et signalisée",
      "Combinaison jetable portée",
      "Masque FFP3 porté",
      "Sac de collecte homologué amiante prévu",
      "Déchets déposés en déchetterie agréée",
    ],
  },
};

const checklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  checked: z.boolean().default(false),
  checkedAt: z.string().datetime().nullable().optional(),
  checkedBy: z.string().nullable().optional(),
});

export const safetyChecklistRouter = createTRPCRouter({
  listByProject: protectedProcedure
    .input(z.object({ projectId: z.string() }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.safetyChecklist.findMany({
        where: { projectId: input.projectId },
        orderBy: { createdAt: "asc" },
        include: { signedBy: { select: { name: true } } },
      });
    }),

  create: protectedProcedure
    .input(z.object({ projectId: z.string(), template: z.enum(["EPI", "ECHAFAUDAGE", "ELECTRIQUE", "AMIANTE"]) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const plan = await getEffectivePlan(userId, ctx.db);
      if (plan === "FREE") throw new TRPCError({ code: "FORBIDDEN", message: "PRO plan required" });

      const projectWhere =
        role === "MEMBER"
          ? { id: input.projectId, artisanId, assignments: { some: { userId } } }
          : { id: input.projectId, artisanId };

      const project = await ctx.db.project.findFirst({ where: projectWhere });
      if (!project) throw new TRPCError({ code: "NOT_FOUND" });

      const tpl = CHECKLIST_TEMPLATES[input.template]!;
      const items = tpl.items.map((label, i) => ({
        id: `${input.template}-${i}`,
        label,
        checked: false,
        checkedAt: null,
        checkedBy: null,
      }));

      return ctx.db.safetyChecklist.create({
        data: {
          projectId: input.projectId,
          template: input.template,
          items,
        },
      });
    }),

  updateItems: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        items: z.array(checklistItemSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const checklist = await ctx.db.safetyChecklist.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true, id: true } } },
      });
      if (!checklist || checklist.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // MEMBER must be assigned to this project
      if (role === "MEMBER") {
        const assignment = await ctx.db.projectAssignment.findUnique({
          where: { projectId_userId: { projectId: checklist.project.id, userId } },
        });
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });
      }

      if (checklist.signedAt) throw new TRPCError({ code: "FORBIDDEN", message: "Checklist already signed" });

      return ctx.db.safetyChecklist.update({
        where: { id: input.id },
        data: { items: input.items },
      });
    }),

  sign: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        signatureUrl: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);

      const checklist = await ctx.db.safetyChecklist.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true, id: true } } },
      });
      if (!checklist || checklist.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      // MEMBER must be assigned to this project
      if (role === "MEMBER") {
        const assignment = await ctx.db.projectAssignment.findUnique({
          where: { projectId_userId: { projectId: checklist.project.id, userId } },
        });
        if (!assignment) throw new TRPCError({ code: "FORBIDDEN" });
      }

      return ctx.db.safetyChecklist.update({
        where: { id: input.id },
        data: {
          signedAt: new Date(),
          signedById: userId,
          signatureUrl: input.signatureUrl,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const { artisanId, role } = await getArtisanContext(userId, ctx.db);
      requireRole(role, ["OWNER", "ADMIN"]);

      const checklist = await ctx.db.safetyChecklist.findUnique({
        where: { id: input.id },
        include: { project: { select: { artisanId: true } } },
      });
      if (!checklist || checklist.project.artisanId !== artisanId)
        throw new TRPCError({ code: "NOT_FOUND" });

      return ctx.db.safetyChecklist.delete({ where: { id: input.id } });
    }),

  getTemplates: protectedProcedure.query(() => {
    return Object.entries(CHECKLIST_TEMPLATES).map(([key, val]) => ({
      key,
      label: val.label,
      itemCount: val.items.length,
    }));
  }),
});
