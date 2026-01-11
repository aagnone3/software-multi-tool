import type { Readable } from "node:stream";

// ============================================================================
// New pluggable provider types
// ============================================================================

/**
 * Options for uploading a file to storage.
 */
export interface UploadOptions {
	/**
	 * The MIME type of the file being uploaded.
	 * @default "application/octet-stream"
	 */
	contentType?: string;

	/**
	 * Custom metadata to associate with the file.
	 */
	metadata?: Record<string, string>;

	/**
	 * The bucket/container to upload to.
	 */
	bucket: string;
}

/**
 * Options for generating signed URLs.
 */
export interface SignedUrlOptions {
	/**
	 * The bucket/container where the file is stored.
	 */
	bucket: string;

	/**
	 * The MIME type for upload URLs. Only used for upload URLs.
	 * @default "application/octet-stream"
	 */
	contentType?: string;

	/**
	 * How long the signed URL should be valid, in seconds.
	 * @default 60
	 */
	expiresIn?: number;
}

/**
 * Result of an upload operation.
 */
export interface UploadResult {
	/**
	 * The key/path where the file was stored.
	 */
	key: string;

	/**
	 * The bucket/container where the file was stored.
	 */
	bucket: string;

	/**
	 * The size of the uploaded file in bytes (if available).
	 */
	size?: number;

	/**
	 * The ETag of the uploaded file (if available).
	 */
	etag?: string;
}

/**
 * Core interface that all storage providers must implement.
 * This enables pluggable storage backends (S3, R2, local filesystem, etc.).
 */
export interface StorageProvider {
	/**
	 * The name of this provider (e.g., "s3", "local", "r2").
	 */
	readonly name: string;

	/**
	 * Upload a file directly to storage.
	 *
	 * @param key - The key/path to store the file at
	 * @param data - The file data as a Buffer or readable stream
	 * @param options - Upload options including bucket and content type
	 * @returns Promise resolving to upload result with key and metadata
	 *
	 * @example
	 * ```typescript
	 * const result = await provider.upload("avatars/user.png", imageBuffer, {
	 *   bucket: "uploads",
	 *   contentType: "image/png"
	 * });
	 * ```
	 */
	upload(
		key: string,
		data: Buffer | Readable,
		options: UploadOptions,
	): Promise<UploadResult>;

	/**
	 * Generate a presigned URL for uploading a file.
	 * The client can use this URL to upload directly to storage.
	 *
	 * @param key - The key/path where the file will be stored
	 * @param options - Options including bucket, content type, and expiration
	 * @returns Promise resolving to a presigned upload URL
	 *
	 * @example
	 * ```typescript
	 * const uploadUrl = await provider.getSignedUploadUrl("avatars/user.png", {
	 *   bucket: "uploads",
	 *   contentType: "image/png",
	 *   expiresIn: 300
	 * });
	 * ```
	 */
	getSignedUploadUrl(key: string, options: SignedUrlOptions): Promise<string>;

	/**
	 * Generate a presigned URL for downloading a file.
	 *
	 * @param key - The key/path of the file to download
	 * @param options - Options including bucket and expiration
	 * @returns Promise resolving to a presigned download URL
	 *
	 * @example
	 * ```typescript
	 * const downloadUrl = await provider.getSignedDownloadUrl("avatars/user.png", {
	 *   bucket: "uploads",
	 *   expiresIn: 3600
	 * });
	 * ```
	 */
	getSignedDownloadUrl(
		key: string,
		options: SignedUrlOptions,
	): Promise<string>;

	/**
	 * Delete a file from storage.
	 *
	 * @param key - The key/path of the file to delete
	 * @param bucket - The bucket/container where the file is stored
	 * @returns Promise that resolves when the file is deleted
	 *
	 * @example
	 * ```typescript
	 * await provider.delete("avatars/user.png", "uploads");
	 * ```
	 */
	delete(key: string, bucket: string): Promise<void>;

	/**
	 * Check if a file exists in storage.
	 *
	 * @param key - The key/path of the file to check
	 * @param bucket - The bucket/container to check in
	 * @returns Promise resolving to true if the file exists, false otherwise
	 *
	 * @example
	 * ```typescript
	 * if (await provider.exists("avatars/user.png", "uploads")) {
	 *   console.log("File exists");
	 * }
	 * ```
	 */
	exists(key: string, bucket: string): Promise<boolean>;
}

// ============================================================================
// Provider configuration types
// ============================================================================

/**
 * Configuration for creating an S3-compatible storage provider.
 */
export interface S3ProviderConfig {
	type: "s3";
	/**
	 * S3 endpoint URL. Required for S3-compatible services (R2, MinIO).
	 * For AWS S3, this can be omitted.
	 */
	endpoint?: string;
	/**
	 * AWS region.
	 * @default "auto"
	 */
	region?: string;
	/**
	 * Access key ID for authentication.
	 */
	accessKeyId: string;
	/**
	 * Secret access key for authentication.
	 */
	secretAccessKey: string;
	/**
	 * Use path-style URLs (e.g., endpoint/bucket/key instead of bucket.endpoint/key).
	 * Required for some S3-compatible services.
	 * @default true
	 */
	forcePathStyle?: boolean;
}

/**
 * Union type of all supported provider configurations.
 * Add new provider config types here as they're implemented.
 */
export type StorageProviderConfig = S3ProviderConfig;

// ============================================================================
// Legacy type aliases for backwards compatibility
// These match the original function signatures used throughout the codebase
// ============================================================================

/**
 * @deprecated Use StorageProvider.getSignedUploadUrl instead
 */
export type GetSignedUploadUrlHandler = (
	path: string,
	options: {
		bucket: string;
	},
) => Promise<string>;

/**
 * @deprecated Use StorageProvider.getSignedDownloadUrl instead
 * Note: Original had typo "Hander" - preserved for backwards compatibility
 */
export type GetSignedUrlHander = (
	path: string,
	options: {
		bucket: string;
		expiresIn?: number;
	},
) => Promise<string>;

/**
 * @deprecated Use StorageProvider interface instead
 */
export type CreateBucketHandler = (
	name: string,
	options?: {
		public?: boolean;
	},
) => Promise<void>;
