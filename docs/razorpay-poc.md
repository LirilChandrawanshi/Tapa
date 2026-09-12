# Razorpay — how payments actually work here

Status: **implemented, proven locally, not yet run against a real Razorpay account.**
Everything below is in the tree today. What is missing is one pair of test keys.

---

## 1. The shape of it

```
browser                    tapa backend                    Razorpay
   │                            │                              │
   │  POST /api/v1/checkout     │                              │
   ├───────────────────────────>│  POST /v1/orders             │
   │                            ├─────────────────────────────>│
   │   { razorpayOrderId, … }   │   order_xxx                  │
   │<───────────────────────────┤<─────────────────────────────┤
   │                            │                              │
   │  checkout.js modal — UPI / card / netbanking              │
   ├──────────────────────────────────────────────────────────>│
   │                            │                              │
   │  handler(order_id, payment_id, signature)                 │
   │<──────────────────────────────────────────────────────────┤
   │  POST /payments/razorpay/verify  ← fast path, optimistic  │
   ├───────────────────────────>│                              │
   │                            │                              │
   │                            │  POST /payments/razorpay/webhook
   │                            │<─────────────────────────────┤
   │                            │  ← path of record            │
```

**Two confirmation paths, on purpose.**

- `/verify` is the browser's success handler. Fast, so the buyer gets their
  confirmation screen immediately — but it only fires if their tab survives the
  round trip to their UPI app and back. On Android that is not a given.
- `/webhook` is server to server. Razorpay retries it for 24 hours until we
  answer `2xx`. It arrives whether or not the buyer's phone did anything
  sensible. **This is the source of truth.**

Both funnel into the same `CheckoutService.confirmPayment`, which is idempotent
(`if status != PENDING_PAYMENT → return`), so whichever wins the race, the order
advances exactly once and stock is reserved exactly once.

---

## 2. Files

| What | Where |
|---|---|
| Gateway interface (unchanged) | `commerce/PaymentProvider.java` |
| Razorpay implementation | `commerce/RazorpayPaymentProvider.java` |
| HMAC verification, no Spring | `commerce/RazorpaySignatures.java` |
| Credentials | `commerce/RazorpayProperties.java` |
| Razorpay-or-mock fork | `commerce/PaymentProviderConfig.java` |
| `/verify` + `/webhook` + admin log | `commerce/RazorpayWebhookController.java` |
| Webhook audit trail | `commerce/PaymentWebhookEvent.java` |
| checkout.js loader | `frontend/lib/razorpay.ts` |
| Modal wiring | `frontend/components/shop/CheckoutView.tsx` |
| Local POC | `scripts/razorpay-poc.mjs` |
| Tests (14) | `commerce/RazorpaySignaturesTest.java` |

No new Maven or npm dependency. The Razorpay surface we need is one POST and
two HMACs, so it is `java.net.http.HttpClient` + `javax.crypto.Mac`.

---

## 3. Two signatures, two secrets

This is the part that costs people an afternoon, so it is spelled out:

| | Signed over | Secret | Where |
|---|---|---|---|
| Handler callback | `order_id + "\|" + payment_id` | **key secret** | `verifyPayment` |
| Webhook | **the raw request body** | **webhook secret** | `verifyWebhook` |

The webhook secret is a *different* value you type into the Razorpay Dashboard
when creating the webhook. It is not the key secret.

And the body must be hashed exactly as received. `RazorpayWebhookController`
takes `@RequestBody String` rather than a parsed object for precisely this
reason — Jackson round-tripping the JSON changes whitespace and key order, and
the signature stops matching. There is a test pinning that
(`rejectsAReserialisedCopyOfTheSameJson`).

---

## 4. Running the POC (no Razorpay account needed)

`scripts/razorpay-poc.mjs` stands in for Razorpay's Orders API and posts a
genuinely signed webhook. Everything server-side runs for real.

```bash
# terminal 1 — backend with the POC gateway bound
cd backend
TAPA_RAZORPAY_KEY_ID=rzp_test_poc \
TAPA_RAZORPAY_KEY_SECRET=poc_key_secret \
TAPA_RAZORPAY_WEBHOOK_SECRET=poc_webhook_secret \
TAPA_RAZORPAY_BASE_URL=http://localhost:4000 \
mvn spring-boot:run

# terminal 2
TAPA_RAZORPAY_WEBHOOK_SECRET=poc_webhook_secret node scripts/razorpay-poc.mjs run
```

Last run, verbatim:

```
1. Place an order through the real checkout endpoint
   [stub] POST /v1/orders → order_POC960df95939f6dd (₹1751, receipt TK-2026-0018)
   Tapa order      TK-2026-0018  ₹1751
   provider        razorpay
2. Order sits at PENDING_PAYMENT until a capture arrives
   status          PENDING_PAYMENT
3. Reject a webhook with a bad signature (the security check)
   HTTP 400 rejected ✓   {"ok":false,"reason":"signature"}
4. Deliver a genuine payment.captured webhook
   HTTP 200 handled ✓    {"ok":true,"handled":true}
5. Razorpay retries the same event — we must not double-apply
   HTTP 200 recognised as duplicate ✓
6. Order after capture
   status          CONFIRMED
7. The webhook audit trail (admin)
   … payment.captured   DUPLICATE            sig=true TK-2026-0018
   … payment.captured   APPLIED              sig=true TK-2026-0018
   … -                  REJECTED_SIGNATURE   sig=false

POC passed — order TK-2026-0018 is CONFIRMED
```

