---
name: implementing-auth
description: Implements authentication via Better Auth with passkeys, magic links, OAuth, and organizations. Covers session management, invitation-only signup, and multi-tenant RBAC. Use when building login flows, managing sessions, or debugging auth issues.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Better Auth Skill

This skill provides comprehensive guidance for working with Better Auth in this project, including configuration, plugins, and common patterns.

## When to Use This Skill

Invoke this skill when:

- Implementing login/signup flows
- Adding new authentication methods
- Working with user sessions
- Managing organizations and invitations
- Modifying auth configuration
- Debugging auth issues
- Adding protected routes
- Integrating with payment systems (subscription seats)

## Quick Reference

For deep Better Auth documentation, reference: https://www.better-auth.com/llms.txt

## Project Configuration

### Location

- **Server auth instance**: `packages/auth/auth.ts`
- **Client instance**: `packages/auth/client.ts`
- **Auth config**: `config/index.ts` (auth section)
- **Custom plugin**: `packages/auth/plugins/invitation-only/`
- **Organization helpers**: `packages/auth/lib/organization.ts`

### Environment Variables

Required in `apps/web/.env.local`:

```bash
BETTER_AUTH_SECRET=<random-key>
BETTER_AUTH_URL=<app-url>

# Social providers (optional)
GOOGLE_CLIENT_ID=<id>
GOOGLE_CLIENT_SECRET=<secret>
GITHUB_CLIENT_ID=<id>
GITHUB_CLIENT_SECRET=<secret>
```

## Enabled Features

### Authentication Methods

Based on `config/index.ts`:

- ✅ **Email & Password** (when `config.auth.enablePasswordLogin: true`)
- ✅ **Magic Link** (when `config.auth.enableMagicLink: true`)
- ✅ **Social Login** (Google, GitHub when `config.auth.enableSocialLogin: true`)
- ✅ **Passkeys** (when `config.auth.enablePasskeys: true`)
- ✅ **Two-Factor Authentication** (when `config.auth.enableTwoFactor: true`)

### Active Plugins

From `packages/auth/auth.ts`:

```typescript
plugins: [
  username(),              // Username support
  admin(),                 // Admin role management
  passkey(),              // Passkey authentication
  magicLink(),            // Magic link email login
  organization(),         // Multi-tenant organizations
  openAPI(),              // OpenAPI documentation
  invitationOnlyPlugin(), // Custom invitation system
  twoFactor(),            // 2FA support
]
```

## Database Integration

Uses **Prisma adapter** with PostgreSQL:

```typescript
database: prismaAdapter(db, {
  provider: "postgresql",
})
```

### Schema Management

```bash
# Generate auth tables in Prisma schema
pnpm --filter @repo/auth migrate

# This runs:
# @better-auth/cli generate --config ./auth.ts --output ../database/prisma/schema.prisma
```

## Custom Features

### 1. Invitation-Only Signup

Plugin: `packages/auth/plugins/invitation-only/index.ts`

When `config.auth.enableSignup: false`:

- Users can only sign up via organization invitation
- Validates invitation exists before allowing signup
- Returns `INVALID_INVITATION` error if no pending invitation

### 2. Organization Seat Management

Helper: `packages/auth/lib/organization.ts`

Automatically syncs organization member count with subscription seats:

- Triggered after accepting invitation
- Triggered after removing member
- Updates payment provider subscription quantity

### 3. Additional User Fields

```typescript
user: {
  additionalFields: {
    onboardingComplete: { type: "boolean" },
    locale: { type: "string" },
  }
}
```

### 4. Email Integration

All email sending uses `@repo/mail` with i18n support:

- Email verification
- Password reset
- Magic link
- Organization invitations

Locale detection from `NEXT_LOCALE` cookie for proper translations.

### 5. Automatic Subscription Cleanup

Before hooks clean up subscriptions when:

- User deletes account
- Organization is deleted

Uses `@repo/payments` to cancel active subscriptions.

## Client-Side Usage

### React Hooks

```typescript
import { authClient } from "@repo/auth/client";

// Get session with React hook
const { data: session, isPending } = authClient.useSession();

// Sign out
await authClient.signOut();

// Sign in with email/password
await authClient.signIn.email({
  email: "user@example.com",
  password: "password123"
});

// Sign in with social provider
await authClient.signIn.social({ provider: "google" });

// Sign in with magic link
await authClient.signIn.magicLink({ email: "user@example.com" });
```

### Organization Management

```typescript
// Create organization
await authClient.organization.create({ name: "Acme Inc" });

// Invite member
await authClient.organization.inviteMember({
  organizationId: "org_123",
  email: "member@example.com",
  role: "member"
});

// Accept invitation
await authClient.organization.acceptInvitation({
  invitationId: "inv_123"
});

// Switch active organization
await authClient.organization.setActive({ organizationId: "org_123" });
```

