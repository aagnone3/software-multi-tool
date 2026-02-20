---
name: managing-storage
description: File storage with Supabase Storage or S3 providing multi-tenant path isolation (organizations/{orgId}/...), upload patterns, signed URLs, and validation via @repo/storage package. Use when implementing file uploads, working with storage providers, or managing multi-tenant file access.
allowed-tools:
  - Read
  - Edit
  - Write
  - Bash
  - Grep
  - Glob
---

# Storage Skill

Multi-tenant file storage patterns and path conventions for the `@repo/storage` package.

## Quick Reference

| Component | Location |
| --------- | -------- |
| Path utilities | `packages/storage/paths.ts` |
| Package import | `import { buildOrgPath, buildUserPath, buildSystemPath } from "@repo/storage"` |
| Bucket config | `config/index.ts` (`storage.bucketNames`) |
| Image proxy route | `apps/web/app/image-proxy/[...path]/route.ts` |
| Supabase provider | `packages/storage/provider/supabase/` |
| S3 provider | `packages/storage/provider/s3/` |
| Job upload patterns | [job-upload-patterns.md](job-upload-patterns.md) |

## When to Use This Skill

Use this skill when:

- Implementing file upload features (avatars, logos, documents)
- Adding new upload types to the application
- Working with storage providers (Supabase, S3, local)
- Migrating existing files to new path conventions
- Debugging file access issues

**Activation keywords**: file upload, storage, avatar, logo, s3, supabase, bucket, signed url, multi-tenant paths

## Core Concept: Multi-Tenant Path Isolation

All file uploads must follow multi-tenant path conventions to ensure proper isolation between organizations.

### Path Convention Table

| Upload Type          | Path Pattern                                  | Example                                                   |
| -------------------- | --------------------------------------------- | --------------------------------------------------------- |
| Organization-level   | `organizations/{orgId}/{type}`                | `organizations/abc123-uuid/logo.png`                      |
| User-scoped (in org) | `organizations/{orgId}/users/{userId}/{type}` | `organizations/abc123-uuid/users/user456-uuid/avatar.png` |
| System-level         | `system/{type}`                               | `system/assets/default-avatar.png`                        |

### Path Builder Functions

```typescript
import { buildOrgPath, buildUserPath, buildSystemPath } from "@repo/storage";

// Organization-level files (logos, branding)
const logoPath = buildOrgPath({
  organizationId: "abc123-...",
  fileType: "logo.png"
});
// → "organizations/abc123-.../logo.png"

// User-scoped files (avatars, profile photos)
const avatarPath = buildUserPath({
  organizationId: "abc123-...",
  userId: "user456-...",
  fileType: "avatar.png"
});
// → "organizations/abc123-.../users/user456-.../avatar.png"

// System files (defaults, templates)
const defaultPath = buildSystemPath({
  pathType: "assets/default-avatar.png"
});
// → "system/assets/default-avatar.png"
```

## Validation Rules

The path builders enforce these validation rules:

| Field          | Requirements                                                              |
| -------------- | ------------------------------------------------------------------------- |
| organizationId | Must be a valid UUID v4                                                   |
| userId         | Must be a valid UUID v4                                                   |
| fileType       | Alphanumeric with optional hyphens, underscores, and single extension     |
| pathType       | Alphanumeric with optional hyphens, underscores, slashes, and extension   |

### Invalid Inputs (Will Throw)

```typescript
// Path traversal attempts - BLOCKED
buildOrgPath({ organizationId: "uuid", fileType: "../secret.txt" }); // ❌
buildUserPath({ organizationId: "uuid", userId: "uuid", fileType: "../../etc/passwd" }); // ❌

// Invalid UUIDs - BLOCKED
buildOrgPath({ organizationId: "not-a-uuid", fileType: "logo.png" }); // ❌

// Empty values - BLOCKED
buildOrgPath({ organizationId: "", fileType: "logo.png" }); // ❌
```

### Error Handling

```typescript
import { buildUserPath, PathValidationError } from "@repo/storage";

try {
  buildUserPath({ organizationId: "invalid", userId: "uuid", fileType: "avatar.png" });
} catch (e) {
  if (e instanceof PathValidationError) {
    console.log(e.code);    // "INVALID_ORG_ID"
    console.log(e.message); // "Organization ID must be a valid UUID"
    console.log(e.details); // { provided: "invalid" }
  }
}
```

## Common Path Mistakes

| Mistake | Fix |
| ------- | --- |
| Not validating UUIDs before building paths | Always validate organizationId and userId are valid UUIDs before calling path builders |
| Using relative paths in storage references | Always use absolute paths from bucket root (e.g., `organizations/abc123/logo.png`) |
| Forgetting to set bucket in upload requests | Always specify bucket name from `config.storage.bucketNames` |
| Path traversal attempts (`../`) | Path builders automatically block `../` patterns - trust the validation |
| Hardcoding organization IDs | Always get organizationId from session context, never hardcode |

