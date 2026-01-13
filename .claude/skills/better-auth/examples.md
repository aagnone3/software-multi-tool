# Better Auth Examples

Practical examples for common authentication workflows in this project.

## Table of Contents

1. [Adding a New Social Provider](#adding-a-new-social-provider)
2. [Creating a Custom Plugin](#creating-a-custom-plugin)
3. [Implementing Protected Routes](#implementing-protected-routes)
4. [Organization Workflows](#organization-workflows)
5. [Custom Email Templates](#custom-email-templates)
6. [Session Management](#session-management)

---

## Adding a New Social Provider

### Example: Adding Discord

**1. Install environment variables** (`apps/web/.env.local`):

```bash
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

**2. Update auth config** (`packages/auth/auth.ts`):

```typescript
socialProviders: {
  google: { /* existing */ },
  github: { /* existing */ },
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID as string,
    clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    scope: ["identify", "email"],
  },
}
```

**3. Add to trusted providers** (optional, for account linking):

```typescript
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github", "discord"],
  }
}
```

**4. Use in client**:

```typescript
await authClient.signIn.social({ provider: "discord" });
```

---

## Creating a Custom Plugin

### Example: Rate Limiting Plugin

Create `packages/auth/plugins/rate-limit/index.ts`:

```typescript
import type { BetterAuthPlugin } from "better-auth";
import { APIError } from "better-auth/api";
import { createAuthMiddleware } from "better-auth/plugins";

interface RateLimitStore {
  attempts: Map<string, { count: number; resetAt: number }>;
}

const store: RateLimitStore = { attempts: new Map() };

export const rateLimitPlugin = (config: {
  maxAttempts?: number;
  windowMs?: number;
}) => {
  const maxAttempts = config.maxAttempts ?? 5;
  const windowMs = config.windowMs ?? 15 * 60 * 1000; // 15 minutes

  return {
    id: "rate-limit",
    hooks: {
      before: [
        {
          matcher: (context) => context.path.startsWith("/sign-in"),
          handler: createAuthMiddleware(async (ctx) => {
            const { email } = ctx.body;
            const now = Date.now();

            const record = store.attempts.get(email);

            if (record) {
              if (now > record.resetAt) {
                // Reset window
                store.attempts.set(email, { count: 1, resetAt: now + windowMs });
              } else if (record.count >= maxAttempts) {
                throw new APIError("TOO_MANY_REQUESTS", {
                  message: "Too many login attempts. Try again later.",
                });
              } else {
                record.count++;
              }
            } else {
              store.attempts.set(email, { count: 1, resetAt: now + windowMs });
            }
          }),
        },
      ],
    },
  } satisfies BetterAuthPlugin;
};
```

**Add to auth config**:

```typescript
import { rateLimitPlugin } from "./plugins/rate-limit";

plugins: [
  // ... other plugins
  rateLimitPlugin({ maxAttempts: 5, windowMs: 900000 }),
]
```

---

## Implementing Protected Routes

### Server Component Protection

`apps/web/app/app/protected/page.tsx`:

```typescript
import { auth } from "@repo/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div>
      <h1>Welcome, {session.user.name}</h1>
      <p>Email: {session.user.email}</p>
    </div>
  );
}
```

### Client Component Protection

`apps/web/app/app/dashboard/page.tsx`:

```typescript
"use client";

import { authClient } from "@repo/auth/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/auth/login");
    }
  }, [session, isPending, router]);

  if (isPending) {
    return <div>Loading...</div>;
  }

  if (!session) {
    return null; // Will redirect
  }

  return <div>Dashboard for {session.user.name}</div>;
}
```

### API Route Protection

`packages/api/modules/users/profile.ts`:

```typescript
import { auth } from "@repo/auth";
import { orpc } from "@repo/api/orpc";
import { z } from "zod";

