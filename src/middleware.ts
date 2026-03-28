import { auth } from "@/server/auth";

export { auth as middleware } from "@/server/auth";

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - / (home/landing page)
     * - /login and /login/* (auth pages)
     * - /c/* (magic link client view - public)
     * - /api/auth/* (NextAuth internal routes)
     * - /api/webhooks/* (Stripe webhook)
     * - /_next/* (Next.js internals)
     * - /favicon.ico, /robots.txt, etc.
     */
    "/(dashboard)/:path*",
  ],
};
