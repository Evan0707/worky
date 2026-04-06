import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

import { auth } from "@/server/auth";
import { db } from "@/server/db";

/**
 * 1. CONTEXT
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth();

  return {
    db,
    session,
    ...opts,
  };
};

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE HELPERS
 */
export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;

export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

/**
 * Helper to enforce PRO plan access
 */
export const requirePro = (ctx: {
  session: { user: { plan: string } };
}) => {
  if (ctx.session.user.plan !== "PRO") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Cette fonctionnalité nécessite un abonnement PRO.",
    });
  }
};

/**
 * Enforce team role access for mutations.
 *
 * Role hierarchy: OWNER > ADMIN > MEMBER
 * - role === null  → solo user (always allowed)
 * - role in allowed → allowed
 * - otherwise      → FORBIDDEN
 *
 * Usage: requireRole(role, ["OWNER", "ADMIN"])
 */
export const requireRole = (
  role: string | null,
  allowed: ("OWNER" | "ADMIN" | "MEMBER")[],
) => {
  // Solo artisan (no team) is always treated as OWNER of their own data
  if (role === null) return;
  if (!allowed.includes(role as "OWNER" | "ADMIN" | "MEMBER")) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action.",
    });
  }
};
