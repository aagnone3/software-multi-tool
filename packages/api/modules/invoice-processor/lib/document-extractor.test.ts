import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	detectFileType,
	extractTextFromImage,
	extractTextFromInvoiceDocument,
	extractTextFromPdf,
	MAX_INVOICE_FILE_SIZE,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MIME_TYPES,
	validateInvoiceFile,
	verifyMagicBytes,
} from "./document-extractor";

const pdfParseMock = vi.hoisted(() => vi.fn());
const tesseractMock = vi.hoisted(() => ({
	recognize: vi.fn(),
}));
const sharpMock = vi.hoisted(() => {
	const mockInstance = {
		png: vi.fn().mockReturnThis(),
		toBuffer: vi.fn(),
	};
	return vi.fn(() => mockInstance);
});
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	debug: vi.fn(),
	error: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
	default: pdfParseMock,
}));

vi.mock("tesseract.js", () => ({
	default: tesseractMock,
}));

vi.mock("sharp", () => ({
	default: sharpMock,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

// Helper to create magic bytes for different file types
const MAGIC_BYTES = {
	pdf: Buffer.from([0x25, 0x50, 0x44, 0x46]), // %PDF
	jpeg: Buffer.from([0xff, 0xd8, 0xff]),
	png: Buffer.from([0x89, 0x50, 0x4e, 0x47]),
	tiff_le: Buffer.from([0x49, 0x49, 0x2a, 0x00]),
	tiff_be: Buffer.from([0x4d, 0x4d, 0x00, 0x2a]),
	webp: Buffer.from([
		0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
	]),
};

function createMockBuffer(magicBytes: Buffer, extraSize = 100): Buffer {
	const extra = Buffer.alloc(extraSize);
	return Buffer.concat([magicBytes, extra]);
}

describe("document-extractor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("constants", () => {
		it("should have MAX_INVOICE_FILE_SIZE set to 10MB", () => {
			expect(MAX_INVOICE_FILE_SIZE).toBe(10 * 1024 * 1024);
		});

		it("should support PDF and image MIME types", () => {
			expect(SUPPORTED_MIME_TYPES).toContain("application/pdf");
			expect(SUPPORTED_MIME_TYPES).toContain("image/jpeg");
			expect(SUPPORTED_MIME_TYPES).toContain("image/png");
			expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
			expect(SUPPORTED_MIME_TYPES).toContain("image/webp");
		});

		it("should support .pdf and image file extensions", () => {
			expect(SUPPORTED_EXTENSIONS).toContain(".pdf");
			expect(SUPPORTED_EXTENSIONS).toContain(".jpg");
			expect(SUPPORTED_EXTENSIONS).toContain(".jpeg");
			expect(SUPPORTED_EXTENSIONS).toContain(".png");
			expect(SUPPORTED_EXTENSIONS).toContain(".tiff");
			expect(SUPPORTED_EXTENSIONS).toContain(".tif");
			expect(SUPPORTED_EXTENSIONS).toContain(".webp");
		});
	});

	describe("verifyMagicBytes", () => {
		it("should detect PDF from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			expect(verifyMagicBytes(buffer)).toBe("pdf");
		});

		it("should detect JPEG from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.jpeg);
			expect(verifyMagicBytes(buffer)).toBe("jpeg");
		});

		it("should detect PNG from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.png);
			expect(verifyMagicBytes(buffer)).toBe("png");
		});

		it("should detect TIFF (little-endian) from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.tiff_le);
			expect(verifyMagicBytes(buffer)).toBe("tiff");
		});

		it("should detect TIFF (big-endian) from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.tiff_be);
			expect(verifyMagicBytes(buffer)).toBe("tiff");
		});

		it("should detect WebP from magic bytes", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.webp);
			expect(verifyMagicBytes(buffer)).toBe("webp");
		});

		it("should return null for unrecognized magic bytes", () => {
			const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
			expect(verifyMagicBytes(buffer)).toBeNull();
		});

		it("should return null for buffer too small", () => {
			const buffer = Buffer.from([0x25, 0x50]); // Only 2 bytes
			expect(verifyMagicBytes(buffer)).toBeNull();
		});
	});

	describe("detectFileType", () => {
		it("should detect PDF from MIME type", () => {
			expect(detectFileType("application/pdf")).toBe("pdf");
		});

		it("should detect image from MIME types", () => {
			expect(detectFileType("image/jpeg")).toBe("image");
			expect(detectFileType("image/png")).toBe("image");
			expect(detectFileType("image/tiff")).toBe("image");
			expect(detectFileType("image/webp")).toBe("image");
		});

		it("should detect PDF from filename extension", () => {
			expect(detectFileType(undefined, "invoice.pdf")).toBe("pdf");
		});

		it("should detect image from filename extensions", () => {
			expect(detectFileType(undefined, "invoice.jpg")).toBe("image");
			expect(detectFileType(undefined, "invoice.jpeg")).toBe("image");
			expect(detectFileType(undefined, "invoice.png")).toBe("image");
			expect(detectFileType(undefined, "invoice.tiff")).toBe("image");
			expect(detectFileType(undefined, "invoice.tif")).toBe("image");
			expect(detectFileType(undefined, "invoice.webp")).toBe("image");
		});

		it("should prefer MIME type over filename", () => {
			expect(detectFileType("application/pdf", "invoice.jpg")).toBe(
				"pdf",
			);
		});

		it("should return null for unsupported types", () => {
			expect(detectFileType("text/plain")).toBeNull();
			expect(detectFileType(undefined, "document.docx")).toBeNull();
		});

		it("should handle case-insensitive extensions", () => {
			expect(detectFileType(undefined, "INVOICE.PDF")).toBe("pdf");
			expect(detectFileType(undefined, "Document.PNG")).toBe("image");
		});
	});

	describe("validateInvoiceFile", () => {
		it("should reject files larger than 10MB", () => {
			const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
			const result = validateInvoiceFile(
				largeBuffer,
				"application/pdf",
				"invoice.pdf",
			);

			expect(result).not.toBeNull();
			expect(result?.error.code).toBe("FILE_TOO_LARGE");
			expect(result?.error.message).toContain(
				"exceeds maximum allowed size",
			);
		});

		it("should reject unsupported file types", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = validateInvoiceFile(
				buffer,
				"text/plain",
				"document.txt",
			);

			expect(result).not.toBeNull();
			expect(result?.error.code).toBe("UNSUPPORTED_FILE_TYPE");
		});

		it("should reject files with invalid magic bytes", () => {
			const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05]);
			const result = validateInvoiceFile(
				buffer,
				"application/pdf",
				"invoice.pdf",
			);

			expect(result).not.toBeNull();
			expect(result?.error.code).toBe("INVALID_FILE_FORMAT");
		});

		it("should reject files with mismatched magic bytes and MIME type", () => {
			const pdfBuffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = validateInvoiceFile(
				pdfBuffer,
				"image/jpeg",
				"invoice.jpg",
			);

			expect(result).not.toBeNull();
			expect(result?.error.code).toBe("INVALID_FILE_FORMAT");
			expect(result?.error.message).toContain("doesn't match");
		});

		it("should accept valid PDF files", () => {
			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = validateInvoiceFile(
				buffer,
				"application/pdf",
				"invoice.pdf",
			);

			expect(result).toBeNull();
		});

		it("should accept valid image files", () => {
			const jpegBuffer = createMockBuffer(MAGIC_BYTES.jpeg);
			const pngBuffer = createMockBuffer(MAGIC_BYTES.png);

			expect(
				validateInvoiceFile(jpegBuffer, "image/jpeg", "invoice.jpg"),
			).toBeNull();
			expect(
				validateInvoiceFile(pngBuffer, "image/png", "invoice.png"),
			).toBeNull();
		});
	});

	describe("extractTextFromPdf", () => {
		it("should extract text from PDF successfully", async () => {
			const mockPdfData = {
				text: "Invoice from ACME Corp\nTotal: $500.00",
				numpages: 1,
			};
			pdfParseMock.mockResolvedValue(mockPdfData);

			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe(
					"Invoice from ACME Corp\nTotal: $500.00",
				);
				expect(result.metadata.fileType).toBe("pdf");
				expect(result.metadata.pageCount).toBe(1);
				expect(result.metadata.usedOcr).toBe(false);
			}
		});

		it("should fall back to OCR for scanned PDF with little text", async () => {
			pdfParseMock.mockResolvedValue({
				text: "abc", // Less than 10 characters
				numpages: 1,
			});

			// Mock sharp to return image buffer
			const sharpInstance = sharpMock();
			sharpInstance.toBuffer.mockResolvedValue(Buffer.from("fake image"));

			// Mock tesseract
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "Invoice from scanned PDF\nTotal: $1,000.00",
					confidence: 85,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe(
					"Invoice from scanned PDF\nTotal: $1,000.00",
				);
				expect(result.metadata.usedOcr).toBe(true);
				expect(result.metadata.ocrConfidence).toBe(0.85);
			}
		});

		it("should fall back to OCR when native extraction fails", async () => {
			pdfParseMock.mockRejectedValue(new Error("PDF parsing failed"));

			// Mock sharp to return image buffer
			const sharpInstance = sharpMock();
			sharpInstance.toBuffer.mockResolvedValue(Buffer.from("fake image"));

			// Mock tesseract
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "OCR extracted text",
					confidence: 80,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe("OCR extracted text");
				expect(result.metadata.usedOcr).toBe(true);
			}
		});

		it("should return error when OCR also fails for PDF", async () => {
			pdfParseMock.mockRejectedValue(new Error("PDF parsing failed"));

			// Mock sharp to fail
			const sharpInstance = sharpMock();
			sharpInstance.toBuffer.mockRejectedValue(
				new Error("Sharp processing failed"),
			);

			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("OCR_FAILED");
			}
		});
	});

	describe("extractTextFromImage", () => {
		it("should extract text from image using OCR", async () => {
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "Invoice #12345\nVendor: Test Company\nAmount: $250.00",
					confidence: 92,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.jpeg);
			const result = await extractTextFromImage(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe(
					"Invoice #12345\nVendor: Test Company\nAmount: $250.00",
				);
				expect(result.metadata.fileType).toBe("image");
				expect(result.metadata.usedOcr).toBe(true);
				expect(result.metadata.ocrConfidence).toBe(0.92);
			}
		});

		it("should return error for empty OCR result", async () => {
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "   ",
					confidence: 50,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.jpeg);
			const result = await extractTextFromImage(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EMPTY_DOCUMENT");
			}
		});

		it("should handle OCR errors", async () => {
			tesseractMock.recognize.mockRejectedValue(
				new Error("Tesseract processing failed"),
			);

			const buffer = createMockBuffer(MAGIC_BYTES.jpeg);
			const result = await extractTextFromImage(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("OCR_FAILED");
				expect(result.error.message).toContain(
					"Tesseract processing failed",
				);
			}
		});
	});

	describe("extractTextFromInvoiceDocument", () => {
		it("should reject files larger than 10MB", async () => {
			const largeBuffer = Buffer.alloc(11 * 1024 * 1024);
			const result = await extractTextFromInvoiceDocument(
				largeBuffer,
				"application/pdf",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("FILE_TOO_LARGE");
			}
		});

		it("should reject unsupported file types", async () => {
			const buffer = Buffer.from("some content");
			const result = await extractTextFromInvoiceDocument(
				buffer,
				"text/plain",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("UNSUPPORTED_FILE_TYPE");
			}
		});

		it("should route PDF files to PDF extractor", async () => {
			pdfParseMock.mockResolvedValue({
				text: "PDF invoice content",
				numpages: 1,
			});

			const buffer = createMockBuffer(MAGIC_BYTES.pdf);
			const result = await extractTextFromInvoiceDocument(
				buffer,
				"application/pdf",
			);

			expect(pdfParseMock).toHaveBeenCalled();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.metadata.fileType).toBe("pdf");
			}
		});

		it("should route image files to OCR extractor", async () => {
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "Image invoice content",
					confidence: 90,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.jpeg);
			const result = await extractTextFromInvoiceDocument(
				buffer,
				"image/jpeg",
			);

			expect(tesseractMock.recognize).toHaveBeenCalled();
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.metadata.fileType).toBe("image");
				expect(result.metadata.usedOcr).toBe(true);
			}
		});

		it("should detect file type from filename when MIME type is missing", async () => {
			tesseractMock.recognize.mockResolvedValue({
				data: {
					text: "Invoice from filename detection",
					confidence: 88,
				},
			});

			const buffer = createMockBuffer(MAGIC_BYTES.png);
			const result = await extractTextFromInvoiceDocument(
				buffer,
				undefined,
				"invoice.png",
			);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.metadata.fileType).toBe("image");
			}
		});
	});
});
