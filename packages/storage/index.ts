import type { StorageProvider, StorageProviderConfig } from "./types";
import { S3StorageProvider } from "./provider/s3";

// ============================================================================
// Re-exports for convenience
// ============================================================================

export * from "./types";
export * from "./provider";

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a storage provider from configuration.
 *
 * This is the main entry point for creating storage providers.
 * Currently supports S3-compatible providers (S3, R2, MinIO).
 *
 * @param config - Provider configuration
 * @returns A configured storage provider instance
 *
 * @example
 * ```typescript
 * // Create an S3 provider
 * const storage = createStorageProvider({
 *   type: "s3",
 *   endpoint: "https://s3.amazonaws.com",
 *   region: "us-east-1",
 *   accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
 * });
 *
 * // Upload a file
 * const result = await storage.upload("uploads/file.pdf", buffer, {
 *   bucket: "my-bucket",
 *   contentType: "application/pdf"
 * });
 *
 * // Generate signed URLs
 * const downloadUrl = await storage.getSignedDownloadUrl("uploads/file.pdf", {
 *   bucket: "my-bucket",
 *   expiresIn: 3600
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a Cloudflare R2 provider
 * const r2 = createStorageProvider({
 *   type: "s3",
 *   endpoint: "https://account-id.r2.cloudflarestorage.com",
 *   accessKeyId: process.env.R2_ACCESS_KEY_ID!,
 *   secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!
 * });
 * ```
 */
export function createStorageProvider(
	config: StorageProviderConfig,
): StorageProvider {
	// Currently only supports S3 provider type
	// When adding new providers, add cases here
	if (config.type === "s3") {
		const { type: _, ...s3Config } = config;
		return new S3StorageProvider(s3Config);
	}

	// This will become reachable when more provider types are added
	throw new Error(`Unknown storage provider type: ${(config as { type: string }).type}`);
}
