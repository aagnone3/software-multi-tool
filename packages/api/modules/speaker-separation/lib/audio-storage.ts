import { logger } from "@repo/logs";
import {
	getDefaultSupabaseProvider,
	shouldUseSupabaseStorage,
} from "@repo/storage";
import type { AudioMetadata } from "../types";

/** Storage bucket for speaker separation audio files */
const AUDIO_BUCKET = "audio-uploads";

/** Storage path prefix for speaker separation files */
const STORAGE_PREFIX = "speaker-separation";

/** Audio file retention period in days */
export const AUDIO_RETENTION_DAYS = 30;

/**
 * Generates the storage key/path for an audio file.
 * Format: speaker-separation/{jobId}.{extension}
 */
export function getAudioStorageKey(jobId: string, filename: string): string {
	// Extract extension from filename
	const ext = filename.split(".").pop()?.toLowerCase() ?? "audio";
	return `${STORAGE_PREFIX}/${jobId}.${ext}`;
}

/**
 * Upload audio file to storage and return the storage key.
 *
 * @param jobId - The job ID to associate with the file
 * @param base64Content - Base64-encoded audio content
 * @param metadata - Audio file metadata
 * @returns Storage key (path) of the uploaded file
 */
export async function uploadAudioToStorage(
	jobId: string,
	base64Content: string,
	metadata: AudioMetadata,
): Promise<string> {
	// Only use Supabase storage if configured
	if (!shouldUseSupabaseStorage()) {
		logger.warn(
			"[AudioStorage] Supabase storage not configured, skipping upload",
		);
		throw new Error("Storage not configured");
	}

	const provider = getDefaultSupabaseProvider();
	const storageKey = getAudioStorageKey(jobId, metadata.filename);

	// Convert base64 to buffer
	// Handle data URL format (e.g., "data:audio/wav;base64,...")
	const base64Data = base64Content.includes(",")
		? base64Content.split(",")[1]
		: base64Content;
	const buffer = Buffer.from(base64Data, "base64");

	logger.info(`[AudioStorage] Uploading audio file: ${storageKey}`, {
		jobId,
		filename: metadata.filename,
		mimeType: metadata.mimeType,
		size: buffer.length,
	});

	await provider.upload(storageKey, buffer, {
		bucket: AUDIO_BUCKET,
		contentType: metadata.mimeType,
	});

	logger.info(`[AudioStorage] Upload complete: ${storageKey}`);
	return storageKey;
}

/**
 * Get a signed download URL for an audio file.
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
	return provider.getSignedDownloadUrl(storageKey, {
		bucket: AUDIO_BUCKET,
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

	logger.info(`[AudioStorage] Deleting audio file: ${storageKey}`);
	await provider.delete(storageKey, AUDIO_BUCKET);
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
	return provider.exists(storageKey, AUDIO_BUCKET);
}
