# Notification Module — Implementation Plan

## Current state (as of this session)

Notifications exist as two independent channel libraries with no shared abstraction:

- **Email** — `src/lib/email.ts`, via **Resend** (`RESEND_API_KEY`, falls back to console log if unset).
  Exports: `sendVerificationEmail()`, `sendOrderConfirmationEmail()`.
- **WhatsApp** — `src/lib/whatsapp.ts`, via **Meta WhatsApp Cloud API** (`WHATSAPP_ACCESS_TOKEN` + `WHATSAPP_PHONE_NUMBER_ID`, falls back to console log if unset). Requires pre-approved message templates in Meta Business Manager.
  Exports: `sendWhatsAppOtp()`, `sendWhatsAppOrderConfirmation()`, `sendWhatsAppOrderStatusUpdate()`.

**Call sites today:**

| Event | File | Email | WhatsApp |
|---|---|---|---|
| Order placed (COD checkout) | `src/app/api/payments/initiate/route.ts` | ✅ awaited, try/caught | ✅ awaited, try/caught |
| Order status changed by admin (`processing`/`shipped`/etc.) | `src/lib/actions/admin.ts` `updateOrderStatus()` | ❌ none | ✅ fire-and-forget `.catch()` |
| Order cancelled by customer/admin | `src/lib/actions/orders.ts` `cancelOrder()` | ❌ none | ❌ none |
| Delhivery status synced by cron (`delivered`, RTO→`cancelled`) | `src/app/api/cron/sync-delhivery/route.ts` | ❌ none | ❌ none |
| Registration | `src/app/api/auth/register/route.ts` | ✅ `sendVerificationEmail()` | n/a |
| Login OTP | `src/app/api/auth/otp/send/route.ts` | n/a | ✅ `sendWhatsAppOtp()` (backend works; UI marked "coming soon") |
| Payment webhook (Cashfree) | `src/app/api/payments/callback/route.ts` | ✅ (dead code path — Cashfree unused) | n/a |

**Problems this plan addresses:**
1. Every new order-lifecycle event that needs a notification requires touching two separate libraries and remembering both channels — no single place enforces "always try both."
2. Inconsistent invocation style: `initiate/route.ts` awaits both channels sequentially inline; `admin.ts` fires WhatsApp only, unawaited. No consistent pattern to copy.
3. Two real gaps: **cancellation** and **cron-driven delivery/RTO status changes** send zero customer notification today.
4. Template/event mapping (which WhatsApp template name, which email subject, per event) is scattered as inline strings at each call site instead of centralized.
5. No visibility into partial failures (e.g., email fails, WhatsApp succeeds) beyond a `console.error` per call site.

---

## Goals

- One entry point per business event (e.g. `notifyOrderPlaced(order)`, `notifyOrderStatusChanged(order, previousStatus)`, `notifyOrderCancelled(order)`) that internally fans out to whichever channels are relevant for that event, so **callers never import `email.ts` or `whatsapp.ts` directly for order lifecycle events**.
- Centralize the event → channel → template/subject mapping in one module, not scattered across action files.
- Consistent failure handling: a notification failure must never fail the underlying business operation (order creation, status update, cancellation) — channels run independently, each failure logged with enough context to debug, no unhandled rejections.
- Close the two real gaps: cancellation and cron-driven delivery/RTO updates.
- Keep it boring — this is a fan-out + logging layer, not a queue/worker system. No new infrastructure (no Redis, no job queue) unless a concrete need shows up later.
- Preserve existing channel-specific code (`email.ts`, `whatsapp.ts`) as-is internally; the new module wraps them, it doesn't rewrite them.

## Non-goals (for this pass)

- No retry/backoff queue. If Resend/Meta API is down, the notification is logged and dropped — consistent with today's behavior, not a regression.
- No user notification preferences (e.g., "email only, no WhatsApp") — not requested, adds a settings surface with no current UI ask.
- No SMS or push channels — only email + WhatsApp, per your instruction.
- No admin-facing notification log/dashboard — worth a future pass if debugging failures becomes painful, not in scope now.
- No changes to WhatsApp being "coming soon" for **login** — that's UI-scoped and unrelated; WhatsApp for order notifications is a different, already-working use case and stays active.

---

## Design

### Module layout

```
src/lib/notifications/
  index.ts        — public API: notifyOrderPlaced, notifyOrderStatusChanged, notifyOrderCancelled
  events.ts        — event → { email?, whatsapp? } template/subject mapping, order-status → customer-facing copy
  dispatch.ts       — internal fan-out helper: runs channel sends in parallel, isolates failures, logs uniformly
```

