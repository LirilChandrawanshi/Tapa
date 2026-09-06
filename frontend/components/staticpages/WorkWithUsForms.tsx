"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import {
  isValidEmail,
  isValidIndianMobile,
  submitApplication,
  type ApplicationType,
} from "@/lib/staticExtras";

type Panel = ApplicationType | null;
type SendState = "editing" | "sending" | "sent" | "failed";

const CARDS: {
  type: ApplicationType;
  title: string;
  body: string;
  cta: string;
}[] = [
  {
    type: "team",
    title: "Join the Team",
    body: "We are small, in Delhi-NCR, and building something that has to be right before it is big. Editorial, operations, design and engineering. If the standard on this page appeals to you more than the pace does, we would like to hear from you.",
    cta: "Apply ›",
  },
  {
    type: "purohit",
    title: "Purohit Network",
    body: "For purohits and acharyas across Delhi-NCR who want to perform pujas in full, explain what they are doing, and be paid properly for it. The form is in Hindi.",
    cta: "Apply ›",
  },
  {
    type: "retailer",
    title: "For Retailers",
    body: "For temple shops, samagri retailers, RWAs and institutions who want to stock Tapa kits. Wholesale terms and the current catalogue on request.",
    cta: "Enquire ›",
  },
];

/* ── shared form primitives ────────────────────────────────────────── */

const labelCls =
  "mb-[6px] block text-[10.5px] font-bold tracking-[0.7px] text-mid uppercase";
const errCls = "mt-[5px] block text-[11.5px] leading-relaxed text-cta";
const inputCls = (bad: boolean) =>
  `w-full rounded-[10px] border bg-bg px-3 py-[10px] text-[13.5px] text-ink outline-none placeholder:text-sub focus:border-cta ${
    bad ? "border-cta" : "border-border"
  }`;

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelCls}>
        {label}
      </label>
      {children}
      {error && <span className={errCls}>{error}</span>}
    </div>
  );
}

function SubmitRow({
  state,
  label,
  sendingLabel,
  failedCopy,
  onCancel,
  cancelLabel,
}: {
  state: SendState;
  label: string;
  sendingLabel: string;
  failedCopy: string;
  onCancel: () => void;
  cancelLabel: string;
}) {
  return (
    <div>
      {state === "failed" && (
        <p className="mb-3 rounded-[10px] border border-pratha-bd bg-pratha-bg px-4 py-3 text-[12.5px] leading-relaxed text-pratha-fg">
          {failedCopy}
        </p>
      )}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={state === "sending"}
          className="rounded-[11px] bg-cta px-[22px] py-[11px] text-[12.5px] font-bold text-white disabled:opacity-50"
        >
          {state === "sending" ? sendingLabel : label}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[11px] border border-border px-[18px] py-[11px] text-[12.5px] font-bold text-sub"
        >
          {cancelLabel}
        </button>
      </div>
    </div>
  );
}

function Done({
  heading,
  body,
  onClose,
  closeLabel,
  hindi,
}: {
  heading: string;
  body: string;
  onClose: () => void;
  closeLabel: string;
  hindi?: boolean;
}) {
  return (
    <div className={hindi ? "font-devanagari" : undefined}>
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-dharma-bg text-xl text-dharma-fg">
        ✓
      </div>
      <h3 className="mb-2 text-[18px] font-bold text-ink">{heading}</h3>
      <p className="mb-4 max-w-[520px] text-[13px] leading-[1.8] text-sub">
        {body}
      </p>
      <button
        onClick={onClose}
        className="rounded-[11px] border border-border px-[18px] py-[10px] text-[12.5px] font-bold text-sub"
      >
        {closeLabel}
      </button>
    </div>
  );
}

/* ── the page body ─────────────────────────────────────────────────── */

