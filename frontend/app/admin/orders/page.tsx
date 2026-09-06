"use client";

/**
 * Admin · Orders (P2-M4). Table + status filter tabs; row click opens a drawer
 * with the full order and only the legal next transitions as buttons — the
 * backend state machine is mirrored here, and its 422s surface inline.
 */

import { useCallback, useEffect, useState } from "react";
import { adminGet, adminPost, fmtDateTime } from "@/lib/admin";
import { formatPaise, statusMeta, type StatusTone } from "@/lib/orders";
import {
  Btn,
  Drawer,
  Empty,
  Field,
  Input,
  Loading,
  Msg,
  PageHead,
  Table,
  Td,
} from "@/components/admin/ui";

/* ---------- shapes (full Order doc — admin sees phone/payment/internals) ---------- */

interface AdminOrderLine {
  productSlug?: string;
  title?: string;
  qty?: number;
  unitPricePaise?: number;
  orderByDate?: string | null;
  festivalDate?: string | null;
}

interface AdminOrderAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AdminOrder {
  id?: string;
  orderNumber?: string;
  phone?: string;
  userId?: string | null;
  items?: AdminOrderLine[];
  subtotalPaise?: number;
  deliveryPaise?: number;
  totalPaise?: number;
  address?: AdminOrderAddress | null;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentRef?: string | null;
  status?: string;
  statusNote?: string | null;
  expectedDelivery?: string | null;
  festivalDate?: string | null;
  cancellableUntil?: string | null;
  courier?: string | null;
  trackingId?: string | null;
  dispatchedAt?: string | null;
  cancelledAt?: string | null;
  refundPaise?: number | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "PACKING",
  "DISPATCHED",
  "DELIVERED",
  "CANCELLED",
  "REFUND_INITIATED",
  "REFUNDED",
] as const;

/** Mirror of AdminCommerceController.TRANSITIONS — the server still enforces. */
const NEXT: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  CONFIRMED: ["PACKING", "CANCELLED"],
  PACKING: ["DISPATCHED", "CANCELLED"],
  DISPATCHED: ["DELIVERED"],
  CANCELLED: ["REFUND_INITIATED"],
  REFUND_INITIATED: ["REFUNDED"],
};

const ACTION_LABEL: Record<string, string> = {
  PACKING: "Pack",
  DISPATCHED: "Dispatch",
  DELIVERED: "Mark delivered",
  CANCELLED: "Cancel order",
  REFUND_INITIATED: "Initiate refund",
  REFUNDED: "Mark refunded",
};

const TONE_CLS: Record<StatusTone, string> = {
  good: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  progress: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  attention: "bg-card text-cta border-cta",
  neutral: "bg-bg text-sub border-border",
};

