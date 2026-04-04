# OpenChantier — CLAUDE.md

## Project Overview

**OpenChantier** is a SaaS web-first (PWA) chantier management app for solo artisans and small construction teams. Built with the T3 stack, multilingue from day one (fr-FR, en-GB, de-DE, es-ES).

**Product goal:** Replace paper notebooks, WhatsApp photos, and Excel sheets with a unified tool. Freemium (FREE: 3 active projects) → PRO at 15 €/month.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router (RSC + Edge) |
| i18n | next-intl 3.x — URL `/{locale}/...` |
| API | tRPC v11 (end-to-end typed) |
| Auth | NextAuth (Auth.js) v5 beta |
| ORM | Prisma 5.x |
| DB | Neon PostgreSQL (serverless, EU-West Frankfurt) |
| UI | shadcn/ui + Tailwind CSS + Radix UI |
| Upload | UploadThing v7 |
| Email | Resend + React Email |
| Payments | Stripe (multi-currency EUR/GBP) |
| Real-time | Pusher |
| E-invoicing | Python/FastAPI microservice on Fly.io (Factur-X FR, ZUGFeRD DE, Peppol EU) |
| Monitoring | Sentry |
| Deploy | Vercel |

---

## Development Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # ESLint
pnpm typecheck    # TypeScript check
pnpm db:push      # Push schema to DB (dev)
pnpm db:migrate   # Run migrations
pnpm db:studio    # Prisma Studio
```

---

## Project Structure

```
src/
  app/
    [locale]/           # All user-facing routes (next-intl routing)
      (auth)/           # login, register
      (dashboard)/      # chantiers, settings, analytics
    c/[token]/          # Client magic link view — NO locale prefix, NO auth
    api/
      trpc/[trpc]/
      auth/[...nextauth]/
      webhooks/stripe/
      uploadthing/
      invoice/facturx/
  server/
    api/routers/        # project, photo, timeEntry, material, invoice, share, user
    auth.ts             # NextAuth v5 config
    db.ts               # Prisma client
  i18n/
    locales/
      fr-FR/            # common.json, projects.json, photos.json, invoices.json, billing.json, auth.json, emails.json, legal.json
      en-GB/            # same structure
      de-DE/            # same structure
    routing.ts
    request.ts
  lib/
    i18n-helpers.ts     # formatDate(), formatCurrency() — use these everywhere
    stripe.ts
    pusher.ts / pusher-client.ts
    resend.ts
  components/ui/        # shadcn/ui components
  middleware.ts         # next-intl THEN NextAuth (order is critical)
  env.js                # T3 env validation
prisma/schema.prisma
emails/                 # React Email templates (locale prop required)
```

---

## Critical Rules (from CDC §10 — never violate)

### Security
1. **Data isolation:** Every `findMany()` for artisan data MUST filter by `artisanId: ctx.session.user.id`.
2. **Never expose** `stripeCustomerId`, `stripeSubscriptionId`, `User.locale`, `User.country`, `User.vatNumber` in any public tRPC response.
3. **Magic link `getByToken()`** returns ONLY: `id, name, status, artisanCompanyName, artisanLogoUrl, photos (url, note, takenAt), clientActions`. Never `artisanId`, `clientEmail`, or any `User.*` field.
4. **PRO plan check** ALWAYS server-side in tRPC procedure. Never read from React prop or client state.
5. **Stripe webhook only:** Never update plan from Stripe return URL. Always wait for `checkout.session.completed` server-side.

### i18n
6. **Zero hardcoded strings in JSX/TSX.** Always use `useTranslations()` (Client Component) or `getTranslations()` (Server Component). Applies to tRPC error messages shown to client too.
7. **Translation key format:** dot.notation — e.g., `'projects.status.ACTIVE'`, `'common.buttons.save'`.

### Architecture
8. **Middleware order:** next-intl BEFORE NextAuth. Matcher excludes `/api/*`, `/c/*`, `/admin`, `/_next`, `/.*\..*`. Route `/c/[token]` must never be behind locale middleware.
9. **NextAuth v5:** Use `auth()` from `@/server/auth`. In Server Components: `await auth()`. Never use `getServerSession()` (v4 API).
10. **tRPC in Server Components:** Use `createCaller(ctx)`. Never use `useQuery` hooks without `'use client'`.

### Data
11. **Money in DB:** Always store as integer cents. Use `formatCurrency(cents, currency, locale)` from `@/lib/i18n-helpers` for display. Never use floats for money.
12. **Dates in DB:** Always UTC. Display via `formatDate(date, locale)` helper. Never use `Intl.DateTimeFormat` directly in components.
13. **Factur-X / ZUGFeRD:** Generate ONLY in the Python microservice. Never attempt to generate EN 16931 XML in TypeScript.

---

## Code Conventions

- **Naming:** `camelCase` vars/functions, `PascalCase` components/types, `SCREAMING_SNAKE` env constants
- **Files:** `kebab-case` except React components (`PascalCase.tsx`)
- **Imports:** Always use `@/` alias. Never relative `../../` paths.
- **tRPC errors:** `TRPCError` with appropriate code (`NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `BAD_REQUEST`). Error messages in English server-side.
- **Cache:** Invalidate React Query after mutations — `utils.project.list.invalidate()`
- **DB transactions:** Use Prisma transactions for multi-table operations
- **Icons:** Lucide React only

---

## Business Logic

### Plans
- **FREE:** Max 3 ACTIVE or PAUSED projects. Photos & time tracking unlimited. Magic link read-only.
- **PRO (15 €/month):** Unlimited projects, PDF quotes/invoices, e-invoicing, auto reminders, analytics, client actions (validate/comment/sign).

### Project Status
`ACTIVE` (counts toward FREE limit) → `PAUSED` (counts) → `DONE` (excluded) → `ARCHIVED` (excluded)

### VAT Schemes (User.vatScheme)
`STANDARD | REDUCED | MICRO_ENTREPRENEUR | EXEMPT | REVERSE_CHARGE`

### E-invoicing by country
- France: Factur-X (EN 16931)
- Germany: ZUGFeRD / XRechnung
- Belgium/Netherlands/Spain/EU: Peppol BIS 3.0

---

## Environment Variables

See `.env.example`. Required:
- `NEXTAUTH_SECRET`, `DATABASE_URL` (pooled :6543), `DIRECT_URL` (unpooled :5432)
- `UPLOADTHING_SECRET`, `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- `PUSHER_APP_ID`, `PUSHER_KEY`, `PUSHER_SECRET`, `PUSHER_CLUSTER`
- `NEXT_PUBLIC_APP_URL`

---

## Out of Scope (MVP)

- React Native / Expo mobile app
- Multi-artisan team accounts
- Bank connection / FEC import
- Materials marketplace
- AI document scanning
- Public REST API
- Arabic / RTL support
- OpenChantier for architects / engineering firms
