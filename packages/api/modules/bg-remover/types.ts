import { z } from "zod";

/**
 * Supported image formats for background removal
 */
export const SUPPORTED_FORMATS = [
	"image/png",
	"image/jpeg",
	"image/webp",
] as const;

/**
 * Maximum file size: 10MB
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Input schema for background removal job
 */
export const BgRemoverInputSchema = z.object({
	imageUrl: z.string().url().describe("URL of the image to process"),
	format: z
		.enum(["png", "webp"])
		.optional()
		.default("png")
		.describe("Output format for the processed image"),
});

export type BgRemoverInput = z.infer<typeof BgRemoverInputSchema>;

/**
 * Output schema for background removal job
 */
export interface BgRemoverOutput {
	/**
	 * URL of the processed image with background removed
	 */
	resultUrl: string;

	/**
	 * Original image URL
	 */
	originalUrl: string;

	/**
	 * Metadata about the processing
	 */
	metadata?: {
		/**
		 * Processing time in milliseconds
		 */
		processingTimeMs?: number;

		/**
		 * Output format used
		 */
		format: string;

		/**
		 * File size of the result in bytes
		 */
		fileSizeBytes?: number;
	};
}

/**
 * Error codes specific to bg-remover
 */
export enum BgRemoverErrorCode {
	INVALID_IMAGE_FORMAT = "INVALID_IMAGE_FORMAT",
	IMAGE_TOO_LARGE = "IMAGE_TOO_LARGE",
	DOWNLOAD_FAILED = "DOWNLOAD_FAILED",
	PROCESSING_FAILED = "PROCESSING_FAILED",
	UPLOAD_FAILED = "UPLOAD_FAILED",
	API_KEY_MISSING = "API_KEY_MISSING",
}