What the POC does **not** cover: Razorpay's hosted `checkout.js` modal. It
needs a real key, so the browser half is verified once test keys exist. Nothing
server-side changes between the two.

---

## 5. Going live on the real test sandbox

1. **Keys** — Razorpay Dashboard → Settings → API Keys → *Generate Test Key*.
   You get `rzp_test_…` and a secret shown exactly once.

2. **Put them somewhere gitignored.** `backend/config/application.yml` is already
   gitignored and auto-loaded:

   ```yaml
   tapa:
     razorpay:
       key-id: rzp_test_xxxxxxxxxxxx
       key-secret: xxxxxxxxxxxxxxxxxxxxxxxx
       webhook-secret: pick-any-long-random-string
   ```

   Leave `base-url` unset so it points at the real `api.razorpay.com`.
   **Never commit a key secret.** The key *id* is public by design — it ships in
   the page source of every Razorpay integration — the secret is not.

3. **Expose the webhook.** Razorpay cannot reach `localhost`:

   ```bash
   ngrok http 8080
   # → https://<something>.ngrok-free.app
   ```

4. **Create the webhook** — Dashboard → Settings → Webhooks → Add New Webhook:

   - URL: `https://<something>.ngrok-free.app/api/v1/payments/razorpay/webhook`
   - Secret: the same string you put in `webhook-secret` above
   - Events: `payment.captured`, `payment.failed`, `order.paid`

   The ngrok URL changes on every restart on the free plan, so expect to edit
   this each session.

5. **Restart the backend** and check the boot line:

   ```
   [payments] Razorpay bound in TEST mode (key rzp_test_…)
   ```

   If you see `no tapa.razorpay.key-id — using the mock provider`, the config
   did not load.

6. **Pay.** Checkout → Pay → the Razorpay modal opens. In test mode UPI accepts
   `success@razorpay` (succeeds) and `failure@razorpay` (fails). Test cards are
   in Razorpay's docs; `4111 1111 1111 1111` with any future expiry works.

7. **Watch it land:**

   ```bash
   curl -s -b cookies.txt 'http://localhost:8080/api/v1/admin/payments/webhooks?limit=10' | jq
   ```

   or the ngrok inspector at <http://localhost:4040>, which shows every delivery
   and lets you replay one.

---

## 5b. Live test-sandbox status

Test keys are configured in `backend/config/application.yml` (gitignored) and
the gateway is bound:

```
[payments] Razorpay bound in TEST mode (key rzp_test_TbDnUCXLEYyp63)
```

Verified against the real `api.razorpay.com`:

- **Orders API** — `POST /api/v1/checkout` created `order_TbDp03ewcJuUEk`
  for Tapa order `TK-2026-0020`, ₹1,751.
- **checkout.js modal** — opens with the Test Mode ribbon, "the tapa company"
  branding, the brand pink theme and the buyer's number prefilled.
- **Webhook over a public tunnel** — a signed `payment.captured` posted to the
  ngrok URL returned `{ok: true, handled: true}` and moved `TK-2026-0020` from
  `PENDING_PAYMENT` to `CONFIRMED`. Unsigned bodies get `400`.

Two things are still on the Razorpay side, not ours:

1. **UPI is disabled on the account.** `GET /v1/preferences` reports
   `upi: false` and `upi_type: {collect: 0, intent: 0}`, which is why the modal
   lists only Cards, Netbanking and Wallet. Enable it in Dashboard → Settings →
   Configuration → Payment Methods (it usually needs account activation first).
   Nothing in our code changes when it is switched on — the modal picks up
   whatever the account offers.
2. **The webhook is not registered yet.** Until it is, only the browser handler
   path fires; the path of record stays idle.

## 6. Behaviour worth knowing

- **No credentials touch us.** Card numbers and UPI PINs are entered inside
  Razorpay's iframe. Our origin never sees them, which is what keeps PCI scope
  at SAQ-A.
- **`payment.failed` does not cancel the order.** It stays `PENDING_PAYMENT` so
  the buyer can retry from the same cart, and the retry re-opens the *same*
  Razorpay order id rather than minting a second Tapa order.
- **Unknown events are acknowledged, not acted on.** Anything authentic gets a
  `200` so Razorpay stops retrying; the reason we did nothing is written to the
  audit trail. Only an unverifiable signature gets a `400`.
- **The mock provider is untouched.** With no key configured, dev checkout works
  exactly as it did — no gateway call, no webhook, instant confirm. That is what
  keeps `make backend` working on a laptop with no credentials and why the 55
  existing tests did not need changing.

## 7. Still to do before real money

- [ ] Refunds — `POST /v1/payments/{id}/refund`. `CheckoutService.cancel`
      already computes `refundPaise`; nothing calls Razorpay with it yet.
- [ ] `refund.processed` webhook → close the loop on the order.
- [ ] Reconciliation job: orders stuck in `PENDING_PAYMENT` older than ~30 min
      should be checked against `GET /v1/orders/{id}/payments` rather than
      waiting for a webhook that may never come.
- [ ] Rate-limit `/payments/razorpay/webhook`. It is unauthenticated by
      necessity; the signature check is cheap, but it is still a public POST.
- [ ] Razorpay account activation (KYC) before live keys exist at all.
