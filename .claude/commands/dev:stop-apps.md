---
description: Stop local dev servers for the current worktree with graceful shutdown
---

# Stop Applications

Stop the local development server (web app) for the current worktree or main repository.

## Identify Running Processes

### 1. Detect Environment

```bash
# Check if we're in a worktree
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
# Web app port
WEB_PORT=$(grep "^PORT=" apps/web/.env.local 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '"' || echo "")

echo "Configured port - Web: ${WEB_PORT:-not set}"
```

### 3. Find Running Processes

```bash
get_port_processes() {
  local port=$1
  lsof -i ":$port" -P 2>/dev/null | awk 'NR>1 {printf "  PID: %s, Command: %s, User: %s\n", $2, $1, $3}'
}

echo "Checking for running processes..."

if [ -n "$WEB_PORT" ]; then
  WEB_PIDS=$(lsof -i ":$WEB_PORT" -t 2>/dev/null || true)
  if [ -n "$WEB_PIDS" ]; then
    echo "Web server processes on port $WEB_PORT:"
    get_port_processes "$WEB_PORT"
  else
    echo "No processes on web port $WEB_PORT"
  fi
else
  echo "No web port configured in .env.local"
fi
```

## Stop Processes

### Graceful Shutdown (SIGTERM)

First attempt a graceful shutdown:

```bash
stop_port() {
  local port=$1
  local name=$2
  local pids
  pids=$(lsof -i ":$port" -t 2>/dev/null)

  if [ -z "$pids" ]; then
    echo "✓ $name (port $port): No processes running"
    return 0
  fi

  echo "Stopping $name on port $port..."

  # Send SIGTERM for graceful shutdown
  echo "$pids" | xargs kill -TERM 2>/dev/null || true

  # Wait for processes to exit (up to 5 seconds)
  for i in {1..5}; do
    sleep 1
    if ! lsof -i ":$port" -t >/dev/null 2>&1; then
      echo "✓ $name (port $port): Stopped gracefully"
      return 0
    fi
    echo "  Waiting... ($i/5)"
  done

  # Check if still running
  pids=$(lsof -i ":$port" -t 2>/dev/null)
  if [ -n "$pids" ]; then
    return 1  # Need force kill
  fi

  echo "✓ $name (port $port): Stopped"
  return 0
}
```

### Force Kill (SIGKILL)

If graceful shutdown fails, force kill:

```bash
force_stop_port() {
  local port=$1
  local name=$2
  local pids
  pids=$(lsof -i ":$port" -t 2>/dev/null)

  if [ -z "$pids" ]; then
    return 0
  fi

  echo "⚠️  Force killing $name on port $port..."
  echo "$pids" | xargs kill -9 2>/dev/null || true

  sleep 1

  # Verify
  if lsof -i ":$port" -t >/dev/null 2>&1; then
    echo "✗ Failed to stop $name on port $port"
    echo "  Remaining processes:"
    lsof -i ":$port" -P 2>/dev/null | head -5
    return 1
  fi

  echo "✓ $name (port $port): Force stopped"
  return 0
}
```

### Complete Stop Sequence

```bash
stop_all() {
  local web_port=$1
  local errors=0

  # Stop web server
  if [ -n "$web_port" ]; then
    if ! stop_port "$web_port" "Web app"; then
      if ! force_stop_port "$web_port" "Web app"; then
        errors=$((errors + 1))
      fi
    fi
  fi

  return $errors
}
```

## Also Stop Turbo Daemon

The turbo daemon may keep processes alive:

```bash
# Check for turbo daemon processes related to this directory
TURBO_PIDS=$(pgrep -f "turbo.*$(pwd)" 2>/dev/null || true)
if [ -n "$TURBO_PIDS" ]; then
  echo "Stopping turbo daemon processes..."
  echo "$TURBO_PIDS" | xargs kill -TERM 2>/dev/null || true
  sleep 1
fi
```

## Verification

After stopping, verify ports are free:

```bash
verify_stopped() {
  local port=$1
  local name=$2

  if lsof -i ":$port" -t >/dev/null 2>&1; then
    echo "⚠️  $name (port $port): Still has processes running"
    return 1
  else
    echo "✓ $name (port $port): Confirmed stopped"
    return 0
  fi
}
```

## Output Format

Display a summary:

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

To stop ALL dev servers across all worktrees, use the `--all` argument.

When `--all` is specified:

```bash
stop_all_servers() {
  echo "Stopping all dev servers..."

  # Find all node/turbo processes that look like dev servers
  local all_pids
  all_pids=$(pgrep -f "node.*next.*dev" 2>/dev/null; pgrep -f "turbo.*dev" 2>/dev/null) || true

  if [ -z "$all_pids" ]; then
    echo "No dev servers running"
    return 0
  fi

  # Show what will be stopped
  echo "Processes to stop:"
  ps -p $(echo "$all_pids" | tr '\n' ',' | sed 's/,$//') -o pid,command 2>/dev/null | head -10

  # Stop all
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

Configured ports:
  • Web app:    <port> (not in use)
```

### No Ports Configured

```text
⚠️  No PORT configured in apps/web/.env.local

Cannot determine which processes to stop. Options:
  1. Specify ports manually
  2. Stop all dev servers with: /dev:stop-apps --all
  3. Find processes manually: lsof -i -P | grep LISTEN
```

### Permission Denied

```text
✗ Permission denied when stopping processes on port <port>

Try:
  1. Run with sudo (not recommended)
  2. Find process owner: lsof -i :<port>
  3. The process may belong to another user
```

### Zombie Processes

```text
⚠️  Some processes could not be stopped

Troubleshooting:
  1. Check for zombie processes: ps aux | grep defunct
  2. Kill parent process: kill -9 <parent-pid>
  3. As last resort, restart your terminal
```

## Example Interaction

**User:** `/dev:stop-apps`

**Assistant:** Let me stop the dev servers for your current environment.

*Detecting environment...*

Running from: `feat-pra-XX-feature-name`

Reading configured ports...

```text
Configured ports:
  • Web app:    3742
```

Checking for running processes...

```text
Web server processes on port 3742:
  PID: 12345, Command: node, User: developer
```

🛑 Stopping applications for: feat-pra-XX-feature-name

Stopping processes...
  Stopping Web app on port 3742...
  ✓ Web app (port 3742): Stopped gracefully

All applications stopped.

---

**User:** `/dev:stop-apps --all`

**Assistant:** [Uses AskUserQuestion to confirm stopping ALL dev servers across all worktrees]

User confirms

Stopping all dev servers...

```text
Processes stopped across all worktrees.
```

✓ All dev servers stopped
