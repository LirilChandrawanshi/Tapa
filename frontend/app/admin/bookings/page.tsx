"use client";

/**
 * Admin · Bookings (P4-M2). Table + status filter tabs; row click opens a
 * drawer with the full booking and only the legal next transitions as
 * buttons — the backend state machine is mirrored here, its 422s inline.
 */

import { useCallback, useEffect, useState } from "react";
import { adminGet, adminPost, fmtDateTime } from "@/lib/admin";
import {
  bookingStatusMeta,
  formatPaise,
  slotFull,
  type BookingTone,
} from "@/lib/booking";
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

/* ---------- shapes (full Booking doc — admin sees phone/payment/internals) ---------- */

interface AdminBookingAddress {
  name?: string;
  phone?: string;
  line1?: string;
  line2?: string | null;
  city?: string;
  state?: string;
  pincode?: string;
}

interface AdminBooking {
  id?: string;
  bookingNumber?: string;
  phone?: string;
  userId?: string | null;
  pujaSlug?: string;
  pujaName?: string;
  variantKey?: string;
  variantName?: string;
  purohitSlug?: string;
  purohitName?: string;
  date?: string;
  slot?: string;
  slotWindow?: string;
  kitIncluded?: boolean;
  pricePaise?: number;
  address?: AdminBookingAddress | null;
  paymentMethod?: string | null;
  paymentProvider?: string | null;
  paymentRef?: string | null;
  status?: string;
  statusNote?: string | null;
  cancellableUntil?: string | null;
  cancelledAt?: string | null;
  refundPaise?: number | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const STATUSES = [
  "PENDING_PAYMENT",
  "CONFIRMED",
  "COMPLETED",
  "CANCELLED",
  "REFUND_INITIATED",
  "REFUNDED",
] as const;

/** Mirror of the backend booking state machine — the server still enforces. */
const NEXT: Record<string, string[]> = {
  PENDING_PAYMENT: ["CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
  CANCELLED: ["REFUND_INITIATED"],
  REFUND_INITIATED: ["REFUNDED"],
};

const ACTION_LABEL: Record<string, string> = {
  COMPLETED: "Mark completed",
  CANCELLED: "Cancel booking",
  REFUND_INITIATED: "Initiate refund",
  REFUNDED: "Mark refunded",
};

const TONE_CLS: Record<BookingTone, string> = {
  good: "bg-dharma-bg text-dharma-fg border-dharma-bd",
  progress: "bg-pratha-bg text-pratha-fg border-pratha-bd",
  attention: "bg-card text-cta border-cta",
  neutral: "bg-bg text-sub border-border",
};

function BookingPill({ status }: { status?: string }) {
  const tone = status ? bookingStatusMeta(status).tone : "neutral";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-[4px] border px-1.5 py-0.5 text-[10px] font-bold ${TONE_CLS[tone]}`}
    >
      {status ?? "?"}
    </span>
  );
}

const whenSummary = (b: AdminBooking): string => {
  if (!b.date) return "—";
  const slot = b.slotWindow ?? (b.slot ? slotFull(b.slot) : "");
  return slot ? `${b.date} · ${slot}` : b.date;
};

export default function AdminBookingsPage() {
  const [filter, setFilter] = useState<string>("");
  const [bookings, setBookings] = useState<AdminBooking[] | null>(null);
  const [error, setError] = useState("");
  const [open, setOpen] = useState<AdminBooking | null>(null);

  const load = useCallback(async () => {
    setBookings(null);
    setError("");
    const qs = filter ? `?status=${filter}` : "";
    const res = await adminGet<AdminBooking[]>(`/bookings${qs}`);
    if (res.ok) setBookings(res.data ?? []);
    else setError(res.message);
  }, [filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function applyUpdate(updated: AdminBooking) {
    setBookings((list) =>
      list
        ? list.map((b) =>
            b.bookingNumber === updated.bookingNumber ? updated : b,
          )
        : list,
    );
    setOpen(updated);
  }

  return (
    <div>
      <PageHead title="Bookings" />

      {/* status filter tabs */}
      <div className="mb-3 flex flex-wrap gap-1">
        {[["", "All"] as const, ...STATUSES.map((s) => [s, s] as const)].map(
          ([value, label]) => (
            <button
              key={label}
              type="button"
              onClick={() => setFilter(value)}
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
      {!bookings && !error && <Loading />}
      {bookings && bookings.length === 0 && (
        <Empty>No bookings{filter ? ` in ${filter}` : " yet"}.</Empty>
      )}
      {bookings && bookings.length > 0 && (
        <Table
          headers={[
            "Booking #",
            "Created",
            "Puja",
            "Purohit",
            "Date & slot",
            "Phone",
            "Price",
            "Status",
          ]}
        >
          {bookings.map((b) => (
            <tr
              key={b.bookingNumber}
              className="cursor-pointer hover:bg-bg"
              onClick={() => setOpen(b)}
            >
              <Td className="font-mono text-[11px] font-bold">
                {b.bookingNumber}
              </Td>
              <Td className="whitespace-nowrap text-sub">
                {fmtDateTime(b.createdAt)}
              </Td>
              <Td className="max-w-[200px]">
                {b.pujaName ?? b.pujaSlug ?? "—"}
                {b.variantName && (
                  <span className="text-sub"> · {b.variantName}</span>
                )}
              </Td>
              <Td className="max-w-[160px]">
                {b.purohitName ?? b.purohitSlug ?? "—"}
              </Td>
              <Td className="whitespace-nowrap">{whenSummary(b)}</Td>
              <Td className="font-mono text-[11px]">{b.phone ?? "—"}</Td>
              <Td className="whitespace-nowrap font-bold">
                {formatPaise(b.pricePaise ?? 0)}
              </Td>
              <Td>
                <BookingPill status={b.status} />
              </Td>
            </tr>
          ))}
        </Table>
      )}

      <Drawer
        open={open !== null}
        onClose={() => setOpen(null)}
        title={open?.bookingNumber ?? "Booking"}
      >
        {open && <BookingDetail booking={open} onUpdated={applyUpdate} />}
      </Drawer>
    </div>
  );
}

/* ---------- drawer ---------- */

function BookingDetail({
  booking,
  onUpdated,
}: {
  booking: AdminBooking;
  onUpdated: (b: AdminBooking) => void;
}) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  const allowed = NEXT[booking.status ?? ""] ?? [];
  const a = booking.address ?? {};

  async function transition(next: string) {
    if (busy) return;
    setBusy(next);
    setError("");
    setDone("");
    const res = await adminPost<AdminBooking>(
      `/bookings/${encodeURIComponent(booking.bookingNumber ?? "")}/status`,
      { status: next, note: note.trim() || undefined },
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
        <BookingPill status={booking.status} />
        {booking.statusNote && (
          <span className="text-sub">{booking.statusNote}</span>
        )}
      </div>

      {/* transitions */}
      <div className="mb-3 rounded-lg border border-border bg-card p-2.5">
        <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
          Next steps
        </p>
        {allowed.length === 0 ? (
          <p className="text-sub">
            {booking.status === "COMPLETED" || booking.status === "REFUNDED"
              ? "Terminal state — nothing left to do."
              : "No transitions available."}
          </p>
        ) : (
          <>
            <Field
              label="Note (optional)"
              hint="Shown to the devotee as the plain-words status line."
            >
              <Input
                value={note}
                onChange={setNote}
                placeholder="e.g. Purohit confirmed the sankalp details on call"
              />
            </Field>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {allowed.map((next) => (
                <Btn
                  key={next}
                  kind={
                    next === "CANCELLED"
                      ? "danger"
                      : next === "COMPLETED"
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

      {/* booking facts */}
      <dl className="mb-3 grid grid-cols-2 gap-x-3 gap-y-1.5">
        {(
          [
            ["Created", fmtDateTime(booking.createdAt)],
            ["Updated", fmtDateTime(booking.updatedAt)],
            ["Phone", booking.phone ?? "—"],
            ["User", booking.userId ?? "guest (unclaimed)"],
            [
              "Puja",
              `${booking.pujaName ?? booking.pujaSlug ?? "—"} · ${booking.variantName ?? booking.variantKey ?? "—"}`,
            ],
            ["Purohit", booking.purohitName ?? booking.purohitSlug ?? "—"],
            ["Date & slot", whenSummary(booking)],
            ["Samagri kit", booking.kitIncluded ? "included" : "not included"],
            [
              "Payment",
              `${booking.paymentMethod ?? "—"} · ${booking.paymentProvider ?? "—"}`,
            ],
            ["Payment ref", booking.paymentRef ?? "—"],
            [
              "Cancellable until",
              fmtDateTime(booking.cancellableUntil ?? undefined),
            ],
            ["Refund", money(booking.refundPaise)],
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

      <p className="mb-3 text-[13px] font-bold">
        Price: {money(booking.pricePaise)}
      </p>

      {/* address */}
      <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.8px] text-sub">
        Puja address
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
