---
name: application-environments
description: Use this skill when working with environment configuration, deployment targets, or understanding how the application runs across local development, preview deployments, and production. Covers the preview-first development workflow, Vercel deployments, Supabase branching, and environment variables.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# Application Environments

This project uses a **preview-first development model**: local development for fast frontend iteration, preview deployments for full-stack testing.

## Quick Reference

| Environment | Purpose | Database | URL |
| ----------- | ------- | -------- | --- |
| **Local** | Frontend development | None (or preview DB) | `localhost:3500` |
| **Preview** | Full-stack PR testing | Supabase branch | `*.vercel.app` |
| **Production** | Live application | Supabase main | Custom domain |

## Local Development

Local dev is optimized for **fast frontend iteration**. No database setup required.

### Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file
cp apps/web/.env.local.example apps/web/.env.local

# 3. Start dev server
pnpm dev
```

**That's it.** Web app runs at `http://localhost:3500`.

### What Works Locally

- Frontend development with hot reload
- Component development and styling
- TypeScript checking and linting

### What Requires Preview Environment

- Database operations
- Authentication flows
- API endpoints that need data
- Full end-to-end testing

## Preview Environment (Primary Testing)

Every PR automatically gets a complete, isolated environment.

### What Happens on PR

```text
PR Created/Updated
      ↓
GitHub Action triggers
      ↓
├── Supabase: Creates database branch
├── Supabase: Applies migrations
├── Supabase: Seeds test data
└── Vercel: Deploys preview
      ↓
Ready to test at preview URL
```

### Test Credentials

All preview environments have a test user:

| Field | Value |
| ----- | ----- |
| Email | `test@preview.local` |
| Password | `PreviewPassword123!` |

The login page shows "Quick Login as Test User" in preview environments.

### Preview URLs

- **Vercel preview**: `<branch>-<project>.vercel.app`
- **Supabase Studio**: Available in Supabase dashboard under Branches

## Production

Production deploys automatically when PRs merge to `main`.

| Component | Platform |
| --------- | -------- |
| Web App | Vercel |
| API Server | Render |
| Database | Supabase |

## Environment Variables

### Required Files

| File | When Needed |
| ---- | ----------- |
| `apps/web/.env.local` | Always (copy from `.env.local.example`) |
| `apps/api-server/.env.local` | Only for local API server |

### Key Variables

| Variable | Local | Preview | Production |
| -------- | ----- | ------- | ---------- |
| `NEXT_PUBLIC_SITE_URL` | `localhost:3500` | Auto-set | Production URL |
| `POSTGRES_PRISMA_URL` | Not needed | Auto-set | Auto-set |

### Managing Vercel Variables

```bash
pnpm web:env:list              # List all
pnpm web:env:pull              # Pull to .env.local
```

## Connecting Local to Preview Database (Optional)

For local debugging with real data, connect to a preview branch's database:

1. Get connection string from Supabase dashboard (your PR's branch)
2. Add to `apps/web/.env.local`:

```bash
POSTGRES_PRISMA_URL="<connection-string-from-supabase>"
POSTGRES_URL_NON_POOLING="<connection-string-from-supabase>"
```

1. Restart dev server

## Supabase Local Stack (Advanced)

For offline development or Supabase-specific features (Storage, Realtime, Edge Functions):

```bash
pnpm supabase:check   # Verify CLI installed
pnpm supabase:start   # Start Docker stack
pnpm supabase:status  # Check status and URLs
pnpm supabase:stop    # Stop stack
pnpm supabase:reset   # Reset database
```

**Note:** Supabase local uses fixed ports (54321-54327) and doesn't support multiple parallel instances. Not recommended for worktree-based parallel development.

## Debugging

### Local Issues

```bash
# Check if dev server is running
lsof -i :3500

# Restart dev server
pkill -f "next dev" && pnpm dev
```

### Preview Issues

```bash
# View Vercel logs
vercel logs <preview-url>

# Check Supabase branch status
# Use Supabase dashboard → Branches
```

## Related Skills

- **`cicd`**: CI/CD pipelines and deployment automation
- **`api-proxy`**: Preview environment authentication
- **`debugging`**: Comprehensive troubleshooting
- **`git-worktrees`**: Parallel development workflow