## Storage Provider Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                      @repo/storage                          │
├─────────────────────────────────────────────────────────────┤
│  Path Utilities     │  Validation   │  MIME Types           │
│  - buildOrgPath()   │  - createUploadValidator()            │
│  - buildUserPath()  │  - ValidationResult                   │
│  - buildSystemPath()│  - UploadValidatorOptions             │
│  - parsePath()      │                                       │
├─────────────────────────────────────────────────────────────┤
│                   StorageProvider Interface                 │
│  - upload()         - getSignedUploadUrl()                  │
│  - delete()         - getSignedDownloadUrl()                │
│  - exists()                                                 │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Supabase       │  S3/R2          │  Local (dev)            │
│  Provider       │  Provider       │  Provider               │
└─────────────────┴─────────────────┴─────────────────────────┘
```

### Provider Auto-Detection

The system auto-detects which provider to use:

1. If `SUPABASE_STORAGE_PROVIDER=true` → Use Supabase
2. If `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set → Use Supabase
3. If S3 credentials are configured → Use S3
4. Otherwise → Fail with error

Supabase is preferred when available because it has native CORS support for browser uploads.

## Implementation Patterns

### Creating an Upload Endpoint

```typescript
// packages/api/modules/{module}/procedures/create-upload-url.ts
import { ORPCError } from "@orpc/server";
import { config } from "@repo/config";
import {
  buildUserPath,
  getDefaultSupabaseProvider,
  getSignedUploadUrl,
  shouldUseSupabaseStorage,
} from "@repo/storage";
import { protectedProcedure } from "../../../orpc/procedures";

export const createUploadUrl = protectedProcedure
  .route({
    method: "POST",
    path: "/module/upload-url",
    tags: ["Module"],
    summary: "Create upload URL",
  })
  .handler(async ({ context: { user, session } }) => {
    // 1. Require active organization
    const organizationId = session.activeOrganizationId;
    if (!organizationId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "An active organization is required",
      });
    }

    // 2. Build the path using path utilities
    const path = buildUserPath({
      organizationId,
      userId: user.id,
      fileType: "file.png",
    });

    const bucket = config.storage.bucketNames.avatars;

    // 3. Delete existing file if needed
    if (shouldUseSupabaseStorage()) {
      const provider = getDefaultSupabaseProvider();
      try {
        const exists = await provider.exists(path, bucket);
        if (exists) {
          await provider.delete(path, bucket);
        }
      } catch {
        // Ignore - file may not exist
      }
    }

    // 4. Generate signed upload URL
    const signedUploadUrl = await getSignedUploadUrl(path, { bucket });

    // 5. Return URL and path
    return { signedUploadUrl, path };
  });
```

### Frontend Upload Component Pattern

```tsx
// Simplified pattern - see UserAvatarUpload.tsx for full example
const uploadFile = async (file: File) => {
  // 1. Get signed upload URL from API
  const { signedUploadUrl, path } = await api.createUploadUrl();

  // 2. Upload directly to storage
  await fetch(signedUploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
  });

  // 3. Update database with new path
  await api.updateProfile({ image: path });
};
```

## File Upload + Job Processing Pattern

When processing files asynchronously via Inngest background jobs, upload the file to storage first, then pass the file path reference to the job.

For complete details on the upload-then-queue pattern, including architecture flow, endpoint implementation, and cleanup considerations, see [job-upload-patterns.md](job-upload-patterns.md).

## Bucket Configuration

Buckets are configured in `config/index.ts`:

```typescript
storage: {
  bucketNames: {
    avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
    contracts: process.env.NEXT_PUBLIC_CONTRACTS_BUCKET_NAME ?? "contracts",
    audio: process.env.NEXT_PUBLIC_AUDIO_BUCKET_NAME ?? "audio",
  },
}
```

## Image Proxy Route

Images are served through the proxy at `/image-proxy/[bucket]/[...path]`:

```text
Stored path:  organizations/abc123/users/user456/avatar.png
Access URL:   /image-proxy/avatars/organizations/abc123/users/user456/avatar.png
```

The proxy:

1. Extracts bucket and file path from URL
2. Generates a signed download URL
3. Redirects with 1-hour cache control

## Path Parsing Utilities

For debugging and migration:

```typescript
import { parsePath, isLegacyPath, isMultiTenantPath } from "@repo/storage";

// Parse any path
const parsed = parsePath("organizations/abc/users/user123/avatar.png");
// → { type: "user", organizationId: "abc", userId: "user123", fileType: "avatar.png" }

// Check if path needs migration
isLegacyPath("users/user123/avatar.png"); // true
isMultiTenantPath("organizations/abc/logo.png"); // true
```

## Related Files

| File | Purpose |
| ---- | ------- |
| `packages/storage/paths.ts` | Path builder utilities and validation |
| `packages/storage/paths.test.ts` | Unit tests for path builders |
| `packages/storage/types.ts` | StorageProvider interface and types |
| `packages/storage/provider/supabase/` | Supabase storage implementation |
| `packages/storage/provider/s3/` | S3-compatible storage implementation |
| `config/index.ts` | Bucket name configuration |
| `apps/web/app/image-proxy/[...path]/route.ts` | Image serving proxy |

## Related Skills

- **sub-app**: Implementing file uploads in new tools
- **architecture**: Understanding the storage layer in the overall architecture (includes Inngest job patterns)
- **better-auth**: User authentication for multi-tenant path isolation
- **application-environments**: Supabase storage configuration
- **debugging**: Troubleshooting file upload and storage issues
