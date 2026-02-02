---
description: Stop local dev servers for the current worktree with graceful shutdown
---

# Stop Applications

Stop the local development server for the current worktree or main repository.

## Identify Running Processes

### 1. Detect Environment

```bash
if [ -f .git ]; then
  echo "Running from worktree"
  WORKTREE_NAME=$(basename "$(pwd)")
else
  echo "Running from main repository"
  WORKTREE_NAME="main"
fi
```

### 2. Read Configured Ports

```bash
WEB_PORT=$(grep "^PORT=" apps/web/.env.local 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '"' || echo "")
echo "Configured port - Web: ${WEB_PORT:-not set}"
```

### 3. Find Running Processes

```bash
get_port_processes() {
  local port=$1
  lsof -i ":$port" -P 2>/dev/null | awk 'NR>1 {printf "  PID: %s, Command: %s, User: %s\n", $2, $1, $3}'
}

if [ -n "$WEB_PORT" ]; then
  WEB_PIDS=$(lsof -i ":$WEB_PORT" -t 2>/dev/null || true)
  if [ -n "$WEB_PIDS" ]; then
    echo "Web server processes on port $WEB_PORT:"
    get_port_processes "$WEB_PORT"
  fi
fi
```

## Stop Processes

### Graceful Shutdown (SIGTERM)

```bash
stop_port() {
  local port=$1
  local name=$2
  local pids=$(lsof -i ":$port" -t 2>/dev/null)

  if [ -z "$pids" ]; then
    echo "✓ $name (port $port): No processes running"
    return 0
  fi

  echo "Stopping $name on port $port..."
  echo "$pids" | xargs kill -TERM 2>/dev/null || true

  for i in {1..5}; do
    sleep 1
    if ! lsof -i ":$port" -t >/dev/null 2>&1; then
      echo "✓ $name (port $port): Stopped gracefully"
      return 0
    fi
  done

  # Force kill if needed
  pids=$(lsof -i ":$port" -t 2>/dev/null)
  if [ -n "$pids" ]; then
    echo "$pids" | xargs kill -9 2>/dev/null || true
  fi
}
```

### Also Stop Turbo Daemon

```bash
TURBO_PIDS=$(pgrep -f "turbo.*$(pwd)" 2>/dev/null || true)
if [ -n "$TURBO_PIDS" ]; then
  echo "Stopping turbo daemon processes..."
  echo "$TURBO_PIDS" | xargs kill -TERM 2>/dev/null || true
fi
```

## Output Format

```text
🛑 Stopping applications for: <worktree-name>

Configured ports:
  • Web app:    <web-port>

Stopping processes...
  ✓ Web app (port <web-port>): Stopped gracefully

All applications stopped.
```

## Options

### Stop All Worktree Servers

Use `--all` argument to stop ALL dev servers across all worktrees.

```bash
stop_all_servers() {
  local all_pids
  all_pids=$(pgrep -f "node.*next.*dev" 2>/dev/null; pgrep -f "turbo.*dev" 2>/dev/null) || true

  if [ -z "$all_pids" ]; then
    echo "No dev servers running"
    return 0
  fi

  echo "$all_pids" | sort -u | xargs kill -TERM 2>/dev/null || true
  sleep 2

  # Force kill remaining
  all_pids=$(pgrep -f "node.*next.*dev" 2>/dev/null; pgrep -f "turbo.*dev" 2>/dev/null) || true
  if [ -n "$all_pids" ]; then
    echo "$all_pids" | sort -u | xargs kill -9 2>/dev/null || true
  fi

  echo "✓ All dev servers stopped"
}
```

Present confirmation via AskUserQuestion before stopping all servers.

## Error Handling

### No Processes Running

```text
ℹ️  No applications are currently running for: <worktree-name>
```

### No Ports Configured

```text
⚠️  No PORT configured in apps/web/.env.local

Options:
  1. Specify ports manually
  2. Stop all dev servers with: /dev:stop-apps --all
  3. Find processes manually: lsof -i -P | grep LISTEN
```

---
Context: $ARGUMENTS