export function WorkWithUsForms() {
  const [open, setOpen] = useState<Panel>(null);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-3">
        {CARDS.map((card) => (
          <div
            key={card.type}
            className={`flex flex-col rounded-[15px] border bg-card px-5 py-5 ${
              open === card.type ? "border-cta" : "border-border"
            }`}
          >
            <p className="mb-2 text-[15.5px] font-bold text-ink">
              {card.title}
            </p>
            <p className="mb-4 flex-1 text-[12.5px] leading-relaxed text-sub">
              {card.body}
            </p>
            <button
              onClick={() => setOpen(open === card.type ? null : card.type)}
              className={`self-start rounded-[10px] px-[18px] py-[9px] text-[12.5px] font-bold ${
                open === card.type
                  ? "bg-cta text-white"
                  : "border border-cta text-cta"
              }`}
            >
              {open === card.type ? "Close ✕" : card.cta}
            </button>
          </div>
        ))}
      </div>

      {open && (
        <div className="mt-5 rounded-[18px] border border-border bg-card px-5 py-6 md:px-[30px]">
          {open === "team" && <TeamForm onClose={() => setOpen(null)} />}
          {open === "purohit" && <PurohitForm onClose={() => setOpen(null)} />}
          {open === "retailer" && (
            <RetailerForm onClose={() => setOpen(null)} />
          )}
        </div>
      )}
    </div>
  );
}

/* ── team ──────────────────────────────────────────────────────────── */

const TEAM_AREAS = [
  "Editorial",
  "Operations",
  "Design",
  "Engineering",
  "Something else",
];

function TeamForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({
    name: "",
    email: "",
    phone: "",
    area: "",
    city: "",
    portfolioUrl: "",
    consent: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SendState>("editing");

  const set = (key: keyof typeof f, value: string | boolean) => {
    setF((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = "Please enter your name.";
    if (!isValidEmail(f.email.trim()))
      errs.email = "That does not look like an email address.";
    if (!isValidIndianMobile(f.phone.trim()))
      errs.phone = "A 10-digit mobile number, digits only.";
    if (!f.area) errs.area = "Choose an area — 'Something else' counts.";
    if (f.city.trim().length < 2) errs.city = "Which city are you in?";
    if (f.portfolioUrl.trim() && !/^https?:\/\/\S+$/.test(f.portfolioUrl.trim()))
      errs.portfolioUrl = "A full link, starting https:// — or leave it blank.";
    if (!f.consent)
      errs.consent = "Please tick this to continue — it is the only way we may keep your details.";
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setState("sending");
    const ok = await submitApplication("team", {
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      area: f.area,
      city: f.city.trim(),
      portfolioUrl: f.portfolioUrl.trim(),
      consent: f.consent,
    });
    setState(ok ? "sent" : "failed");
  };

  if (state === "sent") {
    return (
      <Done
        heading="Thank you — it's with us."
        body="We read every application ourselves. If there's a fit, you'll hear from someone on the team within two weeks. If you don't hear back, it isn't a comment on your work — we are a small team and the roles are few."
        onClose={onClose}
        closeLabel="Close"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
        Join the team
      </p>
      <h3 className="mb-5 text-[19px] font-bold text-ink">
        Tell us about yourself
      </h3>
      <div className="flex flex-col gap-4">
        <Field id="t-name" label={<>Full name <i className="text-cta">*</i></>} error={errors.name}>
          <input
            id="t-name"
            type="text"
            autoComplete="name"
            maxLength={80}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="t-email" label={<>Email <i className="text-cta">*</i></>} error={errors.email}>
            <input
              id="t-email"
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls(!!errors.email)}
            />
          </Field>
          <Field id="t-phone" label={<>Phone <i className="text-cta">*</i></>} error={errors.phone}>
            <input
              id="t-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              value={f.phone}
              onChange={(e) =>
                set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={inputCls(!!errors.phone)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="t-area" label={<>Area of work <i className="text-cta">*</i></>} error={errors.area}>
            <select
              id="t-area"
              value={f.area}
              onChange={(e) => set("area", e.target.value)}
              className={inputCls(!!errors.area)}
            >
              <option value="">Select one</option>
              {TEAM_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Field>
          <Field id="t-city" label={<>Current city <i className="text-cta">*</i></>} error={errors.city}>
            <input
              id="t-city"
              type="text"
              maxLength={60}
              value={f.city}
              onChange={(e) => set("city", e.target.value)}
              className={inputCls(!!errors.city)}
            />
          </Field>
        </div>
        <Field
          id="t-link"
          label="Portfolio or LinkedIn"
          error={errors.portfolioUrl}
        >
          <input
            id="t-link"
            type="url"
            placeholder="https://"
            value={f.portfolioUrl}
            onChange={(e) => set("portfolioUrl", e.target.value)}
            className={inputCls(!!errors.portfolioUrl)}
          />
        </Field>
        <p className="rounded-[10px] bg-bg px-4 py-3 text-[12px] leading-relaxed text-sub">
          No CV upload here yet — after you apply, email your CV to{" "}
          <a
            href="mailto:careers@thetapaco.com"
            className="font-bold text-cta"
          >
            careers@thetapaco.com
          </a>{" "}
          with your name in the subject line, and we will pair the two up.
        </p>
        <div>
          <label className="flex items-start gap-[10px] text-[12.5px] leading-relaxed text-body">
            <input
              type="checkbox"
              checked={f.consent}
              onChange={(e) => set("consent", e.target.checked)}
              className="mt-[3px] size-4 accent-cta"
            />
            <span>
              I&rsquo;m happy for Tapa to keep my details on file for this and
              future roles.
            </span>
          </label>
          {errors.consent && <span className={errCls}>{errors.consent}</span>}
        </div>
        <SubmitRow
          state={state}
          label="Send application ›"
          sendingLabel="Sending…"
          failedCopy="We could not send that just now — nothing you wrote is lost. Give it a moment and try again."
          onCancel={onClose}
          cancelLabel="Cancel"
        />
      </div>
    </form>
  );
}

/* ── purohit (Hindi) ───────────────────────────────────────────────── */

const PUROHIT_YEARS = [
  "5 साल से कम",
  "5 से 10 साल",
  "10 से 20 साल",
  "20 साल से ज़्यादा",
];
const PUROHIT_LANGS = [
  "हिंदी",
  "संस्कृत",
  "अंग्रेज़ी",
  "पंजाबी",
  "बंगाली",
  "अन्य",
];
const PUROHIT_WEEKEND = ["हाँ", "नहीं", "देखकर बता सकते हैं"];

function PurohitForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({
    name: "",
    phone: "",
    email: "",
    serviceAreas: "",
    experienceYears: "",
    tradition: "",
    languages: [] as string[],
    weekendAvailability: "",
    pledge: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SendState>("editing");

  const set = (key: keyof typeof f, value: string | boolean | string[]) => {
    setF((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const toggleLang = (lang: string) => {
    set(
      "languages",
      f.languages.includes(lang)
        ? f.languages.filter((l) => l !== lang)
        : [...f.languages, lang],
    );
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.name.trim().length < 2) errs.name = "कृपया अपना नाम लिखें।";
    if (!isValidIndianMobile(f.phone.trim()))
      errs.phone = "10 अंकों का मोबाइल नंबर लिखें।";
    if (f.email.trim() && !isValidEmail(f.email.trim()))
      errs.email = "ईमेल सही नहीं लग रहा — या खाली छोड़ दें, ज़रूरी नहीं है।";
    if (f.serviceAreas.trim().length < 2)
      errs.serviceAreas = "इलाकों के नाम लिखें।";
    if (!f.experienceYears) errs.experienceYears = "एक विकल्प चुनें।";
    if (f.languages.length === 0)
      errs.languages = "कम से कम एक भाषा चुनें।";
    if (!f.weekendAvailability) errs.weekendAvailability = "एक विकल्प चुनें।";
    if (!f.pledge) errs.pledge = "आगे बढ़ने के लिए यह ज़रूरी है।";
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setState("sending");
    const ok = await submitApplication("purohit", {
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      serviceAreas: f.serviceAreas.trim(),
      experienceYears: f.experienceYears,
      tradition: f.tradition.trim(),
      languages: f.languages,
      weekendAvailability: f.weekendAvailability,
      pledge: f.pledge,
    });
    setState(ok ? "sent" : "failed");
  };

  if (state === "sent") {
    return (
      <Done
        hindi
        heading="धन्यवाद — आपकी जानकारी हमें मिल गई।"
        body="हमारी टीम सात दिन के भीतर आपसे फ़ोन पर बात करेगी। बातचीत के बाद एक बार आपसे मिलकर ही आगे की बात तय होगी।"
        onClose={onClose}
        closeLabel="बंद करें"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate lang="hi" className="font-devanagari">
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
        पुरोहित नेटवर्क
      </p>
      <h3 className="mb-5 text-[19px] font-bold text-ink">अपनी जानकारी भरें</h3>
      <div className="flex flex-col gap-4">
        <Field id="p-name" label={<>पूरा नाम <i className="text-cta">*</i></>} error={errors.name}>
          <input
            id="p-name"
            type="text"
            maxLength={80}
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            className={inputCls(!!errors.name)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="p-phone"
            label={<>फ़ोन / WhatsApp नंबर <i className="text-cta">*</i></>}
            error={errors.phone}
          >
            <input
              id="p-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={f.phone}
              onChange={(e) =>
                set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={inputCls(!!errors.phone)}
            />
          </Field>
          <Field
            id="p-email"
            label={
              <>
                ईमेल <em className="font-medium normal-case">(ज़रूरी नहीं)</em>
              </>
            }
            error={errors.email}
          >
            <input
              id="p-email"
              type="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls(!!errors.email)}
            />
          </Field>
        </div>
        <Field
          id="p-areas"
          label={<>आप किन इलाकों में जा सकते हैं? <i className="text-cta">*</i></>}
          error={errors.serviceAreas}
        >
          <input
            id="p-areas"
            type="text"
            maxLength={80}
            placeholder="जैसे — द्वारका, जनकपुरी, गुड़गांव"
            value={f.serviceAreas}
            onChange={(e) => set("serviceAreas", e.target.value)}
            className={inputCls(!!errors.serviceAreas)}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="p-years"
            label={<>कितने साल से पूजा करा रहे हैं? <i className="text-cta">*</i></>}
            error={errors.experienceYears}
          >
            <select
              id="p-years"
              value={f.experienceYears}
              onChange={(e) => set("experienceYears", e.target.value)}
              className={inputCls(!!errors.experienceYears)}
            >
              <option value="">चुनें</option>
              {PUROHIT_YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
          <Field
            id="p-guru"
            label={
              <>
                शिक्षा किससे ली / परम्परा{" "}
                <em className="font-medium normal-case">(ज़रूरी नहीं)</em>
              </>
            }
          >
            <input
              id="p-guru"
              type="text"
              maxLength={120}
              value={f.tradition}
              onChange={(e) => set("tradition", e.target.value)}
              className={inputCls(false)}
            />
          </Field>
        </div>
        <fieldset>
          <legend className={labelCls}>
            आप कौन सी भाषाएँ बोलते हैं? <i className="text-cta">*</i>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PUROHIT_LANGS.map((lang) => (
              <label
                key={lang}
                className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-[7px] text-[13px] ${
                  f.languages.includes(lang)
                    ? "border-cta bg-cta/5 font-bold text-cta"
                    : "border-border text-body"
                }`}
              >
                <input
                  type="checkbox"
                  checked={f.languages.includes(lang)}
                  onChange={() => toggleLang(lang)}
                  className="size-4 accent-cta"
                />
                {lang}
              </label>
            ))}
          </div>
          {errors.languages && (
            <span className={errCls}>{errors.languages}</span>
          )}
        </fieldset>
        <fieldset>
          <legend className={labelCls}>
            क्या आप शनिवार–रविवार उपलब्ध रहते हैं? <i className="text-cta">*</i>
          </legend>
          <div className="flex flex-wrap gap-2">
            {PUROHIT_WEEKEND.map((option) => (
              <label
                key={option}
                className={`flex cursor-pointer items-center gap-2 rounded-[10px] border px-3 py-[7px] text-[13px] ${
                  f.weekendAvailability === option
                    ? "border-cta bg-cta/5 font-bold text-cta"
                    : "border-border text-body"
                }`}
              >
                <input
                  type="radio"
                  name="weekend"
                  checked={f.weekendAvailability === option}
                  onChange={() => set("weekendAvailability", option)}
                  className="size-4 accent-cta"
                />
                {option}
              </label>
            ))}
          </div>
          {errors.weekendAvailability && (
            <span className={errCls}>{errors.weekendAvailability}</span>
          )}
        </fieldset>
        <div className="rounded-[13px] border border-gold/40 bg-pratha-bg px-4 py-4">
          <p className="mb-2 text-[12px] font-bold tracking-[0.7px] text-gold uppercase">
            वचन
          </p>
          <label className="flex items-start gap-[10px] text-[13px] leading-[1.8] text-body">
            <input
              type="checkbox"
              checked={f.pledge}
              onChange={(e) => set("pledge", e.target.checked)}
              className="mt-[4px] size-4 accent-cta"
            />
            <span>
              मैं हर पूजा पूरी विधि से कराऊँगा। पूछे जाने पर विधि समझाऊँगा। और
              किसी परिवार से यह कभी नहीं कहूँगा कि कुछ कम रह गया है, कुछ और
              ज़रूरी है, या कुछ अशुभ हो जाएगा।
            </span>
          </label>
          {errors.pledge && <span className={errCls}>{errors.pledge}</span>}
        </div>
        <SubmitRow
          state={state}
          label="जानकारी भेजें ›"
          sendingLabel="भेज रहे हैं…"
          failedCopy="अभी नहीं भेज पाए — आपकी लिखी जानकारी सुरक्षित है। थोड़ी देर में फिर से कोशिश करें।"
          onCancel={onClose}
          cancelLabel="रहने दें"
        />
      </div>
    </form>
  );
}

/* ── retailer ──────────────────────────────────────────────────────── */

function RetailerForm({ onClose }: { onClose: () => void }) {
  const [f, setF] = useState({
    businessName: "",
    contactPerson: "",
    phone: "",
    email: "",
    city: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<SendState>("editing");

  const set = (key: keyof typeof f, value: string) => {
    setF((p) => ({ ...p, [key]: value }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (f.businessName.trim().length < 2)
      errs.businessName = "Please enter the business name.";
    if (f.contactPerson.trim().length < 2)
      errs.contactPerson = "Who should we speak to?";
    if (!isValidIndianMobile(f.phone.trim()))
      errs.phone = "A 10-digit mobile number, digits only.";
    if (!isValidEmail(f.email.trim()))
      errs.email = "That does not look like an email address.";
    if (f.city.trim().length < 2) errs.city = "Which city or locality?";
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setState("sending");
    const ok = await submitApplication("retailer", {
      businessName: f.businessName.trim(),
      contactPerson: f.contactPerson.trim(),
      phone: f.phone.trim(),
      email: f.email.trim(),
      city: f.city.trim(),
    });
    setState(ok ? "sent" : "failed");
  };

  if (state === "sent") {
    return (
      <Done
        heading="Thank you — we have your enquiry."
        body="Someone from the team will call within three working days with wholesale terms, minimum order quantities and the current season's catalogue."
        onClose={onClose}
        closeLabel="Close"
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate>
      <p className="mb-1 text-[10px] font-bold tracking-[0.8px] text-cta uppercase">
        For retailers
      </p>
      <h3 className="mb-5 text-[19px] font-bold text-ink">Stock Tapa kits</h3>
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            id="r-biz"
            label={<>Business name <i className="text-cta">*</i></>}
            error={errors.businessName}
          >
            <input
              id="r-biz"
              type="text"
              maxLength={120}
              value={f.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              className={inputCls(!!errors.businessName)}
            />
          </Field>
          <Field
            id="r-person"
            label={<>Contact person <i className="text-cta">*</i></>}
            error={errors.contactPerson}
          >
            <input
              id="r-person"
              type="text"
              maxLength={80}
              autoComplete="name"
              value={f.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              className={inputCls(!!errors.contactPerson)}
            />
          </Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="r-phone" label={<>Phone <i className="text-cta">*</i></>} error={errors.phone}>
            <input
              id="r-phone"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              autoComplete="tel"
              value={f.phone}
              onChange={(e) =>
                set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              className={inputCls(!!errors.phone)}
            />
          </Field>
          <Field id="r-email" label={<>Email <i className="text-cta">*</i></>} error={errors.email}>
            <input
              id="r-email"
              type="email"
              autoComplete="email"
              value={f.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputCls(!!errors.email)}
            />
          </Field>
        </div>
        <Field
          id="r-city"
          label={<>City / locality <i className="text-cta">*</i></>}
          error={errors.city}
        >
          <input
            id="r-city"
            type="text"
            maxLength={80}
            value={f.city}
            onChange={(e) => set("city", e.target.value)}
            className={inputCls(!!errors.city)}
          />
        </Field>
        <SubmitRow
          state={state}
          label="Send enquiry ›"
          sendingLabel="Sending…"
          failedCopy="We could not send that just now — nothing you wrote is lost. Give it a moment and try again."
          onCancel={onClose}
          cancelLabel="Cancel"
        />
      </div>
    </form>
  );
}
