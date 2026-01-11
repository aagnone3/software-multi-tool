import { createHash, createHmac } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { Readable } from "node:stream";
import { logger } from "@repo/logs";
import type {
	LocalProviderConfig,
	SignedUrlOptions,
	StorageProvider,
	UploadOptions,
	UploadResult,
} from "../../types";

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_BASE_DIR = "/tmp/software-multi-tool-uploads";
const DEFAULT_BASE_URL = "http://localhost:3500";
const DEFAULT_SIGNING_SECRET = "dev-secret";
const DEFAULT_EXPIRES_IN = 60; // seconds

// ============================================================================
// Local Storage Provider Implementation
// ============================================================================

/**
 * Local filesystem storage provider for development and testing.
 * Stores files on the local filesystem and generates signed URLs
 * that point to local API endpoints.
 *
 * **IMPORTANT: This provider is for development only. Do not use in production.**
 *
 * @example
 * ```typescript
 * const provider = new LocalStorageProvider({
 *   baseDir: "/tmp/uploads",
 *   baseUrl: "http://localhost:3500",
 *   signingSecret: "my-dev-secret"
 * });
 *
 * // Upload a file
 * const result = await provider.upload("avatars/user.png", imageBuffer, {
 *   bucket: "uploads",
 *   contentType: "image/png"
 * });
 *
 * // Generate presigned URLs
 * const uploadUrl = await provider.getSignedUploadUrl("avatars/new.png", {
 *   bucket: "uploads",
 *   contentType: "image/png",
 *   expiresIn: 300
 * });
 * ```
 */
export class LocalStorageProvider implements StorageProvider {
	readonly name = "local";
	private baseDir: string;
	private baseUrl: string;
	private signingSecret: string;

	constructor(config: Omit<LocalProviderConfig, "type">) {
		this.baseDir = config.baseDir ?? DEFAULT_BASE_DIR;
		this.baseUrl = config.baseUrl ?? DEFAULT_BASE_URL;
		this.signingSecret = config.signingSecret ?? DEFAULT_SIGNING_SECRET;
	}

	/**
	 * Get the full filesystem path for a file.
	 */
	private getFilePath(bucket: string, key: string): string {
		// Sanitize the key to prevent directory traversal attacks
		const sanitizedKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
		const sanitizedBucket = bucket.replace(/\.\./g, "").replace(/^\/+/, "");
		return join(this.baseDir, sanitizedBucket, sanitizedKey);
	}

	/**
	 * Generate a signed token for URL authentication.
	 */
	private generateToken(
		bucket: string,
		key: string,
		expiresAt: number,
		operation: "upload" | "download",
	): string {
		const data = `${operation}:${bucket}:${key}:${expiresAt}`;
		return createHmac("sha256", this.signingSecret)
			.update(data)
			.digest("hex")
			.substring(0, 32);
	}

	/**
	 * Verify a signed token.
	 */
	verifyToken(
		bucket: string,
		key: string,
		expiresAt: number,
		operation: "upload" | "download",
		token: string,
	): boolean {
		const expectedToken = this.generateToken(
			bucket,
			key,
			expiresAt,
			operation,
		);
		return token === expectedToken && Date.now() < expiresAt;
	}

