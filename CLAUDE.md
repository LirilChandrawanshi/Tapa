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
- Whole stack, one handle: `make up` / `make down` / `make restart` / `make status` /
  `make logs` (or `make logs-frontend`). Detached; logs in `.data/dev/logs`.
- mongod here is a **root LaunchDaemon** (homebrew.mxcl.mongodb-community) on
  `/opt/homebrew/var/mongodb` — that is where the dev data lives. `make down`
  leaves it running on purpose; `scripts/dev.sh down --with-db` cycles it (sudo).
  Note `make db` starts a *different*, empty DB on `.data/mongo` — only useful on
  a machine with no homebrew mongod.
- Foreground, one service per terminal: `make backend`, `make frontend`.
  Compose files exist for portable/prod use.
- `make build` / `make test` build the frontend into `.next-build` (via
  `NEXT_DIST_DIR`), so a verification build cannot clobber a running dev server's
  `.next` — that clobber shows up as `Cannot find module './NNNN.js'`.
- Dev login: any 10-digit number + OTP `000000` (works only while ConsoleSmsProvider
  is active — dead the moment a real SMS provider bean exists). `9876543210` = admin.
- Tests: `cd backend && mvn test` (55 unit tests, no Docker needed);
  `cd frontend && npm run typecheck && npm run build`; E2E: `npm run build && npm run test:e2e`
  (27 Playwright tests, backend must be up on :8080).
- Launch gates: kits_launched / purohit_tab_visible / mandali_visible in /admin/flags —
  server-authoritative, ~3s propagation. All OFF until business sign-off.