export const updateProfile = orpc
  .input(z.object({
    name: z.string(),
  }))
  .handler(async ({ input, context }) => {
    const session = await auth.api.getSession({
      headers: context.request.headers,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    // Update user profile
    return { success: true };
  });
```

---

## Organization Workflows

### Creating Organization with First Member

```typescript
"use client";

import { authClient } from "@repo/auth/client";

async function createOrganization(name: string) {
  // Create organization
  const org = await authClient.organization.create({
    name,
    slug: name.toLowerCase().replace(/\s+/g, "-"),
  });

  // Automatically added as owner
  // Set as active organization
  await authClient.organization.setActive({
    organizationId: org.id,
  });

  return org;
}
```

### Inviting Members with Role

```typescript
async function inviteTeamMember(orgId: string, email: string, role: "owner" | "member") {
  await authClient.organization.inviteMember({
    organizationId: orgId,
    email,
    role,
  });

  // Email sent automatically via sendInvitationEmail hook
  // in packages/auth/auth.ts
}
```

### Accepting Invitation (From Email Link)

```typescript
"use client";

import { authClient } from "@repo/auth/client";
import { useSearchParams } from "next/navigation";

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const invitationId = searchParams.get("invitationId");

  async function acceptInvitation() {
    if (!invitationId) return;

    try {
      await authClient.organization.acceptInvitation({
        invitationId,
      });

      // Automatically triggers seat count update
      // via hook in packages/auth/auth.ts
    } catch (error) {
      console.error("Failed to accept invitation", error);
    }
  }

  return <button onClick={acceptInvitation}>Accept Invitation</button>;
}
```

### Checking Organization Permissions

```typescript
import { auth } from "@repo/auth";
import type { OrganizationMemberRole } from "@repo/auth";

async function checkPermissions(request: Request) {
  const org = await auth.api.getFullOrganization({
    headers: request.headers,
  });

  if (!org) {
    throw new Error("Not in organization");
  }

  const session = await auth.api.getSession({
    headers: request.headers,
  });

  const currentMember = org.members.find(
    m => m.userId === session?.user.id
  );

  const isOwner = currentMember?.role === "owner";
  const canInvite = isOwner; // Custom logic
  const canDelete = isOwner;

  return { isOwner, canInvite, canDelete };
}
```

---

## Custom Email Templates

### Adding New Template

**1. Create email template** (`packages/mail/emails/AccountLocked.tsx`):

```typescript
import { Link, Text } from "@react-email/components";
import React from "react";
import { createTranslator } from "use-intl/core";
import PrimaryButton from "../src/components/PrimaryButton";
import Wrapper from "../src/components/Wrapper";
import { defaultLocale, defaultTranslations } from "../src/util/translations";
import type { BaseMailProps } from "../types";

export function AccountLocked({
  url,
  name,
  locale,
  translations,
}: {
  url: string;
  name: string;
} & BaseMailProps) {
  const t = createTranslator({
    locale,
    messages: translations,
  });

  return (
    <Wrapper>
      <Text>{t("mail.accountLocked.body", { name })}</Text>
      <PrimaryButton href={url}>
        {t("mail.accountLocked.unlock")} &rarr;
      </PrimaryButton>
    </Wrapper>
  );
}
```

**2. Add translations** (update `packages/mail/src/util/translations.ts`):

```typescript
// Add to defaultTranslations.mail object:
accountLocked: {
  body: "Hi {name}, your account has been locked due to suspicious activity.",
  unlock: "Unlock Account",
  subject: "Your account has been locked",
},
```

**3. Use in auth hook**:

```typescript
import { sendEmail } from "@repo/mail";

// In custom plugin or hook
await sendEmail({
  to: user.email,
  templateId: "accountLocked",
  context: {
    name: user.name,
    url: "https://app.com/unlock",
  },
  locale: "en",
});
```

---

## Session Management

### Getting Current Session (Server)

```typescript
import { auth } from "@repo/auth";
import { headers } from "next/headers";

async function getCurrentUser() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return session?.user ?? null;
}
```

### Extending Session Data

**Add custom field** (`packages/auth/auth.ts`):

```typescript
user: {
  additionalFields: {
    onboardingComplete: { type: "boolean" },
    locale: { type: "string" },
    // Add new field
    subscriptionTier: { type: "string", required: false },
  }
}
```

**Update type**:

```typescript
export type Session = typeof auth.$Infer.Session;
// Now includes session.user.subscriptionTier
```

**Access in client**:

```typescript
const { data: session } = authClient.useSession();
console.log(session?.user.subscriptionTier);
```

### Manual Session Refresh

```typescript
"use client";