	async upload(
		key: string,
		data: Buffer | Readable,
		options: UploadOptions,
	): Promise<UploadResult> {
		const filePath = this.getFilePath(options.bucket, key);
		const buffer = Buffer.isBuffer(data)
			? data
			: await streamToBuffer(data);

		try {
			// Create directory if it doesn't exist
			await mkdir(dirname(filePath), { recursive: true });

			// Write file to disk
			await writeFile(filePath, buffer);

			// Also store metadata in a sidecar file
			const metadataPath = `${filePath}.meta.json`;
			const metadata = {
				contentType:
					options.contentType ?? "application/octet-stream",
				metadata: options.metadata ?? {},
				size: buffer.length,
				etag: createHash("md5").update(buffer).digest("hex"),
				uploadedAt: new Date().toISOString(),
			};
			await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

			return {
				key,
				bucket: options.bucket,
				size: buffer.length,
				etag: `"${metadata.etag}"`,
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
		const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;
		const expiresAt = Date.now() + expiresIn * 1000;
		const token = this.generateToken(
			options.bucket,
			key,
			expiresAt,
			"upload",
		);

		const params = new URLSearchParams({
			bucket: options.bucket,
			key,
			expires: expiresAt.toString(),
			token,
			contentType: options.contentType ?? "application/octet-stream",
		});

		return `${this.baseUrl}/api/local-storage/upload?${params.toString()}`;
	}

	async getSignedDownloadUrl(
		key: string,
		options: SignedUrlOptions,
	): Promise<string> {
		const expiresIn = options.expiresIn ?? DEFAULT_EXPIRES_IN;
		const expiresAt = Date.now() + expiresIn * 1000;
		const token = this.generateToken(
			options.bucket,
			key,
			expiresAt,
			"download",
		);

		const params = new URLSearchParams({
			bucket: options.bucket,
			key,
			expires: expiresAt.toString(),
			token,
		});

		return `${this.baseUrl}/api/local-storage/download?${params.toString()}`;
	}

	async delete(key: string, bucket: string): Promise<void> {
		const filePath = this.getFilePath(bucket, key);
		const metadataPath = `${filePath}.meta.json`;

		try {
			await rm(filePath, { force: true });
			await rm(metadataPath, { force: true });
		} catch (e) {
			logger.error(e);
			throw new Error(`Could not delete file ${key}`);
		}
	}

	async exists(key: string, bucket: string): Promise<boolean> {
		const filePath = this.getFilePath(bucket, key);

		try {
			await stat(filePath);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Read a file from local storage. Used by API routes.
	 */
	async readFile(
		key: string,
		bucket: string,
	): Promise<{ data: Buffer; contentType: string }> {
		const filePath = this.getFilePath(bucket, key);
		const metadataPath = `${filePath}.meta.json`;

		try {
			const data = await readFile(filePath);
			let contentType = "application/octet-stream";

			try {
				const metadataJson = await readFile(metadataPath, "utf-8");
				const metadata = JSON.parse(metadataJson);
				contentType = metadata.contentType ?? contentType;
			} catch {
				// Metadata file doesn't exist, use default content type
			}

			return { data, contentType };
		} catch (e) {
			logger.error(e);
			throw new Error(`Could not read file ${key}`);
		}
	}

	/**
	 * Write a file to local storage (used by upload API route).
	 */
	async writeFile(
		key: string,
		bucket: string,
		data: Buffer,
		contentType: string,
	): Promise<void> {
		await this.upload(key, data, { bucket, contentType });
	}

	/**
	 * Get the base directory for this provider.
	 */
	getBaseDir(): string {
		return this.baseDir;
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
// Factory helper for auto-detection
// ============================================================================

/**
 * Check if local storage provider should be used.
 * Returns true when:
 * - NODE_ENV is "development" AND
 * - No S3 credentials are configured
 * - OR LOCAL_STORAGE_PROVIDER is explicitly set to "true"
 */
export function shouldUseLocalStorage(): boolean {
	// Explicit opt-in takes precedence
	if (process.env.LOCAL_STORAGE_PROVIDER === "true") {
		return true;
	}

	// Explicit opt-out
	if (process.env.LOCAL_STORAGE_PROVIDER === "false") {
		return false;
	}

	// Auto-detect: use local storage in development without S3 credentials
	const isDevelopment = process.env.NODE_ENV === "development";
	const hasS3Credentials =
		!!process.env.S3_ENDPOINT &&
		!!process.env.S3_ACCESS_KEY_ID &&
		!!process.env.S3_SECRET_ACCESS_KEY;

	return isDevelopment && !hasS3Credentials;
}

/**
 * Create a local storage provider from environment variables.
 */
export function createLocalStorageProvider(): LocalStorageProvider {
	return new LocalStorageProvider({
		baseDir: process.env.LOCAL_STORAGE_BASE_DIR ?? DEFAULT_BASE_DIR,
		baseUrl:
			process.env.LOCAL_STORAGE_BASE_URL ??
			process.env.NEXT_PUBLIC_SITE_URL ??
			DEFAULT_BASE_URL,
		signingSecret:
			process.env.LOCAL_STORAGE_SIGNING_SECRET ?? DEFAULT_SIGNING_SECRET,
	});
}