function OrderPill({ status }: { status?: string }) {
  const tone = status ? statusMeta(status).tone : "neutral";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${TONE_CLS[tone]}`}
    >
      {status ?? "?"}
    </span>
  );
}

const itemsSummary = (items?: AdminOrderLine[]): string => {
  if (!items || items.length === 0) return "—";
  const first = `${items[0].title ?? items[0].productSlug ?? "?"} ×${items[0].qty ?? 1}`;
  return items.length > 1 ? `${first} +${items.length - 1}` : first;
};

export default function AdminOrdersPage() {
  const [filter, setFilter] = useState<string>("");
  const [page, setPage] = useState(0);
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<AdminOrder | null>(null);

  const load = useCallback(async () => {
    setOrders(null);
    setError("");
    const qs = filter ? `?status=${filter}` : `?page=${page}`;
    const res = await adminGet<AdminOrder[]>(`/orders${qs}`);
    if (res.ok) setOrders(res.data ?? []);
    else setError(res.message);
  }, [filter, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyUpdate(updated: AdminOrder) {
    setOrders((list) =>
      list
        ? list.map((o) => (o.orderNumber === updated.orderNumber ? updated : o))
        : list,
    );
    setOpen(updated);
  }

  return (
    <div>
      <PageHead title="Orders" />

      {/* status filter tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        {[["", "All"] as const, ...STATUSES.map((s) => [s, s] as const)].map(
          ([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => {
                setFilter(value);
                setPage(0);
              }}
              className={`rounded-[5px] border px-2 py-1 text-[10.5px] font-bold tracking-[0.3px] ${
                filter === value
                  ? "border-cta bg-cta text-white"
                  : "border-border bg-card text-sub hover:text-body"
              }`}
            >
              {label}
            </button>
          ),
        )}
      </div>

      {error && <Msg kind="error">{error}</Msg>}
      {!orders && !error && <Loading />}
      {orders && orders.length === 0 && (
        <Empty>No orders{filter ? ` in ${filter}` : " yet"}.</Empty>
      )}
      {orders && orders.length > 0 && (
        <Table
          headers={[
            "Order #",
            "Created",
            "Phone",
            "Items",
            "Total",
            "Status",
            "Expected",
          ]}
        >
          {orders.map((o) => (
            <tr
              key={o.orderNumber}
              className="cursor-pointer hover:bg-bg"
              onClick={() => setOpen(o)}
            >
              <Td className="font-mono text-[11px] font-bold">
                {o.orderNumber}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {fmtDateTime(o.createdAt)}
              </Td>
              <Td className="font-mono text-[11px]">{o.phone ?? "—"}</Td>
              <Td className="max-w-[260px]">{itemsSummary(o.items)}</Td>
              <Td className="whitespace-nowrap font-bold">
                {formatPaise(o.totalPaise ?? 0)}
              </Td>
              <Td>
                <OrderPill status={o.status} />
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {o.expectedDelivery ?? "—"}
              </Td>
            </tr>
          ))}
        </Table>
      )}

      {/* pager only applies to the unfiltered listing (API pages by 50) */}
      {!filter && orders && (page > 0 || orders.length === 50) && (
        <div className="mt-2 flex items-center gap-2">
          <Btn disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
            ← Newer
          </Btn>
          <span className="text-[11px] text-sub">page {page + 1}</span>
          <Btn
            disabled={orders.length < 50}
            onClick={() => setPage((p) => p + 1)}
          >
            Older →
          </Btn>
        </div>
      )}

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.orderNumber ?? "Order"}
      >
        {open && <OrderDetail order={open} onUpdated={applyUpdate} />}
      </Drawer>
    </div>
  );
}

/* ---------- drawer ---------- */

function OrderDetail({
  order,
  onUpdated,
}: {
  order: AdminOrder;
  onUpdated: (o: AdminOrder) => void;
}) {
  const [note, setNote] = useState("");
  const [trackingId, setTrackingId] = useState(order.trackingId ?? "");
  const [courier, setCourier] = useState(order.courier ?? "");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const allowed = NEXT[order.status ?? ""] ?? [];
  const needsTracking = allowed.includes("DISPATCHED");
  const a = order.address ?? {};

  async function transition(next: string) {
    if (busy) return;
    if (next === "DISPATCHED" && trackingId.trim() === "") {
      setError("Dispatch needs a tracking ID (courier is optional but helps).");
      return;
    }
    setBusy(next);
    setError("");
    setDone("");
    const res = await adminPost<AdminOrder>(
      `/orders/${encodeURIComponent(order.orderNumber ?? "")}/status`,
      {
        status: next,
        trackingId: next === "DISPATCHED" ? trackingId.trim() : undefined,
        courier: next === "DISPATCHED" ? courier.trim() || undefined : undefined,
        note: note.trim() || undefined,
      },
    );
    setBusy("");
    if (!res.ok) {
      setError(res.message); // includes the allowed-transitions list on 422
      return;
    }
    setNote("");
    setDone(`Moved to ${res.data.status}.`);
    onUpdated(res.data);
  }

  const money = (v?: number | null) => (v == null ? "—" : formatPaise(v));

  return (
    <div className="text-[12px] text-body">
      {error && <Msg kind="error">{error}</Msg>}
      {done && <Msg kind="ok">{done}</Msg>}

      <div className="mb-3 flex items-center gap-2">
        <OrderPill status={order.status} />
        {order.statusNote && <span className="text-sub">{order.statusNote}</span>}
      </div>

      {/* transitions */}
      <div className="mb-3 rounded-lg border border-border bg-card p-2.5">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
          Next steps
        </p>
        {allowed.length === 0 ? (
          <p className="text-sub">
            {order.status === "DELIVERED" || order.status === "REFUNDED"
              ? "Terminal state — nothing left to do."
              : "No transitions available."}
          </p>
        ) : (
          <>
            {needsTracking && (
              <div className="mb-2 grid grid-cols-2 gap-2">
                <Field label="Tracking ID">
                  <Input
                    value={trackingId}
                    onChange={setTrackingId}
                    placeholder="AWB / consignment no."
                  />
                </Field>
                <Field label="Courier">
                  <Input
                    value={courier}
                    onChange={setCourier}
                    placeholder="Delhivery, Bluedart…"
                  />
                </Field>
              </div>
            )}
            <Field
              label="Note (optional)"
              hint="Shown to the buyer as the plain-words status line."
            >
              <Input
                value={note}
                onChange={setNote}
                placeholder="e.g. Packed with extra roli as requested"
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allowed.map((next) => (
                <Btn
                  key={next}
                  kind={
                    next === "CANCELLED"
                      ? "danger"
                      : next === "DISPATCHED" || next === "PACKING"
                        ? "primary"
                        : "default"
                  }
                  disabled={busy !== ""}
                  onClick={() => void transition(next)}
                >
                  {busy === next ? "…" : (ACTION_LABEL[next] ?? next)}
                </Btn>
              ))}
            </div>
          </>
        )}
      </div>

      {/* order facts */}
      <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {(
          [
            ["Created", fmtDateTime(order.createdAt)],
            ["Updated", fmtDateTime(order.updatedAt)],
            ["Phone", order.phone ?? "—"],
            ["User", order.userId ?? "guest (unclaimed)"],
            ["Payment", `${order.paymentMethod ?? "—"} · ${order.paymentProvider ?? "—"}`],
            ["Payment ref", order.paymentRef ?? "—"],
            ["Expected delivery", order.expectedDelivery ?? "—"],
            ["Festival date", order.festivalDate ?? "—"],
            ["Cancellable until", fmtDateTime(order.cancellableUntil ?? undefined)],
            ["Dispatched at", fmtDateTime(order.dispatchedAt ?? undefined)],
            ["Tracking", order.trackingId ? `${order.trackingId} (${order.courier ?? "?"})` : "—"],
            ["Refund", money(order.refundPaise)],
          ] as const
        ).map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
              {label}
            </dt>
            <dd className="break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {/* items */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
        Items
      </p>
      <table className="mb-3 w-full border-collapse">
        <tbody>
          {(order.items ?? []).map((line, i) => (
            <tr key={`${line.productSlug}-${i}`} className="border-b border-border-light">
              <td className="py-1 pr-2">
                {line.title ?? line.productSlug}
                {line.festivalDate && (
                  <span className="text-sub"> · for {line.festivalDate}</span>
                )}
              </td>
              <td className="py-1 pr-2 text-right text-sub">×{line.qty ?? 1}</td>
              <td className="py-1 text-right font-bold">
                {money((line.unitPricePaise ?? 0) * (line.qty ?? 1))}
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-1 pr-2 text-sub">Subtotal</td>
            <td />
            <td className="py-1 text-right">{money(order.subtotalPaise)}</td>
          </tr>
          <tr>
            <td className="py-1 pr-2 text-sub">Delivery</td>
            <td />
            <td className="py-1 text-right">{money(order.deliveryPaise)}</td>
          </tr>
          <tr>
            <td className="py-1 pr-2 font-bold">Total</td>
            <td />
            <td className="py-1 text-right font-bold">{money(order.totalPaise)}</td>
          </tr>
        </tbody>
      </table>

      {/* address */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
        Address
      </p>
      <p className="rounded-lg border border-border bg-card p-2.5 leading-relaxed">
        {a.name ?? "—"} · {a.phone ?? "—"}
        <br />
        {a.line1 ?? ""}
        {a.line2 ? `, ${a.line2}` : ""}
        <br />
        {a.city ?? ""}, {a.state ?? ""} — {a.pincode ?? ""}
      </p>
    </div>
  );
}
