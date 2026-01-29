import { config } from "@repo/config";
import { logger } from "@repo/logs";
import {
	getDefaultSupabaseProvider,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import type { AudioMetadata } from "../types";

/**
 * Result from uploading audio to storage.
 */
export interface AudioUploadResult {
	/** Storage path of the uploaded file */
	storagePath: string;
	/** Bucket name where the file was stored */
	bucket: string;
	/** Actual file size in bytes after decoding from base64 */
	size: number;
}

/**
 * Generates the storage key/path for an audio file in the Files bucket.
 * Format: organizations/{orgId}/files/{timestamp}-{filename}
 */
export function getAudioStorageKey(
	organizationId: string,
	filename: string,
): string {
	const timestamp = Date.now();
	const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
	return `organizations/${organizationId}/files/${timestamp}-${sanitizedFilename}`;
}

/**
 * Upload audio file to the files bucket and return the storage details.
 *
 * @param organizationId - Organization ID for the storage path
 * @param base64Content - Base64-encoded audio content
 * @param metadata - Audio file metadata
 * @returns Storage details including path, bucket, and size
 */
export async function uploadAudioToStorage(
	organizationId: string,
	base64Content: string,
	metadata: AudioMetadata,
): Promise<AudioUploadResult> {
	// Only use Supabase storage if configured
	if (!shouldUseSupabaseStorage()) {
		logger.warn(
			"[AudioStorage] Supabase storage not configured, skipping upload",
		);
		throw new Error("Storage not configured");
	}

	const provider = getDefaultSupabaseProvider();
	const bucket = config.storage.bucketNames.files;
	const storagePath = getAudioStorageKey(organizationId, metadata.filename);

	// Convert base64 to buffer
	// Handle data URL format (e.g., "data:audio/wav;base64,...")
	const base64Data = base64Content.includes(",")
		? base64Content.split(",")[1]
		: base64Content;
	const buffer = Buffer.from(base64Data, "base64");

	logger.info(`[AudioStorage] Uploading audio file: ${storagePath}`, {
		organizationId,
		filename: metadata.filename,
		mimeType: metadata.mimeType,
		size: buffer.length,
		bucket,
	});

	await provider.upload(storagePath, buffer, {
		bucket,
		contentType: metadata.mimeType,
	});

	logger.info(`[AudioStorage] Upload complete: ${storagePath} (${bucket})`);

	return {
		storagePath,
		bucket,
		size: buffer.length,
	};
}

/**
 * Get a signed download URL for an audio file from the files bucket.
 *
 * @param storageKey - The storage key/path of the audio file
 * @param expiresIn - URL expiration time in seconds (default: 1 hour)
 * @returns Signed URL for downloading the audio file
 */
export async function getAudioDownloadUrl(
	storageKey: string,
	expiresIn = 3600,
): Promise<string> {
	if (!shouldUseSupabaseStorage()) {
		throw new Error("Storage not configured");
	}

	const provider = getDefaultSupabaseProvider();
	const bucket = config.storage.bucketNames.files;
	return provider.getSignedDownloadUrl(storageKey, {
		bucket,
		expiresIn,
	});
}

/**
 * Download audio file from storage as a buffer.
 *
 * @param storageKey - The storage key/path of the audio file
 * @returns Audio file content as a Buffer
 */
export async function downloadAudioFromStorage(
	storageKey: string,
): Promise<Buffer> {
	if (!shouldUseSupabaseStorage()) {
		throw new Error("Storage not configured");
	}

	// Get a signed URL and fetch the content
	const downloadUrl = await getAudioDownloadUrl(storageKey, 60);

	const response = await fetch(downloadUrl);
	if (!response.ok) {
		throw new Error(
			`Failed to download audio file: ${response.statusText}`,
		);
	}

	const arrayBuffer = await response.arrayBuffer();
	return Buffer.from(arrayBuffer);
}

/**
 * Delete an audio file from storage.
 *
 * @param storageKey - The storage key/path of the audio file
 */
export async function deleteAudioFromStorage(
	storageKey: string,
): Promise<void> {
	if (!shouldUseSupabaseStorage()) {
		logger.warn(
			"[AudioStorage] Supabase storage not configured, skipping delete",
		);
		return;
	}

	const provider = getDefaultSupabaseProvider();
	const bucket = config.storage.bucketNames.files;

	logger.info(`[AudioStorage] Deleting audio file: ${storageKey}`);
	await provider.delete(storageKey, bucket);
	logger.info(`[AudioStorage] Delete complete: ${storageKey}`);
}

/**
 * Check if an audio file exists in storage.
 *
 * @param storageKey - The storage key/path of the audio file
 * @returns True if the file exists
 */
export async function audioExistsInStorage(
	storageKey: string,
): Promise<boolean> {
	if (!shouldUseSupabaseStorage()) {
		return false;
	}

	const provider = getDefaultSupabaseProvider();
	const bucket = config.storage.bucketNames.files;
	return provider.exists(storageKey, bucket);
}
