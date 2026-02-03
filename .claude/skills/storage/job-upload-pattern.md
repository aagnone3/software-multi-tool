# File Upload + Job Processing Pattern

When processing files asynchronously via Inngest background jobs, **always upload the file to storage first**, then pass the file path reference to the job. This pattern:

- Avoids passing large base64-encoded data through the job queue
- Allows the job processor to fetch the file when ready
- Enables file reprocessing without re-uploading
- Maintains proper multi-tenant isolation through storage paths

## Architecture Flow

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

## Upload URL Endpoint (with unique filename)

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

## Frontend: Upload Then Create Job

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

## Job Processor: Fetch From Storage

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

## Key Differences from Direct Upload Pattern

| Aspect | Direct Upload (Avatar) | Job Processing (Invoice) |
| ------ | ---------------------- | ------------------------ |
| Filename | Fixed (e.g., `avatar.png`) | Unique UUID per upload |
| Job Data | N/A | `{ filePath, bucket, mimeType }` |
| Processing | Immediate | Async via job queue |
| File Lifecycle | Overwrite on re-upload | New file each upload |

## Cleanup Considerations

For job processing uploads, consider implementing cleanup for:

- **Processed files**: Delete after successful processing (optional)
- **Failed jobs**: Keep for debugging, delete after retention period
- **Orphaned files**: Files from jobs that were never created

```typescript
// Optional: Delete file after successful processing
await provider.delete(input.filePath, input.bucket);
```
