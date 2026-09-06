# Tapa — thetapaco.com

Knowledge-first Hindu ritual platform. Phase 1 = Knowledge layer (guides, panchang,
dharmic concepts, glossary, search, accounts, ritual-card PDFs, custom admin).

## Stack
- `backend/` — Spring Boot 3.5 (Java 21 target), Maven, MongoDB, modular monolith
  by feature under `co.thetapa.*`. Also serves as the CMS/admin API.
- `frontend/` — Next.js 15 App Router, TypeScript strict, Tailwind v4 (tokens in
  `app/globals.css` `@theme`), npm.
- Search: Typesense. PDFs: Playwright render of a Thymeleaf card template.

## Source of truth
- Build plan: `~/.claude/plans/compressed-meandering-giraffe.md`
- Spec bundle: `/Users/liril/Downloads/Tech` (PRD, HTML prototypes, WhatsApp spec).
  Newest files win: taxonomy from Aug-30 HTML, WhatsApp = free "Tapa Circle" v2,
  brand pink `#FD066D`.

## Non-negotiables (from PRD — do not change without sign-off)
- Locked color tokens; homepage 12-section order; knowledge before commerce.
- DPB classification: DHARMA needs score 3–5 + named scripture; PRATHA ≤ 2;
  BHRANTI no score. Panchang/glossary content carries no tag/score.
- Phone-OTP-only auth (+91, 6-digit, 28s resend). No email/password/social.
- Feature flags (`kits_launched`, `purohit_tab_visible`) are DB-driven, never deploys.
- Micro-copy: "Puja" never "Pooja"; ₹ always; Book (services) / Order (kits); Save + 🔖.
- Panchang served only through our API (never expose a third-party directly);
  fallback to cached values — never blank.
- Schema must survive Phase 2+ (commerce, Circle) without destructive migrations.

## Dev
- No Docker on this machine: `make db` (local mongod on .data/mongo), `make backend`,
  `make frontend`. Compose files exist for portable/prod use.
- Tests: `cd backend && mvn verify` (Testcontainers needs Docker — skip locally,
  runs in CI), `cd frontend && npm run typecheck && npm run build`.
