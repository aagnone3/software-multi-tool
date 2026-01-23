---
name: storage
description: Use this skill when implementing file uploads (avatars, logos, documents), adding new upload types, working with storage providers (Supabase, S3), or debugging file access issues. Covers multi-tenant path conventions and the @repo/storage package.
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

When processing files asynchronously via a job queue (e.g., pg-boss), **always upload the file to storage first**, then pass the file path reference to the job. This pattern:

- Avoids passing large base64-encoded data through the job queue
- Allows the job processor to fetch the file when ready
- Enables file reprocessing without re-uploading
- Maintains proper multi-tenant isolation through storage paths

### Architecture Flow

```text
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Client    │    │   API       │    │   Storage   │    │   Job       │
│   Browser   │    │   Server    │    │   (S3/etc)  │    │   Queue     │
└──────┬──────┘    └──────┬──────┘    └──────┬──────┘    └──────┬──────┘
       │                  │                  │                  │
       │ 1. Request       │                  │                  │
       │    upload URL    │                  │                  │
       ├─────────────────>│                  │                  │
       │                  │                  │                  │
       │ 2. Signed URL    │                  │                  │
       │    + file path   │                  │                  │
       │<─────────────────┤                  │                  │
       │                  │                  │                  │
       │ 3. Upload file   │                  │                  │
       │    directly      │                  │                  │
       ├──────────────────┼─────────────────>│                  │
       │                  │                  │                  │
       │ 4. Create job    │                  │                  │
       │    with filePath │                  │                  │
       ├─────────────────>│                  │                  │
       │                  │                  │                  │
       │                  │ 5. Queue job     │                  │
       │                  │    (filePath)    │                  │
       │                  ├──────────────────┼─────────────────>│
       │                  │                  │                  │
       │                  │                  │ 6. Processor     │
       │                  │                  │    fetches file  │
       │                  │                  │<─────────────────┤
       │                  │                  │                  │
```

### Upload URL Endpoint (with unique filename)

For job processing, generate unique filenames to support multiple uploads:

```typescript
// packages/api/modules/{tool}/procedures/create-{tool}-upload-url.ts
import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { z } from "zod";
import { config } from "@repo/config";
import { buildUserPath, getSignedUploadUrl } from "@repo/storage";
import { protectedProcedure } from "../../../orpc/procedures";

export const createInvoiceUploadUrl = protectedProcedure
  .route({
    method: "POST",
    path: "/invoice-processor/upload-url",
    tags: ["Invoice Processor"],
    summary: "Create upload URL for invoice document",
  })
  .input(z.object({
    filename: z.string().min(1),
    mimeType: z.string().min(1),
  }))
  .handler(async ({ input, context: { user, session } }) => {
    const organizationId = session.activeOrganizationId;
    if (!organizationId) {
      throw new ORPCError("BAD_REQUEST", {
        message: "An active organization is required",
      });
    }

    // Generate unique filename to support multiple uploads
    const ext = input.filename.split(".").pop() ?? "bin";
    const uniqueFilename = `${randomUUID()}.${ext}`;

    // Path: organizations/{orgId}/users/{userId}/invoices/{uuid}.pdf
    const path = buildUserPath({
      organizationId,
      userId: user.id,
      fileType: `invoices/${uniqueFilename}`,
    });

    const bucket = config.storage.bucketNames.invoices;
    const signedUploadUrl = await getSignedUploadUrl(path, { bucket });

    return { signedUploadUrl, path, bucket };
  });
```

### Frontend: Upload Then Create Job

```tsx
const processInvoice = async (file: File) => {
  // 1. Get signed upload URL
  const { signedUploadUrl, path, bucket } = await api.invoiceProcessor
    .uploadUrl({ filename: file.name, mimeType: file.type });

  // 2. Upload file directly to storage
  const uploadResponse = await fetch(signedUploadUrl, {
    method: "PUT",
    body: file,
    headers: {
      "Content-Type": file.type,
      "x-upsert": "true",
    },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file");
  }

  // 3. Create job with file path reference (NOT base64 data)
  const { job } = await api.jobs.create({
    toolSlug: "invoice-processor",
    input: {
      filePath: path,        // Storage path reference
      bucket: bucket,        // Which bucket the file is in
      mimeType: file.type,   // Original MIME type for processing
      outputFormat: "json",
    },
  });

  return job;
};
```

### Job Processor: Fetch From Storage

```typescript
// packages/api/modules/{tool}/lib/processor.ts
import {
  getDefaultSupabaseProvider,
  shouldUseSupabaseStorage,
  getSignedUrl,
} from "@repo/storage";

async function fetchFileFromStorage(
  filePath: string,
  bucket: string,
): Promise<Buffer> {
  if (shouldUseSupabaseStorage()) {
    const provider = getDefaultSupabaseProvider();
    // Use download() method if available, or fetch via signed URL
    const signedUrl = await provider.getSignedDownloadUrl(filePath, {
      bucket,
      expiresIn: 300, // 5 minutes
    });
    const response = await fetch(signedUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    return Buffer.from(await response.arrayBuffer());
  }

  // Fallback to legacy signed URL function
  const signedUrl = await getSignedUrl(filePath, { bucket });
  const response = await fetch(signedUrl);
  return Buffer.from(await response.arrayBuffer());
}

// In your processor:
export async function processInvoice(input: InvoiceProcessorInput) {
  // If file path provided, fetch from storage
  if (input.filePath && input.bucket) {
    const fileBuffer = await fetchFileFromStorage(input.filePath, input.bucket);
    const extractionResult = await extractTextFromInvoiceDocument(
      fileBuffer,
      input.mimeType,
    );
    // ... process extracted text
  }

  // Fallback: direct text input
  if (input.invoiceText) {
    // ... process text directly
  }
}
```

### Key Differences from Direct Upload Pattern

| Aspect | Direct Upload (Avatar) | Job Processing (Invoice) |
| ------ | ---------------------- | ------------------------ |
| Filename | Fixed (e.g., `avatar.png`) | Unique UUID per upload |
| Job Data | N/A | `{ filePath, bucket, mimeType }` |
| Processing | Immediate | Async via job queue |
| File Lifecycle | Overwrite on re-upload | New file each upload |

### Cleanup Considerations

For job processing uploads, consider implementing cleanup for:

- **Processed files**: Delete after successful processing (optional)
- **Failed jobs**: Keep for debugging, delete after retention period
- **Orphaned files**: Files from jobs that were never created

```typescript
// Optional: Delete file after successful processing
await provider.delete(input.filePath, input.bucket);
```

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

## Environment Variables

| Variable | Purpose | Required |
| -------- | ------- | -------- |
| `SUPABASE_URL` | Supabase project URL | For Supabase storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service key | For Supabase storage |
| `NEXT_PUBLIC_AVATARS_BUCKET_NAME` | Avatar bucket name | No (defaults to "avatars") |
