---
description: Start local dev servers for the current worktree with robust port conflict handling
---

# Start Applications

Start the local development server for the current worktree or main repository.

## Pre-flight Checks

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
echo "Configured port - Web: ${WEB_PORT:-default}"
```

### 3. Check for Port Conflicts

```bash
check_port() {
  local port=$1
  local name=$2

  if [ -z "$port" ]; then
    echo "ℹ️  $name will use default port"
    return 0
  fi

  if lsof -i ":$port" -t >/dev/null 2>&1; then
    echo "⚠️  Port $port ($name) is already in use"
    lsof -i ":$port" -P | head -5
    return 1
  else
    echo "✓ Port $port ($name) is available"
    return 0
  fi
}
```

## Port Conflict Resolution

If conflicts detected, present resolution options using AskUserQuestion:

1. **Kill existing processes** - Terminate processes using the ports
2. **Use different ports** - Allocate new available ports
3. **Cancel** - Abort startup

### Option 1: Kill Existing Processes

```bash
kill_port_processes() {
  local port=$1
  local pids=$(lsof -i ":$port" -t 2>/dev/null)

  if [ -n "$pids" ]; then
    echo "Stopping processes on port $port..."
    echo "$pids" | xargs kill -TERM 2>/dev/null || true
    sleep 5

    # Force kill if still running
    pids=$(lsof -i ":$port" -t 2>/dev/null)
    if [ -n "$pids" ]; then
      echo "$pids" | xargs kill -9 2>/dev/null || true
    fi
  fi
}
```

### Option 2: Use Different Ports

```bash
allocate_new_ports() {
  local script_path="tooling/scripts/src/worktree-port.sh"

  if [ -x "$script_path" ]; then
    new_web_port=$("$script_path" "$(pwd)")
  else
    for port in $(seq 3501 3999); do
      if ! lsof -i ":$port" -t >/dev/null 2>&1; then
        new_web_port=$port
        break
      fi
    done
  fi

  sed -i.bak "s/^PORT=.*/PORT=$new_web_port/" apps/web/.env.local
  rm -f apps/web/.env.local.bak
}
```

## Start Dev Servers

```bash
pnpm dev
```

## Output Format

```text
🚀 Starting applications for: <worktree-name>

Ports:
  • Web app:    http://localhost:<web-port>

Starting dev servers...
```

## Error Handling

### Missing Environment Files

```text
⚠️  apps/web/.env.local not found

Options:
  1. Copy from main repository: cp ../../apps/web/.env.local apps/web/
  2. Copy from example: cp apps/web/.env.local.example apps/web/.env.local
  3. Run worktree setup: pnpm worktree:resume <worktree-name>
```

### Port Range Exhaustion

```text
✗ No available ports found

Troubleshooting:
  1. Stop other dev servers: /dev:stop-apps (in each worktree)
  2. List processes using ports: lsof -i -P | grep LISTEN
  3. Kill all node processes: pkill -f "node.*turbo"
```

---
Context: $ARGUMENTS
