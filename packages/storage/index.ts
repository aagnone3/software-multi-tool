import { LocalStorageProvider } from "./provider/local";
import { S3StorageProvider } from "./provider/s3";
import type { StorageProvider, StorageProviderConfig } from "./types";

// ============================================================================
// Re-exports for convenience
// ============================================================================

export * from "./provider";
export * from "./types";
export * from "./validation";

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a storage provider from configuration.
 *
 * This is the main entry point for creating storage providers.
 * Supports S3-compatible providers and local filesystem storage.
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
 *
 * @example
 * ```typescript
 * // Create a local filesystem provider (for development)
 * const local = createStorageProvider({
 *   type: "local",
 *   baseDir: "/tmp/uploads",
 *   baseUrl: "http://localhost:3500"
 * });
 * ```
 */
export function createStorageProvider(
	config: StorageProviderConfig,
): StorageProvider {
	if (config.type === "s3") {
		const { type: _, ...s3Config } = config;
		return new S3StorageProvider(s3Config);
	}

	if (config.type === "local") {
		const { type: _, ...localConfig } = config;
		return new LocalStorageProvider(localConfig);
	}

	// Exhaustive check - this should never be reached
	throw new Error(
		`Unknown storage provider type: ${(config as { type: string }).type}`,
	);
}
