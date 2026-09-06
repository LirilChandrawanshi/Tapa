# Tapa — Launch Checklist

Engineering for all five PRD phases is complete. Every item below is a
business/ops input, not code. The site runs fully gated until the flags flip.

## Decisions needed (Komal)
- [ ] **Naming**: "Ritual Pujans" (newest Aug-30 spec) vs "Ritual Kits" (PRD) — site currently uses Ritual Pujans.
- [ ] **Pricing sign-off**: puja variants (Rudrabhishek ₹7,100/₹14,000, Satyanarayan ₹7,100/₹12,000, Mandali ₹8,000, Ghatsthapna ₹9,500), kit SKUs, mandali starting prices (only Sundarkand ₹4,500 is from the spec).
- [ ] **WhatsApp model**: confirm the free Tapa Circle v2 spec supersedes the PRD's ₹499/yr subscription (built to v2).
- [ ] **Mandali model**: request-based ("Check availability", quote within 24h) per the newest prototype — confirm vs instant-confirm.
- [ ] **COD**: currently absent per spec; confirm before any change.

## Accounts & keys (ops)
- [ ] **Razorpay** keys → implement `razorpayPaymentProvider` bean (mock provider steps aside automatically).
- [ ] **SMS provider** (MSG91/Twilio/Gupshup) → `productionSmsProvider` bean; this also kills the dev OTP 000000 automatically.
- [ ] **WhatsApp BSP** (Gupshup/Interakt) + business number + Meta approval for the 3 Circle UTILITY templates (en + hi_IN) → `productionWhatsAppProvider` bean; replace the placeholder number in `frontend/lib/staticExtras.ts`.
- [ ] **Mixpanel + GA4** IDs → add their scripts; `lib/analytics.ts` fan-out is already wired.
- [ ] **Grievance Officer** name + email → replace placeholders in Footer + /policies/grievance-redressal (legally required before commerce goes public).
- [ ] **Legal review** of the five policy drafts under /policies.

## Content (editorial team, via /admin)
- [ ] Panchang: real daily data entry + verify (seeded days are provisional samples). Verified observances gate Circle reminders.
- [ ] Articles: 8 published; Beginner's Guides, Sanskar, Materials, Mantras, Dharma-vs-Pratha categories are empty.
- [ ] Kit SKUs: 3 seeded of the planned 14; real photos needed (none exist).
- [ ] Audio files (EN/हिं per article) + hero images + WA 800×418 variants.
- [ ] Purohit roster: 4 seed pandits are samples — replace via /admin/purohits.

## Deploy
- [ ] Choose host; `docker-compose.yml`, Dockerfiles and GitHub Actions CI are ready.
- [ ] Create the GitHub remote and push (31 local commits).
- [ ] MongoDB Atlas (set MONGODB_URI), domain + TLS, set TAPA_JWT_SECRET,
      TAPA_CORS_ORIGINS, REVALIDATE_TOKEN, tapa.circle.webhook-token, SITE_URL.

## Launch sequence (each takes effect in ~3s, no deploy)
1. Content + integrations above done → smoke the e2e checklist (docs/e2e-checklist.md).
2. Flip `kits_launched` in /admin/flags.
3. Later: `purohit_tab_visible`, then `mandali_visible`.
