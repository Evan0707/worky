import NextAuth from "next-auth";
import createMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/routing";
import { authConfig } from "@/server/auth.config";

const intlMiddleware = createMiddleware(routing);

// Edge-safe auth — uses JWT only, no Prisma (CDC §10.1 rule 5)
const { auth } = NextAuth(authConfig);

// URL paths that require authentication (no route-group parentheses)
const PROTECTED_PATHS = ["/dashboard", "/chantiers", "/factures", "/settings", "/onboarding"];

function isProtectedPath(pathname: string): boolean {
  const localePattern = /^\/(fr-FR|en-GB|de-DE|es-ES)/;
  const withoutLocale = pathname.replace(localePattern, "");
  return PROTECTED_PATHS.some((p) => withoutLocale.startsWith(p));
}

export default auth(async (req) => {
  const request = req as NextRequest;

  // 1. next-intl: locale detection and routing (runs first — CDC §10.1 rule 5)
  const intlResponse = intlMiddleware(request);
  if (intlResponse.status !== 200) {
    return intlResponse;
  }

  // 2. Protect dashboard routes
  if (isProtectedPath(request.nextUrl.pathname) && !req.auth) {
    const localeMatch = request.nextUrl.pathname.match(
      /^\/(fr-FR|en-GB|de-DE|es-ES)/,
    );
    const locale = localeMatch?.[1] ?? routing.defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return intlResponse;
});

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - /api/* (tRPC, auth, webhooks, uploadthing)
     * - /c/* (magic link client view — public, no locale)
     * - /admin (backoffice)
     * - /_next/* (Next.js internals)
     * - /.*\..* (static files)
     */
    "/((?!api|_next|c|admin|.*\\..*).*)",
  ],
};
