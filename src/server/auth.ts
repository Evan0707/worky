import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Resend from "next-auth/providers/resend";
import { resend } from "@/lib/resend";
import OTPEmail from "../../emails/otp";
import { render } from "@react-email/components";

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
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const { host } = new URL(url);
        
        try {
          const html = await render(OTPEmail({ url, host }));
          const result = await resend.emails.send({
            to: identifier,
            from: provider.from!,
            subject: `Connexion à Worky`,
            html: html,
          });
          if (result.error) {
            throw new Error(result.error.message);
          }
        } catch (error) {
          throw new Error(`Échec de l'envoi de l'email de vérification : ${error instanceof Error ? error.message : "Erreur inconnue"}`);
        }
      },
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
    jwt: async ({ token, user, trigger, session }) => {
      // Fix [SEC-06]: Update JWT plan on demand
      if (trigger === "update" && session?.plan) {
        token.plan = session.plan;
      }
      
      // Look up DB on each JWT callback if it is old, or unconditionally since it's Prisma
      if (!token.plan || typeof token.plan !== "string") {
        if (token.sub) {
          const { artisanId } = await getArtisanContext(token.sub, db);
          const owner = await db.user.findUnique({
            where: { id: artisanId },
            select: { plan: true },
          });
          token.plan = owner?.plan ?? "FREE";
        }
      } else if (!user && token.sub) {
        // [SEC-06] Always fetch fresh plan to avoid staleness
        const { artisanId } = await getArtisanContext(token.sub, db);
        const owner = await db.user.findUnique({
          where: { id: artisanId },
          select: { plan: true },
        });
        token.plan = owner?.plan ?? "FREE";
      }

      if (user && !token.plan) {
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
