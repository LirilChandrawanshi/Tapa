# Tapa dev workflow.
# No Docker on this machine? `make db` runs a local mongod against .data/mongo.

.PHONY: up down restart status logs logs-backend logs-frontend logs-mongo dev db backend frontend seed test build

# ── the whole stack, one handle ────────────────────────────────────────────
# mongod + backend + frontend, detached. `make logs` to watch them.
up:
	@scripts/dev.sh up

down:
	@scripts/dev.sh down

restart:
	@scripts/dev.sh restart

status:
	@scripts/dev.sh status

# `make logs` for backend+frontend together, or one of the two by name.
logs:
	@scripts/dev.sh logs all

logs-backend:
	@scripts/dev.sh logs backend

logs-frontend:
	@scripts/dev.sh logs frontend

logs-mongo:
	@scripts/dev.sh logs mongo

# ── one service at a time, in the foreground ───────────────────────────────

db:
	@nc -z localhost 27017 >/dev/null 2>&1 && echo "mongod already running on 27017" || \
		(mkdir -p .data/mongo && mongod --dbpath .data/mongo --port 27017 --nounixsocket --fork --logpath .data/mongo/mongod.log)

backend:
	cd backend && mvn spring-boot:run

frontend:
	cd frontend && npm run dev

seed:
	cd backend && mvn spring-boot:run -Dspring-boot.run.arguments=--seed

# Verification builds go to .next-build so they cannot clobber a running
# dev server's .next. A real deploy leaves NEXT_DIST_DIR unset.
test:
	cd backend && mvn verify
	cd frontend && npm run typecheck && NEXT_DIST_DIR=.next-build npm run build

build:
	cd backend && mvn -q package -DskipTests
	cd frontend && NEXT_DIST_DIR=.next-build npm run build

dev:
	@echo "make up        — start mongod + backend + frontend (detached)"
	@echo "make down      — stop all three"
	@echo "make restart   — down, then up"
	@echo "make status    — what is listening on 27017 / 8080 / 3000"
	@echo "make logs      — tail backend + frontend (or make logs-frontend)"
	@echo ""
	@echo "Foreground, one per terminal: make db | make backend | make frontend"
