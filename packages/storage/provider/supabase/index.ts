import type { Readable } from "node:stream";
import { logger } from "@repo/logs";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
	SignedUrlOptions,
	StorageProvider,
	SupabaseProviderConfig,
	UploadOptions,
	UploadResult,
} from "../../types";

// ============================================================================
// Supabase Storage Provider Implementation
// ============================================================================

/**
 * Supabase storage provider with native CORS support.
 *
 * This provider uses Supabase's native Storage API (`/storage/v1/object/...`)
 * which includes proper CORS headers for browser uploads. Unlike the S3
 * protocol endpoint (`/storage/v1/s3/...`), this API works correctly for
 * browser-based file uploads.
 *
 * @example
 * ```typescript
 * const provider = new SupabaseStorageProvider({
 *   supabaseUrl: "https://your-project.supabase.co",
 *   supabaseServiceRoleKey: "your-service-role-key"
 * });
 *
 * // Upload a file directly (server-side)
 * const result = await provider.upload("avatars/user.png", imageBuffer, {
 *   bucket: "uploads",
 *   contentType: "image/png"
 * });
 *
 * // Generate presigned URLs for client uploads (with CORS support)
 * const { uploadUrl, token, path } = await provider.getSignedUploadUrl("avatars/new.png", {
 *   bucket: "uploads",
 *   contentType: "image/png",
 *   expiresIn: 300
 * });
 * ```
 *
 * @see https://supabase.com/docs/reference/javascript/storage-from-createsigneduploadurl
 */
export class SupabaseStorageProvider implements StorageProvider {
	readonly name = "supabase";
	private client: SupabaseClient;

	constructor(config: Omit<SupabaseProviderConfig, "type">) {
		this.client = createClient(
			config.supabaseUrl,
			config.supabaseServiceRoleKey,
			{
				auth: {
					// Use service role key, no session persistence needed
					persistSession: false,
					autoRefreshToken: false,
				},
			},
		);
	}

	async upload(
		key: string,
		data: Buffer | Readable,
		options: UploadOptions,
	): Promise<UploadResult> {
		const body = Buffer.isBuffer(data) ? data : await streamToBuffer(data);

		try {
			const { data: uploadData, error } = await this.client.storage
				.from(options.bucket)
				.upload(key, body, {
					contentType:
						options.contentType ?? "application/octet-stream",
					upsert: true,
					// Custom metadata is not directly supported in the same way as S3
					// but we can include it in the duplex option if needed
				});

			if (error) {
				throw error;
			}

			return {
				key: uploadData.path,
				bucket: options.bucket,
				size: body.length,
				// Supabase doesn't return ETag in the same way
				etag: uploadData.id,
			};
		} catch (e) {
			logger.error(e);
			throw new Error(`Could not upload file to ${key}`);
		}
	}

	async getSignedUploadUrl(
		key: string,
		options: SignedUrlOptions,
	): Promise<string> {
		try {
			const { data, error } = await this.client.storage
				.from(options.bucket)
				.createSignedUploadUrl(key);

			if (error) {
				throw error;
			}

			// Return the signed URL which includes the token
			// The client will PUT to this URL directly
			return data.signedUrl;
		} catch (e) {
			logger.error(e);
			throw new Error("Could not get signed upload url");
		}
	}

	async getSignedDownloadUrl(
		key: string,
		options: SignedUrlOptions,
	): Promise<string> {
		try {
			const expiresIn = options.expiresIn ?? 60;

			const { data, error } = await this.client.storage
				.from(options.bucket)
				.createSignedUrl(key, expiresIn);

			if (error) {
				throw error;
			}

			return data.signedUrl;
		} catch (e) {
			logger.error(e);
			throw new Error("Could not get signed url");
		}
	}

	async delete(key: string, bucket: string): Promise<void> {
		try {
			const { error } = await this.client.storage
				.from(bucket)
				.remove([key]);

			if (error) {
				throw error;
			}
		} catch (e) {
			logger.error(e);
			throw new Error(`Could not delete file ${key}`);
		}
	}

	async exists(key: string, bucket: string): Promise<boolean> {
		try {
			// Supabase doesn't have a direct "exists" method
			// We use download with no-op to check existence via metadata request
			// But a simpler approach is to list the file path
			const pathParts = key.split("/");
			const fileName = pathParts.pop() ?? key;
			const folderPath = pathParts.join("/");

			const { data, error } = await this.client.storage
				.from(bucket)
				.list(folderPath || undefined, {
					limit: 1,
					search: fileName,
				});

			if (error) {
				throw error;
			}

			// Check if the file exists in the listing
			return data.some((file) => file.name === fileName);
		} catch (e) {
			// Storage errors usually mean the file doesn't exist
			// or there's a permissions issue
			if (
				(e as { message?: string }).message?.includes("not found") ||
				(e as { statusCode?: number }).statusCode === 404
			) {
				return false;
			}
			logger.error(e);
			throw new Error(`Could not check if file ${key} exists`);
		}
	}
}

// ============================================================================
// Helper functions
// ============================================================================

/**
 * Convert a readable stream to a Buffer.
 */
async function streamToBuffer(stream: Readable): Promise<Buffer> {
	const chunks: Buffer[] = [];
	for await (const chunk of stream) {
		chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
	}
	return Buffer.concat(chunks);
}

// ============================================================================
// Lazy singleton for convenience
// ============================================================================

let defaultProvider: SupabaseStorageProvider | null = null;

/**
 * Get or create the default Supabase provider using environment variables.
 */
export function getDefaultSupabaseProvider(): SupabaseStorageProvider {
	if (defaultProvider) {
		return defaultProvider;
	}

	const supabaseUrl = process.env.SUPABASE_URL;
	if (!supabaseUrl) {
		throw new Error("Missing env variable SUPABASE_URL");
	}

	const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!supabaseServiceRoleKey) {
		throw new Error("Missing env variable SUPABASE_SERVICE_ROLE_KEY");
	}

	defaultProvider = new SupabaseStorageProvider({
		supabaseUrl,
		supabaseServiceRoleKey,
	});

	return defaultProvider;
}

// ============================================================================
// Factory helper for auto-detection
// ============================================================================

/**
 * Check if Supabase storage provider should be used.
 * Returns true when SUPABASE_STORAGE_PROVIDER is set to "true"
 * or when Supabase credentials are available.
 *
 * Supabase is preferred over S3 when both are configured because:
 * - Supabase's native Storage API has built-in CORS support
 * - S3-compatible endpoints in Supabase don't support CORS configuration
 * - This is critical for browser-based uploads in preview environments
 */
export function shouldUseSupabaseStorage(): boolean {
	// Explicit opt-in takes precedence
	if (process.env.SUPABASE_STORAGE_PROVIDER === "true") {
		return true;
	}

	// Explicit opt-out
	if (process.env.SUPABASE_STORAGE_PROVIDER === "false") {
		return false;
	}

	// Auto-detect: prefer Supabase storage when credentials are available
	// This ensures CORS-friendly uploads work in all environments
	const hasSupabaseCredentials =
		!!process.env.SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY;

	return hasSupabaseCredentials;
}

/**
 * Create a Supabase storage provider from environment variables.
 */
export function createSupabaseStorageProvider(): SupabaseStorageProvider {
	return getDefaultSupabaseProvider();
}
