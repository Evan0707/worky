import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

/**
 * Edge-compatible auth config — NO Prisma, NO db import.
 * Used in middleware. The full auth (with PrismaAdapter) is in auth.ts.
 * We remove Email providers (Resend) here because they require a database adapter.
 */
export const authConfig = {
  providers: [
    Google({ clientId: "", clientSecret: "" }), // credentials injected at runtime in full config
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login/error",
  },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
