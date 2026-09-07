"use client";

/**
 * /account/addresses — the address book (#158). Every address shows live
 * serviceability ("We deliver here · ~3 days" or held for later with a
 * notify-me capture). Add / edit / remove / set default. Fear-free: an
 * unserved pincode is never an error — the address is simply saved for
 * when that pincode opens.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { OtpBottomSheet } from "@/components/auth/OtpBottomSheet";
import { getMe, type Me } from "@/lib/auth";
import { submitNotifyMe } from "@/lib/shop";
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressInput,
  type SavedAddress,
} from "@/lib/orders";

const EMPTY_FORM: AddressInput = {
  name: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
};

const FIELDS: {
  key: keyof Omit<AddressInput, "isDefault">;
  label: string;
  numeric?: boolean;
  maxLength?: number;
  wide?: boolean;
}[] = [
  { key: "name", label: "Name" },
  { key: "phone", label: "Mobile number", numeric: true, maxLength: 10 },
  { key: "line1", label: "House, Flat, Building", wide: true },
  { key: "line2", label: "Area, Colony, Street", wide: true },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "pincode", label: "Pincode", numeric: true, maxLength: 6 },
];

const inputCls =
  "w-full rounded-[9px] border border-border bg-bg px-[13px] py-[10px] text-[13.5px] text-ink outline-none focus:border-cta";

export default function AddressBookPage() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Me | null>(null);
  const [gateOpen, setGateOpen] = useState(false);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loadError, setLoadError] = useState("");

  // form state: null = closed, "" = adding, id = editing
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressInput>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [notified, setNotified] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const meRes = await getMe();
    if (!meRes.ok) {
      setMe(null);
      setLoading(false);
      return;
    }
    setMe(meRes.data);
    const res = await getAddresses();
    if (res.ok) {
      setAddresses(res.data ?? []);
      setLoadError("");
    } else {
      setLoadError(res.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setFormError("");
    setEditingId("");
  };

  const openEdit = (a: SavedAddress) => {
    setForm({
      name: a.name,
      phone: (a.phone ?? "").replace(/^\+91/, ""),
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      pincode: a.pincode,
    });
    setFormError("");
    setEditingId(a.id);
  };

  const submitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || editingId === null) return;
    setBusy(true);
    setFormError("");
    const res =
      editingId === ""
        ? await createAddress(form)
        : await updateAddress(editingId, form);
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      void load();
    } else {
      setFormError(res.message);
    }
  };

  const remove = async (a: SavedAddress) => {
    const res = await deleteAddress(a.id);
    if (res.ok) void load();
  };

  const makeDefault = async (a: SavedAddress) => {
    const res = await setDefaultAddress(a.id);
    if (res.ok) void load();
  };

  const tellMeWhen = async (a: SavedAddress) => {
    if (!me) return;
    await submitNotifyMe(me.phone);
    setNotified((prev) => new Set(prev).add(a.id));
  };

  if (loading) {
    return (
      <main className="mx-auto w-full max-w-[680px] px-4 py-10">
        <div className="h-[220px] animate-pulse rounded-2xl border border-border bg-card" />
      </main>
    );
  }

  /* ---------- signed out ---------- */
  if (!me) {
    return (
      <main className="mx-auto flex min-h-[60vh] w-full max-w-[440px] items-center px-4 py-10">
        <div className="w-full rounded-2xl border border-border bg-card p-7 text-center shadow-sm">
          <h1 className="text-[20px] font-bold text-ink">Your addresses</h1>
          <p className="mt-2 text-[13.5px] leading-relaxed text-sub">
            Sign in with your WhatsApp number to keep delivery addresses
            ready for one-tap checkout.
          </p>
          <button
            type="button"
            onClick={() => setGateOpen(true)}
            className="mt-5 w-full rounded-lg bg-cta py-3 text-[14px] font-bold text-white hover:opacity-90"
          >
            Sign in
          </button>
        </div>
        <OtpBottomSheet
          open={gateOpen}
          context="signin"
          onClose={() => setGateOpen(false)}
          onSuccess={() => {
            setGateOpen(false);
            setLoading(true);
            void load();
          }}
        />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[680px] px-4 py-8">
      <nav className="mb-1 text-[12px] text-sub">
        <Link href="/account" className="hover:text-cta">
          Account
        </Link>{" "}
        <span aria-hidden>›</span> Addresses
      </nav>
      <h1 className="text-[20px] font-bold text-ink">Your addresses</h1>
      <p className="mt-1 text-[13px] text-sub">
        Saved once, filled at checkout every time.
      </p>

      {loadError && (
        <p className="mt-4 rounded-2xl border border-border bg-card px-5 py-4 text-[13px] text-body">
          {loadError}
        </p>
      )}

      {addresses.length === 0 && !loadError && editingId === null && (
        <div className="mt-5 rounded-2xl border border-border bg-card px-5 py-8 text-center">
          <p className="text-[13.5px] text-body">No addresses saved yet.</p>
          <p className="mt-1 text-[12.5px] text-sub">
            Add one now, or tick “save this address” at checkout.
          </p>
        </div>
      )}

      <ul className="mt-5 space-y-3">
        {addresses.map((a) => (
          <li
            key={a.id}
            className="rounded-2xl border border-border bg-card px-4 py-4"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[13.5px] font-bold text-ink">
                  {a.name}
                  {a.isDefault && (
                    <span className="ml-2 rounded-[5px] border border-border bg-bg px-[6px] py-[1px] text-[9.5px] font-bold tracking-[0.4px] text-sub">
                      DEFAULT
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-sub">
                  {a.line1}
                  {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} —{" "}
                  {a.pincode}
                  {a.phone ? ` · ${a.phone}` : ""}
                </p>
              </div>
            </div>

            {a.serviceable ? (
              <p className="mt-2 text-[12px] font-semibold text-dharma-fg">
                ✓ We deliver here · ~{a.etaDays ?? 3} days
              </p>
            ) : (
              <div className="mt-2">
                <p className="text-[11px] font-bold tracking-[0.6px] text-pratha-fg">
                  NOT ON THE LIST — saved for when this pincode opens
                </p>
                {notified.has(a.id) ? (
                  <p className="mt-1 text-[12px] font-semibold text-dharma-fg">
                    ✓ We&apos;ll message you the moment {a.pincode} opens.
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={() => void tellMeWhen(a)}
                    className="mt-1 text-[12.5px] font-bold text-cta"
                  >
                    Tell me when ›
                  </button>
                )}
              </div>
            )}

            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-border-light pt-3 text-[12.5px] font-bold">
              <button
                type="button"
                onClick={() => openEdit(a)}
                className="text-cta hover:underline"
              >
                Edit
              </button>
              {!a.isDefault && (
                <button
                  type="button"
                  onClick={() => void makeDefault(a)}
                  className="text-cta hover:underline"
                >
                  Make default
                </button>
              )}
              <button
                type="button"
                onClick={() => void remove(a)}
                className="text-sub hover:text-cta"
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* add / edit form */}
      {editingId !== null ? (
        <form
          onSubmit={submitForm}
          className="mt-5 rounded-2xl border border-border bg-card px-4 py-4"
        >
          <h2 className="mb-3 text-[14px] font-bold text-ink">
            {editingId === "" ? "Add an address" : "Edit this address"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label
                key={f.key}
                className={`block ${f.wide ? "sm:col-span-2" : ""}`}
              >
                <span className="mb-1 block text-[10.5px] font-bold tracking-[0.6px] text-sub uppercase">
                  {f.label}
                </span>
                <input
                  type="text"
                  inputMode={f.numeric ? "numeric" : undefined}
                  maxLength={f.maxLength}
                  value={form[f.key] ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]: f.numeric
                        ? e.target.value.replace(/\D/g, "")
                        : e.target.value,
                    }))
                  }
                  className={inputCls}
                />
              </label>
            ))}
          </div>
          {formError && (
            <p className="mt-3 rounded-[10px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[12.5px] text-pratha-fg">
              {formError}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-[10px] bg-cta px-5 py-[10px] text-[13px] font-bold text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Saving…" : "Save address"}
            </button>
            <button
              type="button"
              onClick={() => setEditingId(null)}
              className="rounded-[10px] border border-border bg-bg px-5 py-[10px] text-[13px] font-bold text-body"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={openAdd}
          className="mt-5 w-full rounded-2xl border border-dashed border-border bg-card px-4 py-4 text-[13.5px] font-bold text-cta hover:border-cta/60"
        >
          + Add an address
        </button>
      )}
    </main>
  );
}
