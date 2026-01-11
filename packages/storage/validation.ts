import { extname } from "node:path";
import { fileTypeFromBuffer } from "file-type";
import type {
	FileToValidate,
	StorageProvider,
	UploadOptions,
	UploadResult,
	UploadValidator,
	UploadValidatorOptions,
	ValidationResult,
} from "./types";

/**
 * Format bytes into a human-readable string.
 */
function formatBytes(bytes: number): string {
	if (bytes === 0) {
		return "0 Bytes";
	}
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a MIME type matches a pattern (supports wildcards).
 *
 * @param mimeType - The actual MIME type to check
 * @param pattern - The pattern to match against (e.g., "image/*" or "image/png")
 * @returns true if the MIME type matches the pattern
 */
function matchesMimePattern(mimeType: string, pattern: string): boolean {
	if (pattern === "*/*" || pattern === "*") {
		return true;
	}

	const [patternType, patternSubtype] = pattern.split("/");
	const [actualType] = mimeType.split("/");

	if (patternSubtype === "*") {
		return patternType === actualType;
	}

	return mimeType === pattern;
}

/**
 * Create a file upload validator with the specified rules.
 *
 * Returns a validator object that can validate files against size limits,
 * MIME type restrictions, and extension filters. The validator does NOT
 * throw exceptions - it returns a result object for type-safe error handling.
 *
 * @param options - Validation rules to apply
 * @returns An UploadValidator instance
 *
 * @example
 * ```typescript
 * // Create a validator for image uploads
 * const imageValidator = createUploadValidator({
 *   maxSize: 5 * 1024 * 1024, // 5MB
 *   allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
 *   allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"]
 * });
 *
 * // Validate a file
 * const result = await imageValidator.validate({
 *   buffer: fileBuffer,
 *   filename: "photo.jpg"
 * });
 *
 * if (!result.success) {
 *   return { error: result.error }; // { code: 'FILE_TOO_LARGE', message: '...' }
 * }
 * ```
 */
export function createUploadValidator(
	options: UploadValidatorOptions = {},
): UploadValidator {
	const {
		maxSize,
		allowedMimeTypes,
		allowedExtensions,
		allowEmpty = false,
	} = options;

	return {
		options: Object.freeze({ ...options }),

		async validate(file: FileToValidate): Promise<ValidationResult> {
			const { buffer, filename } = file;

			// Check for empty files
			if (buffer.length === 0 && !allowEmpty) {
				return {
					success: false,
					error: {
						code: "EMPTY_FILE",
						message: "File is empty",
						details: {
							actual: 0,
						},
					},
				};
			}

			// Check file size
			if (maxSize !== undefined && buffer.length > maxSize) {
				return {
					success: false,
					error: {
						code: "FILE_TOO_LARGE",
						message: `File size (${formatBytes(buffer.length)}) exceeds maximum allowed size (${formatBytes(maxSize)})`,
						details: {
							actual: buffer.length,
							maxAllowed: maxSize,
						},
					},
				};
			}

			// Check file extension (case-insensitive)
			if (allowedExtensions && allowedExtensions.length > 0) {
				const fileExtension = extname(filename).toLowerCase();
				const normalizedAllowed = allowedExtensions.map((ext) =>
					ext.toLowerCase(),
				);

				if (!normalizedAllowed.includes(fileExtension)) {
					return {
						success: false,
						error: {
							code: "INVALID_EXTENSION",
							message: `File extension "${fileExtension}" is not allowed. Allowed extensions: ${allowedExtensions.join(", ")}`,
							details: {
								actual: fileExtension,
								expected: allowedExtensions,
							},
						},
					};
				}
			}

			// Detect and check MIME type from file content
			let detectedMimeType: string | undefined;

			if (allowedMimeTypes && allowedMimeTypes.length > 0) {
				// Use file-type to detect MIME from magic bytes
				const detected = await fileTypeFromBuffer(buffer);
				detectedMimeType = detected?.mime;

				// If we couldn't detect the MIME type and the file has content,
				// fall back to the claimed MIME type
				if (!detectedMimeType && buffer.length > 0) {
					detectedMimeType = file.mimeType;
				}

				// If we still don't have a MIME type, treat as application/octet-stream
				const mimeToCheck =
					detectedMimeType || "application/octet-stream";

				const isAllowed = allowedMimeTypes.some((pattern) =>
					matchesMimePattern(mimeToCheck, pattern),
				);

				if (!isAllowed) {
					return {
						success: false,
						error: {
							code: "INVALID_MIME_TYPE",
							message: `File type "${mimeToCheck}" is not allowed. Allowed types: ${allowedMimeTypes.join(", ")}`,
							details: {
								actual: mimeToCheck,
								expected: allowedMimeTypes,
							},
						},
					};
				}
			} else if (buffer.length > 0) {
				// Even if not validating, still detect MIME for the result
				const detected = await fileTypeFromBuffer(buffer);
				detectedMimeType = detected?.mime;
			}

			return {
				success: true,
				detectedMimeType,
			};
		},
	};
}

// ============================================================================
// Preset validation rules for common use cases
// ============================================================================

/**
 * Preset validation rules for image uploads.
 * Allows JPEG, PNG, GIF, WebP, and SVG images up to 5MB.
 *
 * @example
 * ```typescript
 * const imageValidator = createUploadValidator(imageUploadRules);
 * ```
 */
export const imageUploadRules: UploadValidatorOptions = {
	maxSize: 5 * 1024 * 1024, // 5MB
	allowedMimeTypes: [
		"image/jpeg",
		"image/png",
		"image/gif",
		"image/webp",
		"image/svg+xml",
	],
	allowedExtensions: [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"],
};

/**
 * Preset validation rules for document uploads.
 * Allows PDF, Word documents, and text files up to 10MB.
 *
 * @example
 * ```typescript
 * const docValidator = createUploadValidator(documentUploadRules);
 * ```
 */
export const documentUploadRules: UploadValidatorOptions = {
	maxSize: 10 * 1024 * 1024, // 10MB
	allowedMimeTypes: [
		"application/pdf",
		"application/msword",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/plain",
		"text/markdown",
	],
	allowedExtensions: [".pdf", ".doc", ".docx", ".txt", ".md"],
};

/**
 * Preset validation rules for avatar/profile picture uploads.
 * Stricter than general image uploads: only common formats, max 2MB, square-friendly formats.
 *
 * @example
 * ```typescript
 * const avatarValidator = createUploadValidator(avatarUploadRules);
 * ```
 */
export const avatarUploadRules: UploadValidatorOptions = {
	maxSize: 2 * 1024 * 1024, // 2MB
	allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
	allowedExtensions: [".jpg", ".jpeg", ".png", ".webp"],
};

/**
 * Preset validation rules for video uploads.
 * Allows common video formats up to 100MB.
 *
 * @example
 * ```typescript
 * const videoValidator = createUploadValidator(videoUploadRules);
 * ```
 */
export const videoUploadRules: UploadValidatorOptions = {
	maxSize: 100 * 1024 * 1024, // 100MB
	allowedMimeTypes: [
		"video/mp4",
		"video/webm",
		"video/quicktime",
		"video/x-msvideo",
	],
	allowedExtensions: [".mp4", ".webm", ".mov", ".avi"],
};

/**
 * Preset validation rules for audio uploads.
 * Allows common audio formats up to 20MB.
 *
 * @example
 * ```typescript
 * const audioValidator = createUploadValidator(audioUploadRules);
 * ```
 */
export const audioUploadRules: UploadValidatorOptions = {
	maxSize: 20 * 1024 * 1024, // 20MB
	allowedMimeTypes: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm"],
	allowedExtensions: [".mp3", ".wav", ".ogg", ".webm"],
};

// ============================================================================
// Storage provider wrapper with validation
// ============================================================================

/**
 * Result of a validated upload operation.
 * Extends the standard upload result with validation information.
 * Uses discriminated union pattern with success: true for type narrowing.
 */
export interface ValidatedUploadResult extends UploadResult {
	/**
	 * Always true for successful validated uploads.
	 * Enables discriminated union pattern: if (!result.success) { handle error }
	 */
	success: true;

	/**
	 * Validation result for the file.
	 */
	validation: ValidationResult & { success: true };
}

/**
 * Options for validated upload operations.
 * Extends standard upload options with filename for validation.
 */
export interface ValidatedUploadOptions extends UploadOptions {
	/**
	 * The original filename (required for extension validation).
	 */
	filename: string;
}

/**
 * A storage provider wrapped with upload validation.
 * Validates files before uploading, failing fast if validation fails.
 */
export interface ValidatedStorageProvider
	extends Omit<StorageProvider, "upload"> {
	/**
	 * The underlying storage provider.
	 */
	readonly provider: StorageProvider;

	/**
	 * The validator used for file validation.
	 */
	readonly validator: UploadValidator;

	/**
	 * Upload a file with validation.
	 * Validates the file first, then uploads if validation passes.
	 *
	 * @param key - The key/path to store the file at
	 * @param data - The file data as a Buffer (streams are not supported for validation)
	 * @param options - Upload options including filename for validation
	 * @returns Promise resolving to validation result or upload result
	 *
	 * @example
	 * ```typescript
	 * const result = await validatedStorage.upload(
	 *   "avatars/user.png",
	 *   imageBuffer,
	 *   { bucket: "uploads", filename: "profile.png" }
	 * );
	 *
	 * if (!result.success) {
	 *   console.log(result.error.message);
	 *   return;
	 * }
	 *
	 * console.log("Uploaded to:", result.key);
	 * ```
	 */
	upload(
		key: string,
		data: Buffer,
		options: ValidatedUploadOptions,
	): Promise<ValidationResult | ValidatedUploadResult>;
}

/**
 * Wrap a storage provider with upload validation.
 *
 * Creates a new provider that validates files before uploading.
 * If validation fails, the upload is skipped and the validation error is returned.
 * If validation passes, the file is uploaded and the result includes validation info.
 *
 * Note: This wrapper only supports Buffer uploads (not streams) because
 * validation requires reading the file content for MIME type detection.
 *
 * @param provider - The storage provider to wrap
 * @param validator - The validator to use for file validation
 * @returns A storage provider with validation built in
 *
 * @example
 * ```typescript
 * import {
 *   createStorageProvider,
 *   createUploadValidator,
 *   withValidation,
 *   imageUploadRules
 * } from "@repo/storage";
 *
 * const storage = createStorageProvider({
 *   type: "s3",
 *   endpoint: "https://s3.example.com",
 *   accessKeyId: "key",
 *   secretAccessKey: "secret"
 * });
 *
 * const imageValidator = createUploadValidator(imageUploadRules);
 * const validatedStorage = withValidation(storage, imageValidator);
 *
 * // Upload with automatic validation
 * const result = await validatedStorage.upload(
 *   "images/photo.jpg",
 *   fileBuffer,
 *   { bucket: "uploads", filename: "photo.jpg" }
 * );
 *
 * if (!result.success) {
 *   // Handle validation error
 *   console.log(result.error.code, result.error.message);
 * } else {
 *   // File was uploaded
 *   console.log("Uploaded:", result.key);
 * }
 * ```
 */
export function withValidation(
	provider: StorageProvider,
	validator: UploadValidator,
): ValidatedStorageProvider {
	return {
		get name() {
			return provider.name;
		},

		provider,
		validator,

		async upload(
			key: string,
			data: Buffer,
			options: ValidatedUploadOptions,
		): Promise<ValidationResult | ValidatedUploadResult> {
			const { filename, ...uploadOptions } = options;

			// Validate the file first
			const validationResult = await validator.validate({
				buffer: data,
				filename,
				mimeType: options.contentType,
			});

			if (!validationResult.success) {
				return validationResult;
			}

			// Use detected MIME type if available and no content type was specified
			const contentType =
				options.contentType ||
				validationResult.detectedMimeType ||
				"application/octet-stream";

			// Upload the file
			const uploadResult = await provider.upload(key, data, {
				...uploadOptions,
				contentType,
			});

			return {
				...uploadResult,
				success: true as const,
				validation: validationResult,
			};
		},

		getSignedUploadUrl: provider.getSignedUploadUrl.bind(provider),
		getSignedDownloadUrl: provider.getSignedDownloadUrl.bind(provider),
		delete: provider.delete.bind(provider),
		exists: provider.exists.bind(provider),
	};
}
