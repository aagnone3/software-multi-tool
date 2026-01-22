import { logger } from "@repo/logs";
import Tesseract from "tesseract.js";

/**
 * Maximum file size for invoice documents (10MB).
 * Per acceptance criteria: File validation: max 10MB, allowed types only
 */
export const MAX_INVOICE_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Supported file types for invoice document extraction.
 */
export const SUPPORTED_FILE_TYPES = {
	pdf: {
		mimeTypes: ["application/pdf"],
		extensions: [".pdf"],
	},
	image: {
		mimeTypes: ["image/jpeg", "image/png", "image/tiff", "image/webp"],
		extensions: [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp"],
	},
} as const;

/**
 * All supported MIME types for invoice uploads.
 */
export const SUPPORTED_MIME_TYPES = [
	...SUPPORTED_FILE_TYPES.pdf.mimeTypes,
	...SUPPORTED_FILE_TYPES.image.mimeTypes,
];

/**
 * All supported file extensions for invoice uploads.
 */
export const SUPPORTED_EXTENSIONS = [
	...SUPPORTED_FILE_TYPES.pdf.extensions,
	...SUPPORTED_FILE_TYPES.image.extensions,
];

/**
 * Magic bytes for file type verification.
 */
const MAGIC_BYTES = {
	pdf: [0x25, 0x50, 0x44, 0x46], // %PDF
	jpeg: [0xff, 0xd8, 0xff],
	png: [0x89, 0x50, 0x4e, 0x47], // PNG
	tiff_le: [0x49, 0x49, 0x2a, 0x00], // TIFF little-endian
	tiff_be: [0x4d, 0x4d, 0x00, 0x2a], // TIFF big-endian
	webp: [0x52, 0x49, 0x46, 0x46], // RIFF (WebP starts with RIFF)
} as const;

/**
 * Result of document text extraction.
 */
export interface DocumentExtractionResult {
	success: true;
	text: string;
	metadata: {
		fileType: "pdf" | "image";
		/** Number of pages (PDF only) */
		pageCount?: number;
		/** Detected character count */
		characterCount: number;
		/** Whether OCR was used for extraction */
		usedOcr: boolean;
		/** OCR confidence score (0-1), only present when OCR was used */
		ocrConfidence?: number;
	};
}

/**
 * Error result from document extraction.
 */
export interface DocumentExtractionError {
	success: false;
	error: {
		code:
			| "UNSUPPORTED_FILE_TYPE"
			| "EXTRACTION_FAILED"
			| "EMPTY_DOCUMENT"
			| "FILE_TOO_LARGE"
			| "INVALID_FILE_FORMAT"
			| "OCR_FAILED";
		message: string;
	};
}

export type DocumentExtractionOutcome =
	| DocumentExtractionResult
	| DocumentExtractionError;

/**
 * Verify file type using magic bytes.
 */
export function verifyMagicBytes(
	buffer: Buffer,
): "pdf" | "jpeg" | "png" | "tiff" | "webp" | null {
	if (buffer.length < 4) {
		return null;
	}

	// Check PDF
	if (
		buffer[0] === MAGIC_BYTES.pdf[0] &&
		buffer[1] === MAGIC_BYTES.pdf[1] &&
		buffer[2] === MAGIC_BYTES.pdf[2] &&
		buffer[3] === MAGIC_BYTES.pdf[3]
	) {
		return "pdf";
	}

	// Check JPEG
	if (
		buffer[0] === MAGIC_BYTES.jpeg[0] &&
		buffer[1] === MAGIC_BYTES.jpeg[1] &&
		buffer[2] === MAGIC_BYTES.jpeg[2]
	) {
		return "jpeg";
	}

	// Check PNG
	if (
		buffer[0] === MAGIC_BYTES.png[0] &&
		buffer[1] === MAGIC_BYTES.png[1] &&
		buffer[2] === MAGIC_BYTES.png[2] &&
		buffer[3] === MAGIC_BYTES.png[3]
	) {
		return "png";
	}

	// Check TIFF (little-endian)
	if (
		buffer[0] === MAGIC_BYTES.tiff_le[0] &&
		buffer[1] === MAGIC_BYTES.tiff_le[1] &&
		buffer[2] === MAGIC_BYTES.tiff_le[2] &&
		buffer[3] === MAGIC_BYTES.tiff_le[3]
	) {
		return "tiff";
	}

	// Check TIFF (big-endian)
	if (
		buffer[0] === MAGIC_BYTES.tiff_be[0] &&
		buffer[1] === MAGIC_BYTES.tiff_be[1] &&
		buffer[2] === MAGIC_BYTES.tiff_be[2] &&
		buffer[3] === MAGIC_BYTES.tiff_be[3]
	) {
		return "tiff";
	}

	// Check WebP (RIFF header followed by WEBP at offset 8)
	if (
		buffer[0] === MAGIC_BYTES.webp[0] &&
		buffer[1] === MAGIC_BYTES.webp[1] &&
		buffer[2] === MAGIC_BYTES.webp[2] &&
		buffer[3] === MAGIC_BYTES.webp[3] &&
		buffer.length >= 12 &&
		buffer[8] === 0x57 && // W
		buffer[9] === 0x45 && // E
		buffer[10] === 0x42 && // B
		buffer[11] === 0x50 // P
	) {
		return "webp";
	}

	return null;
}

/**
 * Detect file type from MIME type or file extension.
 */
export function detectFileType(
	mimeType?: string,
	filename?: string,
): "pdf" | "image" | null {
	// Check MIME type first
	if (mimeType) {
		if (SUPPORTED_FILE_TYPES.pdf.mimeTypes.includes(mimeType as never)) {
			return "pdf";
		}
		if (SUPPORTED_FILE_TYPES.image.mimeTypes.includes(mimeType as never)) {
			return "image";
		}
	}

	// Fall back to file extension
	if (filename) {
		const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
		if (SUPPORTED_FILE_TYPES.pdf.extensions.includes(ext as never)) {
			return "pdf";
		}
		if (SUPPORTED_FILE_TYPES.image.extensions.includes(ext as never)) {
			return "image";
		}
	}

	return null;
}

/**
 * Extract text from a PDF file buffer.
 * Uses native text extraction first, falls back to OCR for scanned PDFs.
 */
export async function extractTextFromPdf(
	buffer: Buffer,
): Promise<DocumentExtractionOutcome> {
	try {
		// Dynamic import to avoid pdf-parse loading test files at import time
		const pdfParse = (await import("pdf-parse")).default;
		const data = await pdfParse(buffer);

		const text = data.text.trim();

		// If no text found, this might be a scanned PDF - try OCR
		if (!text || text.length < 10) {
			logger.info("PDF appears to be scanned, attempting OCR extraction");
			return extractTextWithOcr(buffer, "pdf", data.numpages);
		}

		return {
			success: true,
			text,
			metadata: {
				fileType: "pdf",
				pageCount: data.numpages,
				characterCount: text.length,
				usedOcr: false,
			},
		};
	} catch (error) {
		logger.error("PDF text extraction failed, attempting OCR", { error });
		// If native extraction fails, try OCR
		return extractTextWithOcr(buffer, "pdf");
	}
}

/**
 * Extract text from an image file buffer using OCR.
 */
export async function extractTextFromImage(
	buffer: Buffer,
): Promise<DocumentExtractionOutcome> {
	return extractTextWithOcr(buffer, "image");
}

/**
 * Extract text using Tesseract OCR.
 */
async function extractTextWithOcr(
	buffer: Buffer,
	sourceType: "pdf" | "image",
	pageCount?: number,
): Promise<DocumentExtractionOutcome> {
	try {
		// For PDFs, we need to convert to images first
		// For now, we'll use pdf2pic or similar for multi-page PDFs
		// For single-page PDFs or images, we can process directly

		let imageBuffer: Buffer = buffer;

		// If it's a PDF, we need to convert to image for OCR
		if (sourceType === "pdf") {
			try {
				// Use pdf-poppler or similar to convert PDF to image
				// For now, we'll use a simpler approach with sharp for basic conversion
				// In production, consider using pdf-to-img or pdf2pic
				const sharp = (await import("sharp")).default;

				// Try to extract the first page as an image
				// This is a simplified approach - for multi-page PDFs,
				// you'd want to process each page
				try {
					imageBuffer = await sharp(buffer, {
						density: 300, // Higher DPI for better OCR
					})
						.png()
						.toBuffer();
				} catch {
					// If sharp can't process the PDF, return an error
					return {
						success: false,
						error: {
							code: "OCR_FAILED",
							message:
								"Unable to convert scanned PDF for OCR processing. Please ensure the PDF contains valid content.",
						},
					};
				}
			} catch {
				return {
					success: false,
					error: {
						code: "OCR_FAILED",
						message:
							"Failed to prepare PDF for OCR. The file may be corrupted.",
					},
				};
			}
		}

		// Perform OCR using Tesseract.js
		const result = await Tesseract.recognize(imageBuffer, "eng", {
			logger: (info) => {
				if (info.status === "recognizing text") {
					logger.debug("OCR progress", { progress: info.progress });
				}
			},
		});

		const text = result.data.text.trim();

		if (!text) {
			return {
				success: false,
				error: {
					code: "EMPTY_DOCUMENT",
					message:
						"No text could be extracted from the document. Please ensure the file contains readable text or a clear image of the invoice.",
				},
			};
		}

		return {
			success: true,
			text,
			metadata: {
				fileType: sourceType,
				pageCount: sourceType === "pdf" ? pageCount : undefined,
				characterCount: text.length,
				usedOcr: true,
				ocrConfidence: result.data.confidence / 100, // Normalize to 0-1
			},
		};
	} catch (error) {
		logger.error("OCR extraction failed", { error });
		return {
			success: false,
			error: {
				code: "OCR_FAILED",
				message:
					error instanceof Error
						? `OCR processing failed: ${error.message}`
						: "Failed to extract text using OCR",
			},
		};
	}
}

/**
 * Validate file before extraction.
 */
export function validateInvoiceFile(
	buffer: Buffer,
	mimeType?: string,
	filename?: string,
): DocumentExtractionError | null {
	// Check file size
	if (buffer.length > MAX_INVOICE_FILE_SIZE) {
		return {
			success: false,
			error: {
				code: "FILE_TOO_LARGE",
				message: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size (10MB)`,
			},
		};
	}

	// Detect file type
	const fileType = detectFileType(mimeType, filename);
	if (!fileType) {
		return {
			success: false,
			error: {
				code: "UNSUPPORTED_FILE_TYPE",
				message:
					"Unsupported file type. Please upload a PDF or image file (JPG, PNG, TIFF, WebP).",
			},
		};
	}

	// Verify magic bytes
	const detectedType = verifyMagicBytes(buffer);
	if (!detectedType) {
		return {
			success: false,
			error: {
				code: "INVALID_FILE_FORMAT",
				message:
					"File appears to be corrupted or has an invalid format. Please ensure you're uploading a valid file.",
			},
		};
	}

	// Verify magic bytes match claimed type
	const expectedTypes =
		fileType === "pdf" ? ["pdf"] : ["jpeg", "png", "tiff", "webp"];
	if (!expectedTypes.includes(detectedType)) {
		return {
			success: false,
			error: {
				code: "INVALID_FILE_FORMAT",
				message: `File content doesn't match the expected format. The file appears to be a ${detectedType.toUpperCase()} but was uploaded as a ${fileType.toUpperCase()}.`,
			},
		};
	}

	return null;
}

/**
 * Extract text from a document buffer based on its type.
 *
 * @param buffer - The file buffer
 * @param mimeType - The MIME type of the file
 * @param filename - Optional filename for extension detection fallback
 * @returns The extraction result or error
 *
 * @example
 * ```typescript
 * const result = await extractTextFromInvoiceDocument(
 *   fileBuffer,
 *   "application/pdf",
 *   "invoice.pdf"
 * );
 *
 * if (!result.success) {
 *   console.error(result.error.message);
 *   return;
 * }
 *
 * console.log("Extracted text:", result.text);
 * console.log("Used OCR:", result.metadata.usedOcr);
 * ```
 */
export async function extractTextFromInvoiceDocument(
	buffer: Buffer,
	mimeType?: string,
	filename?: string,
): Promise<DocumentExtractionOutcome> {
	// Validate file first
	const validationError = validateInvoiceFile(buffer, mimeType, filename);
	if (validationError) {
		return validationError;
	}

	// Detect file type
	const fileType = detectFileType(mimeType, filename);

	// Extract text based on file type
	if (fileType === "pdf") {
		return extractTextFromPdf(buffer);
	}
	return extractTextFromImage(buffer);
}
