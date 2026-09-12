#!/usr/bin/env node
/**
 * Razorpay proof of concept — runs the whole payment path locally, with no
 * Razorpay account.
 *
 * What it stands in for, and what it does NOT:
 *
 *   ✔ the Orders API      — a stub on :4000 that answers POST /v1/orders the
 *                           way Razorpay does, so createIntent() is exercised
 *                           for real (real HTTP, real Basic auth, real parsing)
 *   ✔ the webhook         — a genuinely HMAC-signed payment.captured POST, so
 *                           signature verification, idempotency, order lookup
 *                           and the PENDING_PAYMENT → CONFIRMED transition all
 *                           run exactly as they will in production
 *   ✘ checkout.js         — Razorpay's hosted modal needs a real key. The
 *                           browser half is verified against the live sandbox
 *                           once test keys exist; everything server-side is
 *                           identical either way.
 *
 * Usage:
 *   node scripts/razorpay-poc.mjs serve     # stub Orders API only (port 4000)
 *   node scripts/razorpay-poc.mjs run       # stub + full end-to-end run
 *   node scripts/razorpay-poc.mjs webhook <razorpay_order_id> [event]
 *
 * `run` expects the backend started with the POC config — see
 * docs/razorpay-poc.md.
 */

import { createHmac, randomBytes } from "node:crypto";
import { createServer } from "node:http";

const BACKEND = process.env.TAPA_BACKEND ?? "http://localhost:8080";
const STUB_PORT = Number(process.env.TAPA_RAZORPAY_STUB_PORT ?? 4000);
const WEBHOOK_SECRET = process.env.TAPA_RAZORPAY_WEBHOOK_SECRET ?? "poc_webhook_secret";
const ADMIN_PHONE = process.env.TAPA_ADMIN_PHONE ?? "+919876543210";
const OTP = "000000";

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  ok: (s) => `\x1b[32m${s}\x1b[0m`,
  bad: (s) => `\x1b[31m${s}\x1b[0m`,
  head: (s) => `\x1b[1m\x1b[35m${s}\x1b[0m`,
};
const step = (n, title) => console.log(`\n${c.head(`${n}. ${title}`)}`);

/* ─────────────────────── the stub Orders API ─────────────────────── */

function startStub() {
  const issued = new Map();
  const server = createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (req.method !== "POST" || !req.url.startsWith("/v1/orders")) {
        res.writeHead(404).end('{"error":"no such route"}');
        return;
      }
      // Razorpay authenticates with HTTP Basic key_id:key_secret. Assert it is
      // present so the POC would catch us forgetting to send it.
      if (!(req.headers.authorization ?? "").startsWith("Basic ")) {
        res.writeHead(401).end('{"error":{"description":"missing basic auth"}}');
        return;
      }
      const parsed = JSON.parse(body || "{}");
      const id = `order_POC${randomBytes(7).toString("hex")}`;
      issued.set(id, parsed);
      const reply = {
        id,
        entity: "order",
        amount: parsed.amount,
        amount_paid: 0,
        amount_due: parsed.amount,
        currency: parsed.currency ?? "INR",
        receipt: parsed.receipt,
        status: "created",
        notes: parsed.notes ?? {},
        created_at: Math.floor(Date.now() / 1000),
      };
      console.log(c.dim(`   [stub] POST /v1/orders → ${id} (₹${(parsed.amount ?? 0) / 100}, receipt ${parsed.receipt})`));
      res.writeHead(200, { "content-type": "application/json" }).end(JSON.stringify(reply));
    });
  });
  return new Promise((resolve) => {
    server.listen(STUB_PORT, () => {
      console.log(c.dim(`   [stub] Razorpay Orders API stand-in on http://localhost:${STUB_PORT}`));
      resolve({ server, issued });
    });
  });
}

/* ─────────────────────────── the webhook ─────────────────────────── */

/**
 * Razorpay's payment.captured shape, trimmed to the fields we read. The
 * signature is computed over the exact bytes we send — same rule the backend
 * verifies by, and the reason we stringify once and reuse the string.
 */
function buildWebhook({ razorpayOrderId, amountPaise, method, event }) {
  const paymentId = `pay_POC${randomBytes(7).toString("hex")}`;
  const payload = {
    entity: "event",
    account_id: "acc_POC",
    event,
    contains: ["payment"],
    payload: {
      payment: {
        entity: {
          id: paymentId,
          entity: "payment",
          amount: amountPaise,
          currency: "INR",
          status: event === "payment.failed" ? "failed" : "captured",
          order_id: razorpayOrderId,
          method,
          captured: event !== "payment.failed",
          vpa: method === "upi" ? "success@razorpay" : undefined,
          created_at: Math.floor(Date.now() / 1000),
        },
      },
    },
    created_at: Math.floor(Date.now() / 1000),
  };
  const raw = JSON.stringify(payload);
  return {
    raw,
    paymentId,
    eventId: `evt_POC${randomBytes(7).toString("hex")}`,
    signature: createHmac("sha256", WEBHOOK_SECRET).update(raw).digest("hex"),
  };
}

async function sendWebhook(webhook, { corrupt = false } = {}) {
  const res = await fetch(`${BACKEND}/api/v1/payments/razorpay/webhook`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Razorpay-Event-Id": webhook.eventId,
      "X-Razorpay-Signature": corrupt ? "0".repeat(64) : webhook.signature,
    },
    body: webhook.raw,
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
}

/* ───────────────────────────── helpers ───────────────────────────── */

