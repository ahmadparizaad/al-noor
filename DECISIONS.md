# Al Noor — Decisions & Operational Facts

Living record of business/technical decisions made in working sessions.
Update this when a decision changes — future sessions read it instead of
re-asking.

## Business

- **Al Noor does not manufacture.** Partner factories manufacture; Al Noor
  distributes. Currently retail-only; wholesale planned later. No hardcoded
  brand copy claiming manufacturing.
- **No return/refund policy today** — but one is planned later, so keep
  order-status and policy code extensible for it. **Replacement IS offered.**
- No hardcoded/fallback demo data on order confirmation, tracking, or PDP —
  everything renders from real backend data.

## Shipping — Delhivery (2026-07)

- **No automatic shipment creation.** Orders placed on the site do NOT
  auto-create anything on Delhivery. Admin reviews the order in the admin
  panel and creates the shipment manually from there (the Delhivery order is
  created at shipment-creation time). Decided 2026-07-05 after evaluating
  auto-creation cons.
- Pickup location name on Delhivery: **"AL B2C"**.
- **Status sync = polling cron**, not webhooks:
  `/api/cron/sync-delhivery` scheduled via `vercel.json`. A fixed set of
  order statuses is defined in `src/lib/schema.ts`; tracking/waybill data
  flows from the cron into orders.
- 2026-07-06: Delhivery account had a restriction; support was contacted.
  Verify shipment creation works end-to-end before assuming a code bug.

## Payments

- **Cashfree integration is LEGACY — do not use, do not extend.** Kept as
  dead code deliberately (may be integrated properly later). Don't "clean it
  up" without being asked.

## Notifications & Auth

- **Email service: Resend** (`src/lib/email.ts`; falls back to console
  logging in dev when `RESEND_API_KEY` is missing).
- **WhatsApp: coming soon** — shown as "coming soon" in the login methods
  UI. Notifications will eventually go out via BOTH email and WhatsApp.
- Full notification module design: `plans/notification-module.md` (written
  2026-07-09, not yet implemented).

## Technical constraints

- **DB is Neon + Drizzle over the `neon-http` driver — no transaction
  support.** Don't write `db.transaction(...)`; use sequential writes with
  compensating logic where needed.
- Deployed on Vercel (crons live in `vercel.json`).