## Server-Side Usage

### Getting Session

```typescript
import { auth } from "@repo/auth";

// In API routes (with headers)
const session = await auth.api.getSession({
  headers: request.headers
});

if (!session) {
  return new Response("Unauthorized", { status: 401 });
}

const userId = session.user.id;
```

### Organization Access

```typescript
// Get full organization with members
const org = await auth.api.getFullOrganization({
  headers: request.headers
});

// Check membership
if (!org) {
  throw new Error("Not in organization");
}

const isOwner = org.members.some(
  m => m.userId === session.user.id && m.role === "owner"
);
```

## Type Safety

### Exported Types

From `packages/auth/index.ts`:

```typescript
export type Session = typeof auth.$Infer.Session;
export type ActiveOrganization = NonNullable<
  Awaited<ReturnType<typeof auth.api.getFullOrganization>>
>;
export type Organization = typeof auth.$Infer.Organization;
export type OrganizationMemberRole = ActiveOrganization["members"][number]["role"];
export type OrganizationInvitationStatus = typeof auth.$Infer.Invitation.status;
```

### Client Error Codes

```typescript
import type { AuthClientErrorCodes } from "@repo/auth/client";

// Includes Better Auth errors + custom:
// - INVALID_INVITATION: "No invitation found for this email"
```

## Configuration Patterns

### Session Configuration

```typescript
session: {
  expiresIn: config.auth.sessionCookieMaxAge, // 30 days default
  freshAge: 0, // Require revalidation
}
```

### Account Linking

```typescript
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
  }
}
```

### Email/Password Behavior

```typescript
emailAndPassword: {
  enabled: true,
  // Auto sign-in if invitation-only (email pre-verified)
  autoSignIn: !config.auth.enableSignup,
  // Require verification only for open signup
  requireEmailVerification: config.auth.enableSignup,
}
```

## Common Workflows

See `examples.md` in this skill directory for detailed examples of:

- Setting up new auth methods
- Creating custom plugins
- Handling organization workflows
- Implementing protected routes
- Testing auth flows

## Key Principles

1. **Framework-agnostic**: Better Auth works with any TypeScript framework
2. **Type-safe**: Full TypeScript support with inferred types
3. **Plugin-based**: Extend functionality without core modifications
4. **Self-hosted**: All data stays in your database
5. **Email integration**: Localized emails via `@repo/mail`
6. **Organization-first**: Built-in multi-tenancy support

## Testing

Auth integration tests: `packages/auth/auth.integration.test.ts`

Run tests:

```bash
pnpm --filter @repo/auth test
```

### Test User (Quick Login)

For local development, a test user enables Quick Login on the login page:

| Field    | Value              |
| -------- | ------------------ |
| Email    | test@preview.local |
| Password | TestPassword123    |

**Seeding the test user:**

```bash
PGPASSWORD=postgres psql -h localhost -U postgres -d local_softwaremultitool -f supabase/seed.sql
```

## Troubleshooting

### Quick Login / Test User Login Fails

**Symptom**: "Invalid password" error in server logs when using Quick Login

**Cause**: The password hash in `supabase/seed.sql` must be generated using Better Auth's `hashPassword` function. Hashes from other tools (even using scrypt) won't work due to different parameters.

**Solution**: Generate a valid hash using Better Auth's crypto:

```typescript
import { hashPassword, verifyPassword } from "better-auth/crypto";

// Generate hash
const hash = await hashPassword("TestPassword123");

// Verify it works
const isValid = await verifyPassword({ hash, password: "TestPassword123" });
```

**Test file**: `packages/auth/password.integration.test.ts` generates and verifies password hashes.

**Key insight**: Password hashes must be generated by the same library that verifies them. Better Auth uses scrypt with specific parameters - even hashes that look correct (salt:hash format, 161 chars) will fail if generated with different scrypt parameters.

### Session Not Persisting

**Symptom**: User logged in but session lost on refresh

**Check**:

1. `BETTER_AUTH_SECRET` is set in `.env.local`
2. `NEXT_PUBLIC_SITE_URL` matches the actual URL (including port)
3. Cookies are not blocked by browser

### Organization Not Set on Login

**Symptom**: `activeOrganizationId` is null after login

**Explanation**: The `databaseHooks.session.create.before` hook automatically sets the first organization. If user has no organizations, it will be null.

## Related Skills

- **architecture**: Overall auth integration in the codebase
- **prisma-migrate**: Auth database schema migrations
- **tracking-analytics**: User identification for analytics

## Additional Resources

- Better Auth docs: https://www.better-auth.com
- Better Auth LLMs.txt: https://www.better-auth.com/llms.txt
- Plugin development: See `packages/auth/plugins/invitation-only/` as example
