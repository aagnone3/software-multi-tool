import type { Readable } from "node:stream";
import {
	DeleteObjectCommand,
	GetObjectCommand,
	HeadObjectCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl as getS3SignedUrl } from "@aws-sdk/s3-request-presigner";
import { logger } from "@repo/logs";
import type {
	GetSignedUploadUrlHandler,
	GetSignedUrlHander,
	S3ProviderConfig,
	SignedUrlOptions,
	StorageProvider,
	UploadOptions,
	UploadResult,
} from "../../types";

// ============================================================================
// S3 Storage Provider Implementation
// ============================================================================

/**
 * S3-compatible storage provider.
 * Works with AWS S3, Cloudflare R2, MinIO, and other S3-compatible services.
 *
 * @example
 * ```typescript
 * const provider = new S3StorageProvider({
 *   type: "s3",
 *   endpoint: "https://s3.amazonaws.com",
 *   region: "us-east-1",
 *   accessKeyId: "...",
 *   secretAccessKey: "..."
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
export class S3StorageProvider implements StorageProvider {
	readonly name = "s3";
	private client: S3Client;

	constructor(config: Omit<S3ProviderConfig, "type">) {
		this.client = new S3Client({
			endpoint: config.endpoint,
			region: config.region ?? "auto",
			forcePathStyle: config.forcePathStyle ?? true,
			credentials: {
				accessKeyId: config.accessKeyId,
				secretAccessKey: config.secretAccessKey,
			},
		});
	}

	async upload(
		key: string,
		data: Buffer | Readable,
		options: UploadOptions,
	): Promise<UploadResult> {
		const body = Buffer.isBuffer(data) ? data : await streamToBuffer(data);

		try {
			const response = await this.client.send(
				new PutObjectCommand({
					Bucket: options.bucket,
					Key: key,
					Body: body,
					ContentType:
						options.contentType ?? "application/octet-stream",
					Metadata: options.metadata,
				}),
			);

			return {
				key,
				bucket: options.bucket,
				size: body.length,
				etag: response.ETag,
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
			return await getS3SignedUrl(
				this.client,
				new PutObjectCommand({
					Bucket: options.bucket,
					Key: key,
					ContentType:
						options.contentType ?? "application/octet-stream",
				}),
				{
					expiresIn: options.expiresIn ?? 60,
				},
			);
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
			return await getS3SignedUrl(
				this.client,
				new GetObjectCommand({
					Bucket: options.bucket,
					Key: key,
				}),
				{
					expiresIn: options.expiresIn ?? 60,
				},
			);
		} catch (e) {
			logger.error(e);
			throw new Error("Could not get signed url");
		}
	}

	async delete(key: string, bucket: string): Promise<void> {
		try {
			await this.client.send(
				new DeleteObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
		} catch (e) {
			logger.error(e);
			throw new Error(`Could not delete file ${key}`);
		}
	}

	async exists(key: string, bucket: string): Promise<boolean> {
		try {
			await this.client.send(
				new HeadObjectCommand({
					Bucket: bucket,
					Key: key,
				}),
			);
			return true;
		} catch (e) {
			// HeadObject returns 404 NotFound if the object doesn't exist
			if ((e as { name?: string }).name === "NotFound") {
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
// Lazy singleton for backwards compatibility
// ============================================================================

let defaultProvider: S3StorageProvider | null = null;

/**
 * Get or create the default S3 provider using environment variables.
 * This is used internally for backwards-compatible function exports.
 */
function getDefaultProvider(): S3StorageProvider {
	if (defaultProvider) {
		return defaultProvider;
	}

	const endpoint = process.env.S3_ENDPOINT;
	if (!endpoint) {
		throw new Error("Missing env variable S3_ENDPOINT");
	}

	const accessKeyId = process.env.S3_ACCESS_KEY_ID;
	if (!accessKeyId) {
		throw new Error("Missing env variable S3_ACCESS_KEY_ID");
	}

	const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
	if (!secretAccessKey) {
		throw new Error("Missing env variable S3_SECRET_ACCESS_KEY");
	}

	defaultProvider = new S3StorageProvider({
		endpoint,
		region: process.env.S3_REGION ?? "auto",
		accessKeyId,
		secretAccessKey,
		forcePathStyle: true,
	});

	return defaultProvider;
}

// ============================================================================
// Backwards-compatible function exports
// These maintain the original API while using the new provider internally
// ============================================================================

/**
 * @deprecated Use S3StorageProvider.getSignedUploadUrl() instead.
 * This function is maintained for backwards compatibility.
 */
export const getSignedUploadUrl: GetSignedUploadUrlHandler = async (
	path,
	{ bucket },
) => {
	const provider = getDefaultProvider();
	// Note: Original implementation used hardcoded "image/jpeg"
	// Maintaining that behavior for backwards compatibility
	return provider.getSignedUploadUrl(path, {
		bucket,
		contentType: "image/jpeg",
		expiresIn: 60,
	});
};

/**
 * @deprecated Use S3StorageProvider.getSignedDownloadUrl() instead.
 * This function is maintained for backwards compatibility.
 */
export const getSignedUrl: GetSignedUrlHander = async (
	path,
	{ bucket, expiresIn },
) => {
	const provider = getDefaultProvider();
	return provider.getSignedDownloadUrl(path, {
		bucket,
		expiresIn,
	});
};