import { authClient } from "@repo/auth/client";

async function refreshSession() {
  // Fetch fresh session from server
  const { data } = await authClient.getSession();

  // Update local state
  return data;
}
```

### Session Expiry Configuration

From `config/index.ts`:

```typescript
auth: {
  sessionCookieMaxAge: 60 * 60 * 24 * 30, // 30 days in seconds
}
```

To change:

```typescript
auth: {
  sessionCookieMaxAge: 60 * 60 * 24 * 7, // 7 days
}
```

### Logout and Cleanup

```typescript
async function logout() {
  await authClient.signOut();

  // Optionally clear local storage
  localStorage.clear();

  // Redirect
  window.location.href = "/";
}
```

---

## Advanced Patterns

### Conditional Authentication (Invitation-Only)

The `invitationOnlyPlugin` demonstrates conditional signup:

```typescript
// When config.auth.enableSignup is false:
// 1. Check for pending invitation
const hasInvitation = await getPendingInvitationByEmail(email);

// 2. Block signup if no invitation
if (!hasInvitation) {
  throw new APIError("BAD_REQUEST", {
    code: "INVALID_INVITATION",
    message: "No invitation found for this email",
  });
}
```

### Multi-Step Onboarding

```typescript
"use client";

import { authClient } from "@repo/auth/client";
import { useRouter } from "next/navigation";

export default function OnboardingFlow() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  async function completeOnboarding(data: OnboardingData) {
    // Update user fields
    await authClient.updateUser({
      onboardingComplete: true,
      locale: data.locale,
    });

    // Redirect to app
    router.push("/app");
  }

  if (session?.user.onboardingComplete) {
    router.push("/app");
    return null;
  }

  return <OnboardingForm onSubmit={completeOnboarding} />;
}
```

### Two-Factor Authentication

**Enable for user**:

```typescript
const { totpUri, backupCodes } = await authClient.twoFactor.enable({
  password: currentPassword,
});

// Show QR code from totpUri
// Save backup codes securely
```

**Verify during login**:

```typescript
await authClient.twoFactor.verifyTotp({
  code: totpCode,
});
```

**Disable**:

```typescript
await authClient.twoFactor.disable({
  password: currentPassword,
});
```

---

## Testing Examples

### Integration Test Pattern

From `packages/auth/auth.integration.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { auth } from "./auth";

describe("Authentication", () => {
  it("should create session for valid credentials", async () => {
    const response = await auth.api.signInEmail({
      email: "test@example.com",
      password: "password123",
    });

    expect(response.user).toBeDefined();
    expect(response.session).toBeDefined();
  });

  it("should reject invalid invitation", async () => {
    await expect(
      auth.api.signUpEmail({
        email: "no-invite@example.com",
        password: "password123",
      })
    ).rejects.toThrow("INVALID_INVITATION");
  });
});
```

---

## Common Pitfalls

### 1. Missing Headers in Server Components

```typescript
// ❌ Wrong
const session = await auth.api.getSession();

// ✅ Correct
const session = await auth.api.getSession({
  headers: await headers(),
});
```

### 2. Not Checking Session Before Access

```typescript
// ❌ Wrong
const userName = session.user.name; // Might be null

// ✅ Correct
if (!session) {
  redirect("/auth/login");
}
const userName = session.user.name;
```

### 3. Forgetting to Update Types After Schema Changes

```bash
# After modifying additionalFields, regenerate:
pnpm --filter @repo/auth migrate
pnpm --filter @repo/database generate
```

### 4. Not Using Localized Emails

```typescript
// ❌ Wrong
await sendEmail({
  to: email,
  templateId: "welcome",
  context: { name },
  // Missing locale!
});

// ✅ Correct
const locale = getLocaleFromRequest(request);
await sendEmail({
  to: email,
  templateId: "welcome",
  context: { name },
  locale,
});
```