- `email.ts` and `whatsapp.ts` remain the low-level channel clients — untouched, still directly usable for non-order notifications (e.g. `sendVerificationEmail` stays called directly from `register/route.ts`, since that's not an order-lifecycle event).
- The new module only owns **order lifecycle** notifications (placed, status changed, cancelled) — the clearest, most duplicated case today.

### `dispatch.ts` — shared fan-out helper

```ts
interface ChannelResult {
  channel: 'email' | 'whatsapp'
  success: boolean
  error?: string
}

async function dispatch(sends: Array<{ channel: 'email' | 'whatsapp'; send: () => Promise<{ success: boolean; error?: string }> }>): Promise<ChannelResult[]> {
  const results = await Promise.allSettled(sends.map(s => s.send()))
  return results.map((r, i) => {
    const channel = sends[i].channel
    if (r.status === 'fulfilled') {
      if (!r.value.success) console.error(`[notify] ${channel} send failed:`, r.value.error)
      return { channel, success: r.value.success, error: r.value.error }
    }
    console.error(`[notify] ${channel} send threw:`, r.reason)
    return { channel, success: false, error: String(r.reason) }
  })
}
```

- `Promise.allSettled` — email and WhatsApp always both attempt, independently, regardless of the other's outcome. Matches current `initiate/route.ts` intent but makes it concurrent instead of sequential (that route currently awaits email fully before starting WhatsApp — needless latency).
- Return value lets callers optionally inspect what happened, but nothing requires them to — same "fire and forget with logging" spirit as today's `admin.ts` pattern.

### `events.ts` — centralized event copy

Single place mapping an order-lifecycle event to per-channel content, replacing the inline string-building currently duplicated in `initiate/route.ts` and `admin.ts`:

```ts
export type OrderEvent = 'placed' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

// One customer-facing note per event, reused by both channels where applicable.
// (Exact copy TBD during implementation — this centralizes what's currently
// inline in admin.ts's trackingNote logic and whatsapp.ts's per-status branching.)
```

### `index.ts` — public API

```ts
export async function notifyOrderPlaced(order: OrderNotificationInput): Promise<void>
export async function notifyOrderStatusChanged(order: OrderNotificationInput, event: OrderEvent): Promise<void>
export async function notifyOrderCancelled(order: OrderNotificationInput): Promise<void>
```

Each function:
1. Resolves customer email + phone from the order/shipping address.
2. Builds the channel-specific payload via `events.ts`.
3. Calls `dispatch()` with whichever channels have a valid recipient (skip email if no address on file, skip WhatsApp if no phone — same guard pattern `initiate/route.ts` already uses for phone).
4. Never throws — callers can `await` for ordering (e.g. wait before revalidating a path) without needing try/catch, since `dispatch` already isolates failures internally.

---

## Migration of existing call sites

1. **`src/app/api/payments/initiate/route.ts`** — replace the two sequential `sendOrderConfirmationEmail` / `sendWhatsAppOrderConfirmation` blocks (lines 89–132) with a single `await notifyOrderPlaced(...)` call. Net simplification, same behavior, now concurrent instead of sequential.
2. **`src/lib/actions/admin.ts` `updateOrderStatus()`** — replace the WhatsApp-only fire-and-forget block (lines 248–264) with `notifyOrderStatusChanged(...)`, which now also sends email (a real behavior addition — confirm you want status-change emails, not just WhatsApp, before this ships; flagged as an open question below).
3. **`src/lib/actions/orders.ts` `cancelOrder()`** — add `await notifyOrderCancelled(...)` after the DB transaction succeeds. New behavior — closes the gap where cancellation currently notifies nobody.
4. **`src/app/api/cron/sync-delhivery/route.ts`** — after a status update to `delivered` or `cancelled` (RTO), call `notifyOrderStatusChanged(...)`. New behavior — closes the gap where Delhivery-driven status changes (the entire point of the cron) currently notify nobody, which is arguably the most valuable gap to close since it's the one case where the *customer* wouldn't otherwise find out proactively.

---

## Open questions before implementation

1. **Should order status-change notifications go out over email too, not just WhatsApp (as today)?** Centralizing invites doing both, but that's new customer-facing behavior (more emails sent) — confirm you want this before I add it, or if WhatsApp-only for status changes (matching today) is intentional and should stay that way with email only for "placed" and "cancelled".
2. **Cancellation copy** — what should the email/WhatsApp cancellation message say, given no refund policy exists yet (per earlier COD-only decision)? I'd reuse the WhatsApp cancellation wording already fixed this session ("Your order has been cancelled. No payment was collected for this order.") and mirror it in a new cancellation email template — confirm.
3. **Delivered/RTO-from-cron copy** — "Delivered" notification is straightforward (thank you / feedback prompt). RTO (mapped to `cancelled` in the cron) is more delicate — should this read as a plain cancellation notice, or something distinguishing "returned to us by courier" from "you cancelled it"? Current cron mapping collapses both into the same `cancelled` status, so today there's no way to tell them apart downstream — worth flagging as a possible schema gap (e.g. a separate `rto` status) if you want the distinction, independent of this notification work.
4. **Retry on failure** — confirmed non-goal above, but flagging explicitly: if Resend or Meta's API has an outage, that notification is simply lost (matches today). If this becomes a real operational problem later, the natural next step is a `notification_log` table + a retry cron, not a queue — worth deferring until it's an actual pain point.

---

## Implementation checklist (once open questions are resolved)

- [ ] Create `src/lib/notifications/dispatch.ts` (fan-out helper)
- [ ] Create `src/lib/notifications/events.ts` (event → copy mapping)
- [ ] Create `src/lib/notifications/index.ts` (`notifyOrderPlaced`, `notifyOrderStatusChanged`, `notifyOrderCancelled`)
- [ ] Add `sendOrderCancellationEmail()` to `email.ts` (new — no cancellation email exists today)
- [ ] Confirm/add WhatsApp templates in Meta Business Manager for any new event copy (WhatsApp Cloud API requires pre-approved templates — this is an external dependency, not just a code change)
- [ ] Migrate `payments/initiate/route.ts` to `notifyOrderPlaced`
- [ ] Migrate `admin.ts` `updateOrderStatus()` to `notifyOrderStatusChanged`
- [ ] Wire `notifyOrderCancelled` into `orders.ts` `cancelOrder()`
- [ ] Wire `notifyOrderStatusChanged` into `cron/sync-delhivery/route.ts` for `delivered`/`cancelled` transitions
- [ ] Run code-reviewer on the new module and all migrated call sites
