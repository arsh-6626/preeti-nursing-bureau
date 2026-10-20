# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Pinned by the brief: Next.js (App Router, TypeScript), Tailwind CSS, PostgreSQL via Prisma, Zod + React Hook Form, Recharts, Vitest + Playwright. Postgres runs in Docker for development (confirmed by the user). Installed versions: Next 16.4, React 19.3, Prisma 7.10 (stable; 8 is still RC), Tailwind 4.

## Users

- **Families and patients in Delhi NCR** who need a caregiver at home, often in a stressful moment (a discharge from hospital, an elderly parent who can no longer manage alone). Frequently on a phone, often not technically confident, sometimes filling the form on behalf of someone else.
- **The bureau administrator** (owner/operator) who takes every inquiry, calls the family, matches a caregiver by hand, confirms the placement, and tracks money owed and earned.
- **Staff members** (optional, future): handle assigned leads and follow-ups without access to finances or settings.

## Product Purpose

Preeti Nursing Bureau connects families with General Duty Assistants, home nurses, and patient attendants, and earns a commission on each successful placement. The product has two jobs: turn a worried family's visit into a structured, contactable request, and give the bureau one place to run the whole pipeline from inquiry to matched caregiver to payments and commission.

Success: a family can submit a clear request from a phone in a few minutes and knows exactly what happens next; the administrator never loses a lead, never double-books a caregiver, and always knows what has been collected, what is owed, and what has been earned.

## Positioning

A human-run bureau, not a marketplace or app. Every match is reviewed and confirmed by a person who has called the family. Nothing is auto-booked, and nothing is promised before a conversation.

## Operating Context

- Inquiries arrive by website form, phone, and WhatsApp. All conversations happen by phone or WhatsApp.
- Only two shift types exist: 12 hours and 24 hours. A 24-hour arrangement involves rest and relief planning, never one person working continuously.
- Payments are recorded manually (cash, UPI, bank transfer). There is no payment gateway.
- Service area: Delhi NCR (Delhi, Noida, Greater Noida, Ghaziabad, Gurugram, Faridabad), activated area by area.

## Capabilities and Constraints

- Public site without login; multi-step care request; reference number on submit.
- Admin: leads, customers, caregivers and verification, matching, manual assignment, pricing by shift type, commissions, payments, follow-ups, reports, settings.
- Language: English only for the MVP (confirmed). Structure kept ready for Hindi later.
- Undecided / configurable: phone number, WhatsApp number, email, business hours, address, registration details, pricing amounts, commission policy values.

## Brand Commitments

- Name: Preeti Nursing Bureau. Region: Delhi NCR.
- Palette direction pinned by the brief: white and neutral grounds, muted teal and navy, subtle green accents. No heavy gradients, no fake ratings.
- No logo or photography exists yet (confirmed). A simple wordmark is used; the logo is configurable.

## Evidence on Hand

None. There are no testimonials, reviews, certifications, registrations, caregiver counts, or performance figures, and none may be invented. No photographs of real staff or caregivers. Generic stock photos are allowed (confirmed 2026-10-12) but must never be presented as bureau staff, caregivers or clients.

## Product Principles

1. Calm over clever: a worried family should feel guided, never sold to.
2. Promise only what a person will confirm by phone.
3. Two shift types, everywhere, with no exceptions.
4. Money is recorded, never assumed: no "paid" without a payment record.
5. The admin works fast: clarity and speed over decoration.

## Accessibility & Inclusion

Users include older family members and people using phones with large text settings. Body text at least 16px, generous tap targets, high contrast, plain language, labels above inputs, and error messages that say how to fix the problem. WCAG 2.2 AA is the target.

## Design Preference (updated 2026-10-12)

The first build used the category-standard layout; the owner rejected it as looking like "a generic e-commerce platform". Confirmed new direction for the public site: a **medtech startup** feel (product-grade, modern health-tech, confident), replacing the earlier canon choice. The admin keeps its current Operate design. After two concept rolls the owner asked for it to "look like a real startup": the bar is funded medtech brands such as Hims, Forward, Function Health and One Medical (polished product UI, big confident type, strong photography, smooth motion). Convention executed at that craft level is the commitment. Stock photography is allowed when clearly generic: never captioned, implied or presented as the bureau's staff, caregivers or clients, and listed for later replacement with real photos.

## Homepage Photography (2026-10-20)

The homepage uses generated photographs supplied by the owner (prompts: bright, happy, well-kept Delhi homes; carers in a teal-green uniform with "Preeti Nursing Bureau" on the pocket; male carers with male patients, female with female). The 3D room and nurse moved to the booking page. Captions describe roles only and never name or imply real individuals.
