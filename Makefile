# Tapa dev workflow.
# No Docker on this machine? `make db` runs a local mongod against .data/mongo.

.PHONY: dev db backend frontend seed test build

db:
	@nc -z localhost 27017 >/dev/null 2>&1 && echo "mongod already running on 27017" || \
		(mkdir -p .data/mongo && mongod --dbpath .data/mongo --port 27017 --nounixsocket --fork --logpath .data/mongo/mongod.log)

backend:
	cd backend && mvn spring-boot:run

frontend:
	cd frontend && npm run dev

seed:
	cd backend && mvn spring-boot:run -Dspring-boot.run.arguments=--seed

test:
	cd backend && mvn verify
	cd frontend && npm run typecheck && npm run build

build:
	cd backend && mvn -q package -DskipTests
	cd frontend && npm run build

dev:
	@echo "Run in three terminals: make db | make backend | make frontend"
