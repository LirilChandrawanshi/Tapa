#!/usr/bin/env bash
#
# One handle on the whole dev stack: mongod, the Spring backend, the Next
# frontend. Written because the three lived in three terminals, and a restart
# meant finding all three and hoping nothing was left holding a port.
#
#   scripts/dev.sh up | down | restart | status | logs [mongo|backend|frontend]
#
# down/restart leave mongod alone by default — see the mongo section for why.
# Pass --with-db to cycle it too.
#
# Everything runs detached; logs land in .data/dev/logs, pids in .data/dev.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RUN="$ROOT/.data/dev"
LOGS="$RUN/logs"
MONGO_DB="$ROOT/.data/mongo"

MONGO_PORT=27017
BACKEND_PORT=8080
FRONTEND_PORT=3000

mkdir -p "$RUN" "$LOGS" "$MONGO_DB"

# ── tiny helpers ───────────────────────────────────────────────────────────
bold() { printf '\033[1m%s\033[0m\n' "$*"; }
ok()   { printf '  \033[32m●\033[0m %s\n' "$*"; }
off()  { printf '  \033[90m○\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*"; }

# Whoever is listening on a port — the only reliable handle on a process that
# forks (mvn → java, npm → next-server) and outlives the pid we recorded.
port_pids() { lsof -ti "tcp:$1" -sTCP:LISTEN 2>/dev/null || true; }
port_busy() { [ -n "$(port_pids "$1")" ]; }

wait_port() { # wait_port <port> <seconds> <label>
  local port=$1 limit=$2 label=$3 waited=0
  while ! port_busy "$port"; do
    if [ "$waited" -ge "$limit" ]; then
      warn "$label did not come up on :$port in ${limit}s — see $LOGS/$label.log"
      return 1
    fi
    sleep 1
    waited=$((waited + 1))
  done
  ok "$label up on :$port (${waited}s)"
}

# TERM, give it a moment, then KILL. Takes the recorded pid and whatever still
# holds the port, because those are often not the same process.
kill_tree() { # kill_tree <label> <port> <pidfile>
  local label=$1 port=$2 pidfile=$3 pids=""
  [ -f "$pidfile" ] && pids="$(cat "$pidfile")"
  pids="$pids $(port_pids "$port")"
  pids="$(echo "$pids" | tr ' ' '\n' | grep -E '^[0-9]+$' | sort -u || true)"

  if [ -z "$pids" ]; then
    off "$label already stopped"
    rm -f "$pidfile"
    return 0
  fi

  # shellcheck disable=SC2086
  kill $pids 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    port_busy "$port" || break
    sleep 1
  done
  if port_busy "$port"; then
    # shellcheck disable=SC2086
    kill -9 $(port_pids "$port") 2>/dev/null || true
    sleep 1
  fi
  rm -f "$pidfile"
  ok "$label stopped"
}

# Detach a service completely.
#
# The obvious `( cd dir && nohup cmd >log 2>&1 & )` does not do this: `&`
# applies to the whole AND-list, so bash forks a wrapper shell to run it — and
# that wrapper inherits the caller's stdout. It outlives the script still
# holding the terminal (or the pipe `make up` was writing into), so the command
# appears to hang long after the stack is up. Redirecting the subshell itself,
# and `exec`ing inside it, leaves nothing attached.
spawn() { # spawn <dir> <log> <pidfile> <cmd...>
  local dir=$1 log=$2 pidfile=$3
  shift 3
  ( cd "$dir" && exec "$@" ) </dev/null >"$log" 2>&1 &
  echo $! >"$pidfile"
  disown %% 2>/dev/null || true
}

# ── mongo ─────────────────────────────────────────────────────────────────
# On this machine mongod is not ours to cycle: it is a root LaunchDaemon
# (/Library/LaunchDaemons/homebrew.mxcl.mongodb-community.plist) serving
# /opt/homebrew/var/mongodb, up since boot. Two consequences:
#   · lsof cannot see a root process's listening socket without sudo, so
#     liveness is a connect test, not a pid lookup;
#   · stopping it needs sudo and launchd brings it back, so `down` leaves it
#     alone unless you ask with --with-db.
MONGO_PLIST=/Library/LaunchDaemons/homebrew.mxcl.mongodb-community.plist
MONGO_SERVICE=homebrew.mxcl.mongodb-community

mongo_up() { nc -z localhost "$MONGO_PORT" >/dev/null 2>&1; }
mongo_is_launchd() { [ -f "$MONGO_PLIST" ]; }

start_mongo() {
  if mongo_up; then
    if mongo_is_launchd; then
      off "mongod already on :$MONGO_PORT (launchd, /opt/homebrew/var/mongodb)"
    else
      off "mongod already on :$MONGO_PORT"
    fi
    return 0
  fi
  if mongo_is_launchd; then
    warn "mongod is down — starting the LaunchDaemon (sudo)"
    sudo launchctl kickstart -k "system/$MONGO_SERVICE" || true
  else
    # No homebrew service on this box: our own instance, our own dbpath.
    mongod --dbpath "$MONGO_DB" --port "$MONGO_PORT" --nounixsocket \
      --fork --logpath "$LOGS/mongo.log" --pidfilepath "$RUN/mongo.pid" >/dev/null
  fi
  local waited=0
  while ! mongo_up; do
    [ "$waited" -ge 20 ] && { warn "mongod did not come up on :$MONGO_PORT"; return 1; }
    sleep 1
    waited=$((waited + 1))
  done
  ok "mongod up on :$MONGO_PORT"
}

stop_mongo() {
  if ! mongo_up; then
    off "mongod already stopped"
    rm -f "$RUN/mongo.pid"
    return 0
  fi
  if mongo_is_launchd; then
    if [ "${WITH_DB:-0}" = "1" ]; then
      warn "stopping the mongod LaunchDaemon (sudo)"
      sudo launchctl bootout "system/$MONGO_SERVICE" 2>/dev/null || true
      ok "mongod stopped"
    else
      off "mongod left running — a root LaunchDaemon shared with everything"
      printf '    \033[90mstop it with: scripts/dev.sh down --with-db\033[0m\n'
    fi
    return 0
  fi
  # Our own instance: graceful, because a hard kill means a repair next start.
  mongod --dbpath "$MONGO_DB" --shutdown >/dev/null 2>&1 || true
  for _ in 1 2 3 4 5; do mongo_up || break; sleep 1; done
  rm -f "$RUN/mongo.pid"
  ok "mongod stopped"
}

# ── backend ────────────────────────────────────────────────────────────────
start_backend() {
  if port_busy "$BACKEND_PORT"; then
    off "backend already on :$BACKEND_PORT"
    return 0
  fi
  spawn "$ROOT/backend" "$LOGS/backend.log" "$RUN/backend.pid" mvn spring-boot:run
  wait_port "$BACKEND_PORT" 120 backend || true
}

# ── frontend ───────────────────────────────────────────────────────────────
# `next build` and `next dev` write to the same .next. Run a build while the
# dev server is up and dev's chunks are replaced underneath it — the page then
# dies with "Cannot find module './5611.js'". A dev start therefore throws away
# any tree carrying a production build's marker files.
clean_stale_next() {
  local d="$ROOT/frontend/.next"
  if [ -f "$d/BUILD_ID" ] && [ -f "$d/export-marker.json" ]; then
    warn "frontend/.next holds a production build — clearing it for dev"
    rm -rf "$d"
  fi
}

start_frontend() {
  if port_busy "$FRONTEND_PORT"; then
    off "frontend already on :$FRONTEND_PORT"
    return 0
  fi
  clean_stale_next
  spawn "$ROOT/frontend" "$LOGS/frontend.log" "$RUN/frontend.pid" npm run dev
  wait_port "$FRONTEND_PORT" 90 frontend || true
}

# ── commands ───────────────────────────────────────────────────────────────
cmd_up() {
  bold "starting tapa dev stack"
  start_mongo
  start_backend
  start_frontend
  echo
  bold "  http://localhost:$FRONTEND_PORT   ·   api :$BACKEND_PORT   ·   logs: make logs"
}

cmd_down() {
  bold "stopping tapa dev stack"
  kill_tree frontend "$FRONTEND_PORT" "$RUN/frontend.pid"
  kill_tree backend "$BACKEND_PORT" "$RUN/backend.pid"
  stop_mongo
}

cmd_status() {
  bold "tapa dev stack"
  if mongo_up; then
    if mongo_is_launchd; then ok "mongod    :$MONGO_PORT  launchd · /opt/homebrew/var/mongodb"
    else ok "mongod    :$MONGO_PORT  up"; fi
  else
    off "mongod    :$MONGO_PORT  down"
  fi
  local entry label port pids
  for entry in "backend :$BACKEND_PORT" "frontend:$FRONTEND_PORT"; do
    label=${entry%%:*}; port=${entry##*:}
    pids="$(port_pids "$port" | tr '\n' ' ')"
    if [ -n "$pids" ]; then ok "$label  :$port  pid ${pids% }"; else off "$label  :$port  down"; fi
  done
}

cmd_logs() {
  local which=${1:-all}
  case "$which" in
    all) tail -n 40 -f "$LOGS/backend.log" "$LOGS/frontend.log" ;;
    mongo|backend|frontend) tail -n 200 -f "$LOGS/$which.log" ;;
    *) echo "logs: mongo | backend | frontend | all" >&2; exit 2 ;;
  esac
}

CMD="${1:-up}"
shift || true
WITH_DB=0
for arg in "$@"; do
  [ "$arg" = "--with-db" ] && WITH_DB=1
done
export WITH_DB

case "$CMD" in
  up) cmd_up ;;
  down|stop) cmd_down ;;
  restart) cmd_down; echo; cmd_up ;;
  status|ps) cmd_status ;;
  logs) cmd_logs "$@" ;;
  *) echo "usage: scripts/dev.sh {up|down|restart|status|logs [mongo|backend|frontend]} [--with-db]" >&2; exit 2 ;;
esac
