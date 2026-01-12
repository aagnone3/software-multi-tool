import { logger } from "@repo/logs";
import * as mammoth from "mammoth";

/**
 * Maximum file size for contract documents (25MB).
 * Contracts can be large, especially multi-page legal documents.
 */
export const MAX_CONTRACT_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Supported file types for contract document extraction.
 */
export const SUPPORTED_FILE_TYPES = {
	pdf: {
		mimeTypes: ["application/pdf"],
		extensions: [".pdf"],
	},
	docx: {
		mimeTypes: [
			"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		],
		extensions: [".docx"],
	},
	txt: {
		mimeTypes: ["text/plain"],
		extensions: [".txt"],
	},
} as const;

/**
 * All supported MIME types for contract uploads.
 */
export const SUPPORTED_MIME_TYPES = [
	...SUPPORTED_FILE_TYPES.pdf.mimeTypes,
	...SUPPORTED_FILE_TYPES.docx.mimeTypes,
	...SUPPORTED_FILE_TYPES.txt.mimeTypes,
];

/**
 * All supported file extensions for contract uploads.
 */
export const SUPPORTED_EXTENSIONS = [
	...SUPPORTED_FILE_TYPES.pdf.extensions,
	...SUPPORTED_FILE_TYPES.docx.extensions,
	...SUPPORTED_FILE_TYPES.txt.extensions,
];

/**
 * Result of document text extraction.
 */
export interface DocumentExtractionResult {
	success: true;
	text: string;
	metadata: {
		fileType: "pdf" | "docx" | "txt";
		/** Number of pages (PDF only) */
		pageCount?: number;
		/** Detected character count */
		characterCount: number;
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
			| "FILE_TOO_LARGE";
		message: string;
	};
}

export type DocumentExtractionOutcome =
	| DocumentExtractionResult
	| DocumentExtractionError;

/**
 * Detect file type from MIME type or file extension.
 */
export function detectFileType(
	mimeType?: string,
	filename?: string,
): "pdf" | "docx" | "txt" | null {
	// Check MIME type first
	if (mimeType) {
		if (SUPPORTED_FILE_TYPES.pdf.mimeTypes.includes(mimeType as never)) {
			return "pdf";
		}
		if (SUPPORTED_FILE_TYPES.docx.mimeTypes.includes(mimeType as never)) {
			return "docx";
		}
		if (SUPPORTED_FILE_TYPES.txt.mimeTypes.includes(mimeType as never)) {
			return "txt";
		}
	}

	// Fall back to file extension
	if (filename) {
		const ext = filename.toLowerCase().slice(filename.lastIndexOf("."));
		if (SUPPORTED_FILE_TYPES.pdf.extensions.includes(ext as never)) {
			return "pdf";
		}
		if (SUPPORTED_FILE_TYPES.docx.extensions.includes(ext as never)) {
			return "docx";
		}
		if (SUPPORTED_FILE_TYPES.txt.extensions.includes(ext as never)) {
			return "txt";
		}
	}

	return null;
}

/**
 * Extract text from a PDF file buffer.
 * Uses dynamic import to avoid pdf-parse's test file loading at import time.
 */
export async function extractTextFromPdf(
	buffer: Buffer,
): Promise<DocumentExtractionOutcome> {
	try {
		// Dynamic import to avoid pdf-parse loading test files at import time
		// This is a known issue with the pdf-parse library
		const pdfParse = (await import("pdf-parse")).default;
		const data = await pdfParse(buffer);

		const text = data.text.trim();
		if (!text) {
			return {
				success: false,
				error: {
					code: "EMPTY_DOCUMENT",
					message:
						"The PDF appears to be empty or contains only images. Please ensure the PDF has selectable text.",
				},
			};
		}

		return {
			success: true,
			text,
			metadata: {
				fileType: "pdf",
				pageCount: data.numpages,
				characterCount: text.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: "EXTRACTION_FAILED",
				message:
					error instanceof Error
						? `Failed to extract text from PDF: ${error.message}`
						: "Failed to extract text from PDF",
			},
		};
	}
}

/**
 * Extract text from a DOCX file buffer.
 */
export async function extractTextFromDocx(
	buffer: Buffer,
): Promise<DocumentExtractionOutcome> {
	try {
		const result = await mammoth.extractRawText({ buffer });

		const text = result.value.trim();
		if (!text) {
			return {
				success: false,
				error: {
					code: "EMPTY_DOCUMENT",
					message:
						"The Word document appears to be empty. Please ensure the document contains text.",
				},
			};
		}

		// Log any warnings (for debugging)
		if (result.messages.length > 0) {
			logger.warn("DOCX extraction warnings", {
				messages: result.messages,
			});
		}

		return {
			success: true,
			text,
			metadata: {
				fileType: "docx",
				characterCount: text.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: "EXTRACTION_FAILED",
				message:
					error instanceof Error
						? `Failed to extract text from DOCX: ${error.message}`
						: "Failed to extract text from Word document",
			},
		};
	}
}

/**
 * Extract text from a plain text file buffer.
 */
export function extractTextFromTxt(buffer: Buffer): DocumentExtractionOutcome {
	try {
		const text = buffer.toString("utf-8").trim();

		if (!text) {
			return {
				success: false,
				error: {
					code: "EMPTY_DOCUMENT",
					message: "The text file is empty.",
				},
			};
		}

		return {
			success: true,
			text,
			metadata: {
				fileType: "txt",
				characterCount: text.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			error: {
				code: "EXTRACTION_FAILED",
				message:
					error instanceof Error
						? `Failed to read text file: ${error.message}`
						: "Failed to read text file",
			},
		};
	}
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
 * const result = await extractTextFromDocument(
 *   fileBuffer,
 *   "application/pdf",
 *   "contract.pdf"
 * );
 *
 * if (!result.success) {
 *   console.error(result.error.message);
 *   return;
 * }
 *
 * console.log("Extracted text:", result.text);
 * console.log("Pages:", result.metadata.pageCount);
 * ```
 */
export async function extractTextFromDocument(
	buffer: Buffer,
	mimeType?: string,
	filename?: string,
): Promise<DocumentExtractionOutcome> {
	// Check file size
	if (buffer.length > MAX_CONTRACT_FILE_SIZE) {
		return {
			success: false,
			error: {
				code: "FILE_TOO_LARGE",
				message: `File size (${(buffer.length / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size (25MB)`,
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
					"Unsupported file type. Please upload a PDF, DOCX, or TXT file.",
			},
		};
	}

	// Extract text based on file type
	switch (fileType) {
		case "pdf":
			return extractTextFromPdf(buffer);
		case "docx":
			return extractTextFromDocx(buffer);
		case "txt":
			return extractTextFromTxt(buffer);
	}
}
