import { randomUUID } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { config } from "@repo/config";
import { buildUserPath, getSignedUploadUrl } from "@repo/storage";
import { z } from "zod";
import { protectedProcedure } from "../../../orpc/procedures";

/**
 * Create a signed upload URL for invoice documents.
 *
 * This endpoint generates a unique path and signed URL for uploading
 * invoice files (PDF, images) directly to storage. The returned path
 * should be passed to the job processor after upload completes.
 */
export const createInvoiceUploadUrl = protectedProcedure
	.route({
		method: "POST",
		path: "/invoice-processor/upload-url",
		tags: ["Invoice Processor"],
		summary: "Create upload URL for invoice document",
		description:
			"Create a signed upload URL to upload an invoice document (PDF or image) to storage. Returns the upload URL and storage path to use when creating the processing job.",
	})
	.input(
		z.object({
			filename: z.string().min(1, "Filename is required"),
			mimeType: z.string().min(1, "MIME type is required"),
		}),
	)
	.handler(async ({ input, context: { user, session } }) => {
		// Require an active organization for multi-tenant path isolation
		const organizationId = session.activeOrganizationId;
		if (!organizationId) {
			throw new ORPCError("BAD_REQUEST", {
				message:
					"An active organization is required to upload an invoice",
			});
		}

		// Validate MIME type
		const allowedMimeTypes = [
			"application/pdf",
			"image/jpeg",
			"image/png",
			"image/tiff",
			"image/webp",
		];
		if (!allowedMimeTypes.includes(input.mimeType)) {
			throw new ORPCError("BAD_REQUEST", {
				message: `Unsupported file type: ${input.mimeType}. Allowed types: PDF, JPG, PNG, TIFF, WebP`,
			});
		}

		// Generate unique filename to support multiple uploads
		// Extract extension from filename or derive from MIME type
		const extFromFilename = input.filename.includes(".")
			? input.filename.split(".").pop()?.toLowerCase()
			: null;

		const extFromMime: Record<string, string> = {
			"application/pdf": "pdf",
			"image/jpeg": "jpg",
			"image/png": "png",
			"image/tiff": "tiff",
			"image/webp": "webp",
		};

		const ext = extFromFilename ?? extFromMime[input.mimeType] ?? "bin";
		const uniqueFilename = `${randomUUID()}.${ext}`;

		// Path structure: organizations/{orgId}/users/{userId}/invoices/{uuid}.{ext}
		// This ensures multi-tenant isolation and supports multiple uploads per user
		const path = buildUserPath({
			organizationId,
			userId: user.id,
			fileType: `invoices/${uniqueFilename}`,
		});

		const bucket = config.storage.bucketNames.invoices;

		// Generate signed upload URL
		const signedUploadUrl = await getSignedUploadUrl(path, { bucket });

		// Return the URL, path, and bucket so frontend knows where the file will be stored
		return {
			signedUploadUrl,
			path,
			bucket,
		};
	});
