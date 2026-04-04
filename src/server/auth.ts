import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";

import { db } from "@/server/db";
import { env } from "@/env";
import { authConfig } from "@/server/auth.config";
import { getArtisanContext } from "@/server/lib/team-context";

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
        // Resolve effective artisanId so team members inherit the owner's plan
        const { artisanId } = await getArtisanContext(user.id!, db);
        const owner = await db.user.findUnique({
          where: { id: artisanId },
          select: { plan: true },
        });
        token.plan = owner?.plan ?? "FREE";
      }
      return token;
    },
  },
});
