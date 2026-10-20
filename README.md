# Preeti Nursing Bureau: patient care at home

A website and admin system for Preeti Nursing Bureau, a bureau that connects families in Delhi NCR with General Duty Assistants, home nurses and patient attendants, and earns a commission on each successful placement.

- **Public website:** services, how it works, a 6-step mobile-first care request form, a contact / call-back form, policy pages, and working phone and WhatsApp links.
- **Admin:** leads, follow-ups, customers, caregivers with verification records, matching, administrator-confirmed assignments, manual payments, commission tracking, reports and settings.

Only **12-hour** and **24-hour** shifts exist anywhere in the system: in forms, the API, the database enum, matching, pricing, filters, reports and tests.

---

## Contents

1. [Tech stack](#tech-stack)
2. [Local setup](#local-setup)
3. [Environment variables](#environment-variables)
4. [Database, migrations and seeding](#database-migrations-and-seeding)
5. [Running the checks](#running-the-checks)
6. [Project structure](#project-structure)
7. [How the key rules are enforced](#how-the-key-rules-are-enforced)
8. [Roles and permissions](#roles-and-permissions)
9. [Money: billing, payouts, commission](#money-billing-payouts-commission)
10. [Security and privacy](#security-and-privacy)
11. [Deployment](#deployment)
12. [External integrations needing credentials](#external-integrations-needing-credentials)
13. [Known limitations and unfinished items](#known-limitations-and-unfinished-items)
14. [Content the business must review](#content-the-business-must-review)

---

## Tech stack

| Area | Choice |
|---|---|
| Framework | Next.js 16.4 (App Router, server actions, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 4 with design tokens in `src/app/globals.css`; Figtree font; Phosphor icons |
| UI components | Small accessible in-house component set (`src/components/ui`) using native elements (`<dialog>`, `<details>`, labelled inputs) |
| Database | PostgreSQL 16 via Prisma ORM 7.10 (`@prisma/adapter-pg`) |
| Validation | Zod 4 (shared client/server schemas) + React Hook Form |
| Charts | Recharts 3 |
| Money | `decimal.js` on the server, `Decimal(12,2)` in the database |
| Auth | Database-backed sessions + bcrypt (see [Security](#security-and-privacy)) |
| Tests | Vitest 5 (unit + integration against a real Postgres), Playwright (end-to-end) |

Prisma 7.10 is used deliberately: Prisma 8 is still a release candidate.

## Local setup

Requirements: Node.js 20.9+ (tested on Node 22), Docker (or any PostgreSQL 14+ server).

```bash
cd preeti-nursing-bureau
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit the values (see below)

# Start PostgreSQL 16 on port 5544, with a second database "pnb_test" for tests.
npm run db:up                    # plain `docker run`; or: docker compose up -d

npm run db:deploy                # apply migrations to DATABASE_URL
npm run db:seed                  # services, Delhi NCR areas, draft policy pages, first admin
npm run dev                      # http://localhost:3000
```

Sign in at **http://localhost:3000/admin/login** with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, then go to **Settings** to add the bureau's phone, WhatsApp number, business hours and pricing. Call and WhatsApp buttons stay hidden on the website until the numbers are configured.

Without Docker, create two databases (for example `pnb` and `pnb_test`) on any PostgreSQL server and point `DATABASE_URL` and `TEST_DATABASE_URL` at them. Do not use in-memory storage: every feature reads and writes PostgreSQL.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | PostgreSQL connection string for the app |
| `TEST_DATABASE_URL` | for tests | A **separate** database; the test suites truncate it |
| `SESSION_SECRET` | yes | Random secret used when hashing client fingerprints for rate limiting (`openssl rand -base64 32`) |
| `APP_URL` | recommended | Public base URL |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | first run | Creates the first administrator during `npm run db:seed` (password 12+ chars; email defaults to `arsh@preetinursing.com`) |
| `NEXT_PUBLIC_CONTACT_PHONE`, `NEXT_PUBLIC_CONTACT_WHATSAPP` | optional | Fallbacks used only if Settings has no number |
| `BCRYPT_COST` | optional | Password hashing cost, default 12 |

## Database, migrations and seeding

```bash
npm run db:migrate     # development: create/apply a new migration after editing prisma/schema.prisma
npm run db:deploy      # production / CI: apply existing migrations
npm run db:generate    # regenerate the Prisma client (output: src/generated/prisma)
npm run db:seed        # idempotent base seed
```

Migrations live in `prisma/migrations/`. Besides the tables, they add database CHECK constraints: positive payment amounts, a reversal link that is required exactly when an entry is a reversal, commission sign rules, consent required, ordered dates, commission rate 0 to 100, and a singleton settings row.

**Seed data.** The seed loads only real configuration: the eight service categories, Delhi NCR localities (Delhi, Noida, Greater Noida, Ghaziabad, Gurugram, Faridabad), draft policy pages and the first administrator. At the owner's request, **no fictional customers, caregivers, prices or figures are seeded** and nothing invented appears in the interface. Automated tests create their own records in the separate test database.

## Running the checks

```bash
npm run typecheck          # tsc --noEmit
npm run lint               # eslint
npm run test:unit          # pure business rules (no database)
npm run test:integration   # services against the real PostgreSQL test database
npm test                   # unit + integration
npx playwright install chromium   # first time only
npm run test:e2e           # starts `next dev` on :3200 against TEST_DATABASE_URL
npm run build
```

Results at handover (11 Oct 2026):

| Check | Result |
|---|---|
| `npm run typecheck` | passes, no errors |
| `npm run lint` | 0 errors, 2 warnings (React Compiler skips memoising the two forms that use React Hook Form's `watch()`; expected) |
| `npm test` | 78 tests pass (49 unit, 29 integration) |
| `npm run test:e2e` | 9 tests pass (mobile request flow, contact form, public pages, admin lead → confirmed assignment → partial payment, auth and permission checks) |
| `npm run build` | succeeds |

## Project structure

```
prisma/
  schema.prisma            data model (ShiftType enum maps to "12_HOURS" / "24_HOURS")
  migrations/              SQL migrations incl. CHECK constraints
  seed.ts, seed-content.ts base seed and draft policy text
src/
  proxy.ts                 optimistic admin redirect (real checks happen server-side)
  app/(public)/            website: home, services, about, contact, legal, request, status
  app/admin/(auth)/login   sign-in
  app/admin/(app)/         admin pages (dashboard, leads, follow-ups, assignments, caregivers,
                           customers, finance, settings, team, audit, account)
  app/admin/actions/       server actions (each re-checks the session and permissions)
  components/ui            buttons, form fields, panels, tables, dialogs
  components/public        website components incl. the request wizard
  components/admin         admin forms, charts, status badges
  lib/domain/              pure business rules: shift.ts, lead-status.ts, assignment-status.ts,
                           matching.ts, commission.ts, finance.ts, money.ts, dates.ts, labels.ts
  lib/validation/          shared Zod schemas (request.ts, admin.ts)
  lib/services/            server-only data access + authorisation (requests, leads, caregivers,
                           assignments, finance, reports, settings, users, inquiries)
  lib/auth/                sessions, password hashing, permissions, data-access layer
  lib/notifications/       provider interface for future WhatsApp/SMS/email (none configured)
tests/unit, tests/integration, e2e/
```

## How the key rules are enforced

**Two shift types only.** `src/lib/domain/shift.ts` is the single source of truth (`SHIFT_TYPES = ["12_HOURS", "24_HOURS"]` plus a Zod schema). The public schema is `.strict()`, so extra fields such as a free-text duration are rejected. The database column is a Postgres enum with exactly the two values; a test proves that a raw `UPDATE ... '8_HOURS'` fails. Caregivers store supported shifts as an array of that enum. Pricing rules are unique per service and shift. Day/night preference is a separate field and never changes the duration. 24-hour assignments require a written relief/rest/staffing plan before they can be confirmed.

**Lead pipeline.** Statuses and allowed transitions are in `lib/domain/lead-status.ts`. Every change writes a `StatusChange` row recording who made it, plus an audit entry. "Caregiver assigned / Service active / Completed" require a confirmed assignment.

**Matching.** `lib/domain/matching.ts` ranks caregivers and explains each result: service, locality, gender preference, verification, nursing qualification and current availability. Hard blockers are an unsupported shift, being marked unavailable, an unavailability period, falling outside availability windows, or an overlapping confirmed/active assignment. The score is a sorting aid only.

**Manual confirmation.** Assignments start as `PROPOSED`. `CONFIRMED` is not reachable through ordinary status changes. Only the administrator-only confirm action can set it, and only after both the customer's and the caregiver's acceptance are recorded. It re-runs the hard checks inside a transaction that locks the caregiver row (`SELECT ... FOR UPDATE`), so two confirmations cannot double-book a caregiver. Every change appends an `AssignmentEvent`. Replacements link to the assignment they replace. Cancellations keep the reason and history.

## Roles and permissions

Permissions are defined in `src/lib/auth/permissions.ts` and checked inside every service function. The UI only hides what a role cannot do.

| | Administrator | Staff |
|---|---|---|
| Leads | all | only leads assigned to them (others return "not found") |
| Create phone/WhatsApp leads, notes, follow-ups, status | yes | yes (own leads) |
| Caregiver directory | full | read only, no pay, no verification records |
| Propose / confirm assignments | yes | no |
| Finance, payments, commission, agreed amounts | yes | no (amounts are stripped from the data) |
| Settings, team, audit log | yes | no |

A caregiver self-service portal is not built, but the data model and permission system are ready for a `CAREGIVER` role.

## Money: billing, payouts, commission

All maths is server-side in `decimal.js`; amounts are `Decimal(12,2)`. For each assignment:

- **Customer charge** = agreed customer amount + customer-charge adjustments (zero until confirmed).
- **Caregiver obligation** = agreed payout + payout adjustments (zero until confirmed).
- **Collected** = recorded receipts − refunds (each net of reversal entries). Nothing counts as paid without a payment record.
- **Outstanding** = charge − collected; caregiver owed = obligation − paid.
- **Commission** is a separate ledger. Under the configured policy it is either a fixed amount per placement or a percentage of an explicit basis (agreed customer amount or agreed caregiver payout). It is recorded only when the configured event happens, **on confirmation** (default) or **on completion**, so proposals and new leads never count as earned. Each assignment keeps a copy of the commission terms agreed when it was created.
- **Margin** (charge − payout) is shown separately, labelled as not being the commission.
- **Corrections** never edit history: payments are corrected with reversal entries, amount changes after confirmation are signed adjustments, and commission changes are correction entries. Cancelling a confirmed assignment records settlement adjustments and can reverse the commission. Payments that would exceed what is owed are refused.

Payment methods are cash, UPI, bank transfer and "other" (with a description). There is no online payment gateway.

## Security and privacy

- **Authentication.** This uses the session approach documented in the Next.js authentication guide rather than a third-party auth library. A random 256-bit token is stored in an `httpOnly`, `SameSite=Lax`, `Secure` (in production) cookie; only its SHA-256 hash is stored in the `Session` table. Sessions last 12 hours and are deleted on sign-out, deactivation and password change. Passwords use bcrypt (cost 12), with a 12-character minimum. Sign-in errors are generic, and timing is equalised for unknown emails. *This is a deliberate, documented choice. If the business prefers a maintained auth library (for example Better Auth or Auth.js), the session layer is isolated in `src/lib/auth/session.ts` and `dal.ts`.*
- **Authorisation** is checked server-side in every action and service. `proxy.ts` is only an early redirect. Row-level scoping prevents insecure direct object references (staff see only assigned leads; IDs are UUIDs).
- **Public status links** use a 256-bit random token; only its hash is stored. The status page shows reference, service, shift, dates, area and plain-language status, with no names, phone numbers, notes or money. References (`PNB-XXXX-XXXX`) are random, not sequential.
- **Rate limiting** is stored in Postgres, so it holds across instances: requests 8/hour per client, call-backs 5/hour, sign-in 20 per 15 minutes per client and 8 per 15 minutes per email. Client IPs are hashed, never stored raw.
- **Other protections.** CSRF: Next.js server actions verify the request origin. XSS: React escaping, and admin-edited text is rendered as plain text, never HTML. SQL injection: Prisma parameterised queries; the few raw queries use tagged templates. Security headers (HSTS, `X-Frame-Options: DENY`, `nosniff`, referrer policy, permissions policy) are set, and admin and status pages are `noindex`.
- **Minimal data.** No medical reports or ID numbers are requested, and forms say not to send them. Verification records describe the document checked rather than storing files. WhatsApp pre-fills never contain medical details. Internal notes never render on public pages.
- **Audit log** of administrative and financial changes, readable by administrators only.

No legal or regulatory compliance is claimed. Check the DPDP Act 2023 and its rules, and any state requirements for nursing bureaus, before launch.

**Retention and deletion procedure (to adopt):** decide retention periods in the Privacy Policy. To delete a customer's data on request, cancel or close their leads, then anonymise the `Customer` row (name, phone, email) and the free-text request fields. Financial rows and audit entries are kept for accounting. A self-service deletion tool is not built.

## Deployment

Any Node.js host with PostgreSQL works (for example a VPS with Docker, Railway, Render, or Vercel with a managed Postgres).

1. Provision PostgreSQL 14+ and set `DATABASE_URL`, `SESSION_SECRET`, `APP_URL` and `NODE_ENV=production`.
2. `npm ci` (runs `prisma generate`).
3. `npm run db:deploy` to apply migrations.
4. First time only: set `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` and run `npm run db:seed`, then remove those variables.
5. To change the administrator's password or email later: `DATABASE_URL=... NEW_PASSWORD='...' NEW_EMAIL=... npx tsx prisma/reset-admin-password.ts`.
5. `npm run build && npm run start` (port 3000 by default; use `-p` to change).
6. Serve over HTTPS behind a reverse proxy that sets `X-Forwarded-For` (used for rate limiting).
7. Back up the database daily. It holds the only copy of payments and history.

Every page renders per request from the database, so the build does not need database access, and settings changes appear immediately.

## External integrations needing credentials

None are required for the MVP. Prepared, but not connected:

- **WhatsApp Business API, SMS, email.** `src/lib/notifications/index.ts` defines the provider interface. With no provider registered, it reports `not_configured` and never claims a message was sent. Each provider needs its own account, credentials and message templates.
- **Online payments.** Not built; payments are recorded manually.
- **File storage** for caregiver documents, logo and service images. Not built; links to images can be pasted in Settings.

## Known limitations and unfinished items

- No caregiver self-service portal (data model ready).
- No uploads: caregiver documents are described in verification records rather than stored; logo and service images are URL fields.
- No automated reminders: follow-ups appear in the admin with overdue highlighting, but nothing is sent.
- Assignment amounts are totals for the whole arrangement. Monthly invoicing for very long arrangements can be handled with adjustments, but there is no invoice generator.
- Reports cover the dashboard metrics and charts. There is no CSV export.
- English only; the structure is ready for Hindi but no translations exist.
- No logo or photography yet (wordmark shown). Only add photos the business has the right to use, and never present stock photos of people as bureau staff.
- Light theme only, as pinned by the brief.
- Lint reports 2 warnings (React Compiler skipping two React Hook Form components). These are informational.

## Content the business must review

These items contain draft or placeholder wording. Review them in **Admin → Settings** before publishing:

- **Policy pages:** Privacy Policy, Terms of Service, Cancellation and Refund Policy, and Service Limitations and Emergency Disclaimer. These are seeded as drafts marked "DRAFT FOR REVIEW" with `[bracketed]` placeholders, and flagged "Needs review".
- **About text:** has a placeholder for the year established and registration details.
- **Settings fields:** home page headline and introduction, and the consent wording. The default headline is neutral: "Patient care at home, arranged by people who call you back".
- **Service localities:** the request form's locality list is a starting set of real Delhi NCR localities written by the developer, not supplied by the bureau. Confirm, add or deactivate them in **Settings → Service areas**. The homepage shows cities only.
- **Contact details:** phone, WhatsApp, email, hours and address. These are empty until set, and the matching buttons are hidden until then.
- **Pricing:** no prices are seeded. Set 12-hour and 24-hour rates per service, and the commission policy (default: 10% of the agreed customer amount, recognised on confirmation).