async function api(path, init = {}) {
  const res = await fetch(`${BACKEND}/api/v1${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    body: init.body ? JSON.stringify(init.body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, ...json };
}

async function adminCookie() {
  await api("/auth/otp/request", { method: "POST", body: { phone: ADMIN_PHONE } });
  const res = await fetch(`${BACKEND}/api/v1/auth/otp/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: ADMIN_PHONE, code: OTP }),
  });
  return (res.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
}

/* ──────────────────────────── the run ────────────────────────────── */

async function run() {
  const { server } = await startStub();

  step(1, "Place an order through the real checkout endpoint");
  const checkout = await api("/checkout", {
    method: "POST",
    body: {
      items: [{ productSlug: "shakti-navratri-kit", qty: 1 }],
      address: {
        name: "POC Buyer",
        phone: "9812366666",
        line1: "12 Test Road",
        line2: "Hauz Khas",
        city: "Delhi",
        state: "Delhi",
        pincode: "110001",
      },
      paymentMethod: "upi",
      phone: "9812366666",
    },
  });
  if (!checkout.data) {
    console.log(c.bad(`   checkout failed (HTTP ${checkout.status}): ${JSON.stringify(checkout.error ?? checkout)}`));
    console.log(c.dim("   Is the backend running with the POC config, and kits_launched ON?"));
    server.close();
    process.exit(1);
  }
  const { orderNumber, totalPaise, payment } = checkout.data;
  console.log(`   Tapa order      ${c.ok(orderNumber)}  ₹${totalPaise / 100}`);
  console.log(`   provider        ${payment.provider}`);
  if (payment.provider !== "razorpay") {
    console.log(c.bad("   Expected the razorpay provider — the backend is still on the mock."));
    console.log(c.dim("   Start it with tapa.razorpay.key-id set (see docs/razorpay-poc.md)."));
    server.close();
    process.exit(1);
  }
  console.log(`   razorpay order  ${c.ok(payment.razorpayOrderId)}`);
  console.log(c.dim(`   → the browser would now open checkout.js with this order_id`));

  step(2, "Order sits at PENDING_PAYMENT until a capture arrives");
  const before = await api(`/orders/${orderNumber}?phone=9812366666`);
  console.log(`   status          ${before.data?.status}`);

  step(3, "Reject a webhook with a bad signature (the security check)");
  const forged = buildWebhook({
    razorpayOrderId: payment.razorpayOrderId,
    amountPaise: totalPaise,
    method: "upi",
    event: "payment.captured",
  });
  const rejected = await sendWebhook(forged, { corrupt: true });
  console.log(`   HTTP ${rejected.status} ${rejected.status === 400 ? c.ok("rejected ✓") : c.bad("NOT rejected ✗")}  ${JSON.stringify(rejected.body)}`);

  step(4, "Deliver a genuine payment.captured webhook");
  const genuine = buildWebhook({
    razorpayOrderId: payment.razorpayOrderId,
    amountPaise: totalPaise,
    method: "upi",
    event: "payment.captured",
  });
  const accepted = await sendWebhook(genuine);
  console.log(`   payment         ${genuine.paymentId}`);
  console.log(`   HTTP ${accepted.status} ${accepted.body.handled ? c.ok("handled ✓") : c.bad("not handled ✗")}  ${JSON.stringify(accepted.body)}`);

  step(5, "Razorpay retries the same event — we must not double-apply");
  const retry = await sendWebhook(genuine);
  console.log(`   HTTP ${retry.status} ${retry.body.duplicate ? c.ok("recognised as duplicate ✓") : c.bad("not deduped ✗")}  ${JSON.stringify(retry.body)}`);

  step(6, "Order after capture");
  const after = await api(`/orders/${orderNumber}?phone=9812366666`);
  const confirmed = after.data?.status === "CONFIRMED";
  console.log(`   status          ${confirmed ? c.ok(after.data.status) : c.bad(String(after.data?.status))}`);
  console.log(`   note            ${after.data?.statusNote ?? ""}`);

  step(7, "The webhook audit trail (admin)");
  const cookie = await adminCookie();
  const log = await fetch(`${BACKEND}/api/v1/admin/payments/webhooks?limit=5`, { headers: { cookie } });
  const logJson = await log.json().catch(() => ({}));
  for (const e of logJson.data ?? []) {
    console.log(`   ${e.receivedAt}  ${String(e.event ?? "-").padEnd(18)} ${String(e.outcome).padEnd(20)} sig=${e.signatureValid} ${e.orderNumber ?? ""}`);
  }

  console.log(
    `\n${confirmed ? c.ok("POC passed") : c.bad("POC failed")} — order ${orderNumber} is ${after.data?.status}\n`,
  );
  server.close();
  process.exit(confirmed ? 0 : 1);
}

/* ─────────────────────────────── main ────────────────────────────── */

const [, , command = "run", ...rest] = process.argv;

if (command === "serve") {
  await startStub();
  console.log(c.dim("   Ctrl-C to stop."));
} else if (command === "webhook") {
  const [razorpayOrderId, event = "payment.captured"] = rest;
  if (!razorpayOrderId) {
    console.error("usage: node scripts/razorpay-poc.mjs webhook <razorpay_order_id> [event]");
    process.exit(1);
  }
  const w = buildWebhook({ razorpayOrderId, amountPaise: 175100, method: "upi", event });
  const res = await sendWebhook(w);
  console.log(`HTTP ${res.status}`, res.body);
} else if (command === "run") {
  await run();
} else {
  console.error(`unknown command: ${command}`);
  process.exit(1);
}
