import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/server/db";
import { env } from "@/env";
import { authConfig } from "@/server/auth.config";

// Full auth with Prisma adapter — Node.js only, never import in middleware
export const { auth, handlers, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
    Resend({
      apiKey: env.AUTH_RESEND_KEY,
      from: env.AUTH_EMAIL_FROM,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },
  callbacks: {
    ...authConfig.callbacks,
    session: ({ session, token }) => ({
      ...session,
      user: {
        ...session.user,
        id: token.sub!,
        plan: token.plan as "FREE" | "PRO",
      },
    }),
    jwt: async ({ token, user }) => {
      if (user) {
        const dbUser = await db.user.findUnique({
          where: { id: user.id },
          select: { plan: true },
        });
        token.plan = dbUser?.plan ?? "FREE";
      }
      return token;
    },
  },
});
