---
description: Start local dev servers for the current worktree with robust port conflict handling
---

# Start Applications

Start the local development server (web app) for the current worktree or main repository.

## Pre-flight Checks

Before starting, perform these checks in order:

### 1. Detect Environment

Determine if running from a worktree or main repository:

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

Extract the PORT values from environment files:

```bash
# Web app port
WEB_PORT=$(grep "^PORT=" apps/web/.env.local 2>/dev/null | tail -1 | cut -d= -f2 | tr -d '"' || echo "")

echo "Configured port - Web: ${WEB_PORT:-default}"
```

### 3. Check for Port Conflicts

Detect if ports are already in use:

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

WEB_CONFLICT=false

[ -n "$WEB_PORT" ] && (check_port "$WEB_PORT" "web" || WEB_CONFLICT=true)
```

## Port Conflict Resolution

If conflicts are detected, present resolution options using AskUserQuestion:

### Conflict Detected

When a port is in use, identify what's using it:

```bash
# Get process info for conflicting port
get_process_info() {
  local port=$1
  lsof -i ":$port" -P 2>/dev/null | awk 'NR>1 {print $1, $2, $9}' | head -3
}
```

### Resolution Options

Present these options via AskUserQuestion:

1. **Kill existing processes** - Terminate processes using the conflicting ports
2. **Use different ports** - Allocate new available ports
3. **Cancel** - Abort startup

### Option 1: Kill Existing Processes

```bash
kill_port_processes() {
  local port=$1
  local pids
  pids=$(lsof -i ":$port" -t 2>/dev/null)

  if [ -n "$pids" ]; then
    echo "Stopping processes on port $port..."
    echo "$pids" | xargs kill -TERM 2>/dev/null || true

    # Wait for graceful shutdown (up to 5 seconds)
    for i in {1..5}; do
      sleep 1
      if ! lsof -i ":$port" -t >/dev/null 2>&1; then
        echo "✓ Port $port is now free"
        return 0
      fi
    done

    # Force kill if still running
    pids=$(lsof -i ":$port" -t 2>/dev/null)
    if [ -n "$pids" ]; then
      echo "Force killing stubborn processes..."
      echo "$pids" | xargs kill -9 2>/dev/null || true
      sleep 1
    fi

    # Verify
    if lsof -i ":$port" -t >/dev/null 2>&1; then
      echo "✗ Failed to free port $port"
      return 1
    fi

    echo "✓ Port $port is now free"
  fi
  return 0
}
```

### Option 2: Use Different Ports

Allocate new ports using the worktree port allocator:

```bash
allocate_new_ports() {
  local script_path="tooling/scripts/src/worktree-port.sh"

  # Use port allocator if available
  if [ -x "$script_path" ]; then
    new_web_port=$("$script_path" "$(pwd)")
  else
    # Fallback: find available ports manually
    for port in $(seq 3501 3999); do
      if ! lsof -i ":$port" -t >/dev/null 2>&1; then
        new_web_port=$port
        break
      fi
    done
  fi

  echo "New port allocated - Web: $new_web_port"

  # Update env files
  sed -i.bak "s/^PORT=.*/PORT=$new_web_port/" apps/web/.env.local
  rm -f apps/web/.env.local.bak

  # Update site URL to match new web port
  sed -i.bak "s|^NEXT_PUBLIC_SITE_URL=.*|NEXT_PUBLIC_SITE_URL=\"http://localhost:$new_web_port\"|" apps/web/.env.local
  rm -f apps/web/.env.local.bak

  WEB_PORT=$new_web_port
}
```

## Start Dev Servers

Once ports are confirmed available:

```bash
# Start development servers
pnpm dev
```

## Post-Start Verification

After starting, verify servers are running:

```bash
# Wait for servers to start (up to 30 seconds)
echo "Waiting for servers to start..."

verify_server() {
  local port=$1
  local name=$2
  local max_attempts=30

  for i in $(seq 1 $max_attempts); do
    if curl -s "http://localhost:$port" >/dev/null 2>&1 || lsof -i ":$port" -t >/dev/null 2>&1; then
      echo "✓ $name server started on port $port"
      return 0
    fi
    sleep 1
  done

  echo "⚠️  $name server may not have started properly on port $port"
  return 1
}

# Note: Verification happens asynchronously since pnpm dev runs in foreground
```

## Output Format

Display a summary when servers are starting:

```text
🚀 Starting applications for: <worktree-name>

Ports:
  • Web app:    http://localhost:<web-port>

Starting dev servers...
```

## Error Handling

### Missing Environment Files

```bash
if [ ! -f apps/web/.env.local ]; then
  echo "⚠️  apps/web/.env.local not found"
  echo ""
  echo "Options:"
  echo "  1. Copy from main repository: cp ../../apps/web/.env.local apps/web/"
  echo "  2. Copy from example: cp apps/web/.env.local.example apps/web/.env.local"
  echo "  3. Run worktree setup: pnpm worktree:resume <worktree-name>"
  exit 1
fi
```

### Port Range Exhaustion

If no ports are available in the configured range:

```text
✗ No available ports found

Troubleshooting:
  1. Stop other dev servers: /dev:stop-apps (in each worktree)
  2. List processes using ports: lsof -i -P | grep LISTEN
  3. Kill all node processes: pkill -f "node.*turbo"
```

## Example Interaction

**User:** `/dev:start-apps`

**Assistant:** Let me start the dev servers for your current environment.

*Checks if running from worktree or main...*

Running from: `feat-pra-XX-feature-name`

Checking configured ports...

```text
Configured ports:
  • Web:    3742
```

Checking for port conflicts...

⚠️ Port 3742 is already in use:

```text
COMMAND  PID      TYPE
node     12345    localhost:3742
```

[Asks user: Kill existing process, Use different port, or Cancel?]

User selects: Kill existing process

Stopping processes on port 3742...
✓ Port 3742 is now free

🚀 Starting applications for: feat-pra-XX-feature-name

```text
Ports:
  • Web app:    http://localhost:3742
```

Runs `pnpm dev`
