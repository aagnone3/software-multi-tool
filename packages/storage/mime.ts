import { extname } from "node:path";

/**
 * Map of file extensions to MIME types.
 * Includes common image, document, video, and audio formats.
 */
const EXTENSION_TO_MIME: Record<string, string> = {
	// Images
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".gif": "image/gif",
	".webp": "image/webp",
	".svg": "image/svg+xml",
	".ico": "image/x-icon",
	".bmp": "image/bmp",
	".tiff": "image/tiff",
	".tif": "image/tiff",
	".avif": "image/avif",
	".heic": "image/heic",
	".heif": "image/heif",

	// Documents
	".pdf": "application/pdf",
	".doc": "application/msword",
	".docx":
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	".xls": "application/vnd.ms-excel",
	".xlsx":
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
	".ppt": "application/vnd.ms-powerpoint",
	".pptx":
		"application/vnd.openxmlformats-officedocument.presentationml.presentation",
	".txt": "text/plain",
	".md": "text/markdown",
	".csv": "text/csv",
	".json": "application/json",
	".xml": "application/xml",

	// Video
	".mp4": "video/mp4",
	".webm": "video/webm",
	".mov": "video/quicktime",
	".avi": "video/x-msvideo",
	".mkv": "video/x-matroska",

	// Audio
	".mp3": "audio/mpeg",
	".wav": "audio/wav",
	".ogg": "audio/ogg",
	".flac": "audio/flac",
	".aac": "audio/aac",
	".m4a": "audio/mp4",

	// Archives
	".zip": "application/zip",
	".tar": "application/x-tar",
	".gz": "application/gzip",
	".rar": "application/vnd.rar",
	".7z": "application/x-7z-compressed",
};

/**
 * Infer the MIME type from a file path based on its extension.
 *
 * Supports common image formats (JPEG, PNG, GIF, WebP, SVG, etc.),
 * documents (PDF, Office formats, text), video, audio, and archives.
 *
 * @param path - The file path or filename to analyze
 * @returns The inferred MIME type, or "application/octet-stream" if unknown
 *
 * @example
 * ```typescript
 * inferMimeType("photo.jpg")    // "image/jpeg"
 * inferMimeType("doc.PDF")      // "application/pdf" (case-insensitive)
 * inferMimeType("data.bin")     // "application/octet-stream"
 * inferMimeType("uploads/avatar.png") // "image/png"
 * ```
 */
export function inferMimeType(path: string): string {
	const extension = extname(path).toLowerCase();

	if (!extension) {
		return "application/octet-stream";
	}

	return EXTENSION_TO_MIME[extension] ?? "application/octet-stream";
}

/**
 * Check if a MIME type represents an image format.
 *
 * @param mimeType - The MIME type to check
 * @returns true if the MIME type is an image type
 *
 * @example
 * ```typescript
 * isImageMimeType("image/jpeg")    // true
 * isImageMimeType("image/png")     // true
 * isImageMimeType("application/pdf") // false
 * ```
 */
export function isImageMimeType(mimeType: string): boolean {
	return mimeType.startsWith("image/");
}

/**
 * Get a list of all supported image MIME types.
 * Useful for validation rules.
 */
export const SUPPORTED_IMAGE_MIME_TYPES = [
	"image/jpeg",
	"image/png",
	"image/gif",
	"image/webp",
	"image/svg+xml",
	"image/x-icon",
	"image/bmp",
	"image/tiff",
	"image/avif",
	"image/heic",
	"image/heif",
] as const;

/**
 * Get a list of all supported image file extensions.
 * Useful for validation rules.
 */
export const SUPPORTED_IMAGE_EXTENSIONS = [
	".jpg",
	".jpeg",
	".png",
	".gif",
	".webp",
	".svg",
	".ico",
	".bmp",
	".tiff",
	".tif",
	".avif",
	".heic",
	".heif",
] as const;
