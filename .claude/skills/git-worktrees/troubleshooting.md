# Git Worktrees Troubleshooting

Common issues and solutions when working with git worktrees.

## Quick Fixes

| Problem                  | Solution                              |
| ------------------------ | ------------------------------------- |
| Stale worktree reference | `git worktree prune`                  |
| Port already in use      | `lsof -i :<port>` then `kill -9 <PID>`|
| pnpm lock conflicts      | `git restore pnpm-lock.yaml`          |
| Turbo cache issues       | `rm -rf node_modules/.cache/turbo`    |

## Stale Worktree References

**Problem**: `.git/worktrees/<name>` exists but directory was deleted manually.

```bash
git worktree prune
git worktree list
```

## Worktree Already Exists for Branch

**Problem**: Trying to create worktree for a branch that already has one.

```bash
git worktree list
git worktree remove .worktrees/feat-pra-35-auth
# Or navigate to existing worktree
cd .worktrees/feat-pra-35-auth
```

## Directory Name Conflicts

**Problem**: Worktree directory already exists (from previous manual deletion).

```bash
rm -rf .worktrees/feat-pra-35-auth
git worktree prune
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

## Currently Checked Out Branch

**Problem**: Cannot create worktree for the branch you're currently on.

```bash
git checkout main
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

## pnpm Lock File Conflicts

**Problem**: `pnpm-lock.yaml` modified in worktree after creation.

```bash
cd .worktrees/feat-pra-35-auth
git restore pnpm-lock.yaml
# Or run install in parent instead
cd ../..
pnpm install
```

## Orphaned Worktrees After System Crash

**Problem**: Worktree directory exists but git doesn't recognize it.

```bash
git worktree repair
git worktree list
# If still broken:
git worktree remove .worktrees/feat-pra-35-auth --force
git worktree add .worktrees/feat-pra-35-auth -b feat/pra-35-auth
```

## Turbo Cache Corruption

**Problem**: Builds succeed in parent but fail in worktree (or vice versa).

```bash
rm -rf node_modules/.cache/turbo
pnpm clean
pnpm build
```

## Content-Collections Type Errors

**Problem**: TypeScript errors like `Cannot find module 'content-collections'`.

**Note**: Usually auto-resolved by postinstall script. If still occurring:

```bash
pnpm --filter @repo/web exec content-collections build
# Or run full install
pnpm install
```

## Port Already in Use

**Problem**: `Error: listen EADDRINUSE: address already in use :::3501`

```bash
lsof -i :3501
kill -9 <PID>
# Or use different port
echo "PORT=3502" >> apps/web/.env.local
```

## Dev Server 404 on All Routes (EMFILE Error)

**Problem**: Next.js dev server returns 404 for ALL routes. Console shows `EMFILE: too many open files` errors.

**Root cause**: macOS file descriptor limit exhausted by parallel processes.

**Symptoms**:

- Dev server says "Ready" but all routes return 404
- Many EMFILE errors in console
- Production build works fine (no file watchers)

**Diagnosis**:

```bash
lsof 2>/dev/null | awk '{print $1}' | sort | uniq -c | sort -rn | head -10
sysctl kern.maxfiles kern.maxfilesperproc
ulimit -n
```

**Immediate fix** (current terminal):

```bash
ulimit -n 65536
pnpm dev
```

**Permanent fix** - Add to `~/.zshrc`:

```bash
ulimit -n 65536
```

**System-wide fix** (requires restart):

```bash
sudo tee /Library/LaunchDaemons/limit.maxfiles.plist > /dev/null <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
  <dict>
    <key>Label</key>
    <string>limit.maxfiles</string>
    <key>ProgramArguments</key>
    <array>
      <string>launchctl</string>
      <string>limit</string>
      <string>maxfiles</string>
      <string>65536</string>
      <string>524288</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
  </dict>
</plist>
EOF
sudo launchctl load -w /Library/LaunchDaemons/limit.maxfiles.plist
```

## Missing Analytics/PostHog Keys

**Problem**: Console warning about PostHog initialization without token.

**Root cause**: Manual worktree setup copied from `.env.local.example` instead of real credentials.

```bash
cd .worktrees/<worktree-name>
# Pull real credentials from Vercel
pnpm web:env:pull
# Or copy from api-server
grep "POSTHOG" ../../apps/api-server/.env.local >> apps/web/.env.local
```

**Prevention**: Use `pnpm worktree:create` which copies configured env files.

## Jobs Not Processing (Database URL Mismatch)

**Problem**: Jobs created but never picked up by workers.

**Root cause**: Web app and api-server using different databases.

```bash
# Check both database URLs
grep "POSTGRES_PRISMA_URL" apps/web/.env.local
grep "DATABASE_URL\|POSTGRES_PRISMA_URL" apps/api-server/.env.local
# Sync to use same URL, then restart
pnpm dev
```

## Schema Mismatch (Pending Migrations)

**Problem**: Prisma errors about missing columns.

**Root cause**: Worktree branch has migrations not applied to local DB.

```bash
POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool" \
pnpm --filter @repo/database exec prisma migrate status

POSTGRES_PRISMA_URL="postgresql://postgres:postgres@localhost:5432/local_softwaremultitool" \
pnpm --filter @repo/database exec prisma migrate deploy
```
