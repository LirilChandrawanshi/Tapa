# Tapa Phase 1 — manual E2E checklist

Run before each release. Setup: `make db`, seed once (`make seed`), then
`make backend` + `make frontend`; open http://localhost:3000.

## Knowledge
- [ ] Home renders all sections in the locked order (hero → trust → panchang →
      kits teaser → stepper → guides rail → purohit strip → WA nudge → category tiles).
- [ ] Panchang fold shows today's tithi/paksha/nakshatra/sunrise; kill the backend
      and reload — cells show "being verified", never blank.
- [ ] Open the Sawan Somwar article: source-of-truth card, per-step DHARMA/PRATHA
      pills, japa counter counts and persists across reload (sessionStorage),
      samagri checkboxes persist, myths render pink question/green answer,
      intelligence layer expands, JSON-LD present in page source.
- [ ] EN/हिं toggle swaps the title/deck and persists for the session.
- [ ] /panchang dashboard, vrat calendar chips filter, festival calendar groups by
      season; observance detail cross-links "read the guide".

## Search
- [ ] "ekadashi" → glossary definition card first, then guides, then dates.
- [ ] "ekadasi" (typo) and "karwa chouth" still resolve.
- [ ] Gibberish query → empty state with did-you-mean/popular chips; the query
      appears in /admin/search zero-result report.

## Auth & account
- [ ] Save on an article while signed out opens the OTP bottom sheet; the code
      prints in the backend console; wrong code shows a calm error; resend is
      blocked for 28s.
- [ ] New number asks name + city; /account shows stat tiles and the saved
      ritual sorted by upcoming date; remove works; logout works.

## Ritual card
- [ ] `playwright install chromium` once, then GET /api/v1/cards/sawan-somwar-vrat.pdf
      returns the A5 card with panchang strip, ≤8 steps (last rose), QR footer.
- [ ] Edit the linked panchang day in /admin/panchang → card regenerates
      (hash changes, new generatedAt).

## Admin
- [ ] Sign in with the dev admin phone → /admin loads; non-admin phone is refused.
- [ ] Create a draft article with PRATHA score 4 → publish blocked with a clear
      DPB error; fix to score 2 + scope → publishes; page appears on the site.
- [ ] Flip `kits_launched` in /admin/flags → homepage kits shelf and nav tab
      switch without a deploy (60s cache at most).

## Circle & forms
- [ ] /tapa-circle join opens wa.me with prefilled JOIN; no price anywhere.
- [ ] WhatsApp nudge disappears after 3 impressions (localStorage) and after
      joining.
- [ ] Report-a-correction and all three work-with-us forms validate + submit;
      entries appear in the admin inboxes.

## Phase 2 — Commerce
- [ ] /ritual-pujans PLP shows 3 availability states (PRE-BOOK w/ order-by date,
      IN STOCK, OPENS SOON w/ notify capture).
- [ ] PDP pincode check: 110024 → "delivers in ~3 days"; 560001 → not serviceable.
- [ ] Add diyas ×2 to cart → free delivery kicks in at ₹999 (₹1,502 total, ₹0 delivery);
      single diya set shows ₹49 delivery + "add ₹248 more" hint.
- [ ] Checkout with no COD option anywhere; 422 errors render fear-free inline.
- [ ] Mock payment confirm → order confirmed page (TK- number, expected date,
      what-happens-next); order lands in /account/orders after claim.
- [ ] Guest tracking: order number + phone; wrong phone = not found; cancel inside
      the window → "full refund initiated".
- [ ] Admin /admin/orders: CONFIRMED → PACKING → DISPATCHED (tracking id) → DELIVERED;
      illegal jumps rejected with the allowed list.
- [ ] Pre-book past order-by date is rejected at checkout.

## Phase 2 — Tapa Circle
- [ ] /tapa-circle join → wa.me deep link; status polls PENDING.
- [ ] Webhook JOIN (with X-Webhook-Token) → ACTIVE, T1 in provider log within 5s.
- [ ] STOP (or रोकें) → T3 + STOPPED, no further sends; DELETE → purged in 7 days.
- [ ] Wrong webhook token → 401.
- [ ] T2 fires only for verified observances, evening before, once per member
      per occasion; nothing on quiet days.
- [ ] /admin/circle dashboard shows members by status + failed-flagged sends.

## Phase 2 — Launch gate
- [ ] Flip kits_launched in /admin/flags → nav tab goes live, home shelf switches,
      kits appear (last) in search; flip back off reverts all three.
- [ ] Policy pages render; Grievance Officer named (replace placeholder!) before
      commerce goes public.

## Phase 5 — Bhajan Mandali
- [ ] Flag off → /bhajan-mandali shows "opens soon"; request API 422s.
- [ ] Flag on → 6 types listed; request form → TM- number, "confirm within 24 hours".
- [ ] Admin confirm requires a quoted price; track shows the quote; decline is gentle.
- [ ] Requester cancel while REQUESTED/CONFIRMED; wrong phone can't see the request.

## Automated
- [ ] `cd frontend && npm run build && npm run test:e2e` — 27/27 (backend must be up).
- [ ] `cd backend && mvn test` — 55/55.
- [ ] GET /api/v1/panchang/calendar.pdf and /api/v1/cards/sawan-somwar-vrat.pdf render.
