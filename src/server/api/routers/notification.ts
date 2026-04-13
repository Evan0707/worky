import { z } from "zod";
import { type NotificationType } from "@prisma/client";

import { createTRPCRouter, protectedProcedure } from "@/server/api/trpc";

export const notificationRouter = createTRPCRouter({
  list: protectedProcedure
    .input(z.object({ cursor: z.string().optional(), limit: z.number().int().min(1).max(50).default(20) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      const items = await ctx.db.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: input.limit + 1,
        ...(input.cursor && { cursor: { id: input.cursor }, skip: 1 }),
      });

      let nextCursor: string | undefined;
      if (items.length > input.limit) {
        nextCursor = items.pop()!.id;
      }

      return { items, nextCursor };
    }),

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return ctx.db.notification.count({ where: { userId, isRead: false } });
  }),

  markAsRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!;
      return ctx.db.notification.updateMany({
        where: { id: input.id, userId },
        data: { isRead: true },
      });
    }),

  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id!;
    return ctx.db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }),
});

// Helper to create a notification from server-side code (routers, webhooks, etc.)
export async function createNotification(
  db: import("@prisma/client").PrismaClient,
  params: {
    userId: string;
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
  },
) {
  return db.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      link: params.link,
    },
  });
}
