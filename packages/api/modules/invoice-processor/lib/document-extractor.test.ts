import { describe, expect, it } from "vitest";
import {
	detectFileType,
	MAX_INVOICE_FILE_SIZE,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MIME_TYPES,
	validateInvoiceFile,
	verifyMagicBytes,
} from "./document-extractor";

describe("document-extractor constants", () => {
	it("should export supported MIME types including PDF and images", () => {
		expect(SUPPORTED_MIME_TYPES).toContain("application/pdf");
		expect(SUPPORTED_MIME_TYPES).toContain("image/jpeg");
		expect(SUPPORTED_MIME_TYPES).toContain("image/png");
		expect(SUPPORTED_MIME_TYPES).toContain("image/tiff");
		expect(SUPPORTED_MIME_TYPES).toContain("image/webp");
	});

	it("should export supported extensions including pdf and image types", () => {
		expect(SUPPORTED_EXTENSIONS).toContain(".pdf");
		expect(SUPPORTED_EXTENSIONS).toContain(".jpg");
		expect(SUPPORTED_EXTENSIONS).toContain(".jpeg");
		expect(SUPPORTED_EXTENSIONS).toContain(".png");
		expect(SUPPORTED_EXTENSIONS).toContain(".tiff");
		expect(SUPPORTED_EXTENSIONS).toContain(".webp");
	});

	it("should set max file size to 10MB", () => {
		expect(MAX_INVOICE_FILE_SIZE).toBe(10 * 1024 * 1024);
	});
});

describe("verifyMagicBytes", () => {
	it("should detect PDF magic bytes", () => {
		const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46, 0x00]);
		expect(verifyMagicBytes(buffer)).toBe("pdf");
	});

	it("should detect JPEG magic bytes", () => {
		const buffer = Buffer.from([0xff, 0xd8, 0xff, 0x00]);
		expect(verifyMagicBytes(buffer)).toBe("jpeg");
	});

	it("should detect PNG magic bytes", () => {
		const buffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00]);
		expect(verifyMagicBytes(buffer)).toBe("png");
	});

	it("should detect TIFF little-endian magic bytes", () => {
		const buffer = Buffer.from([0x49, 0x49, 0x2a, 0x00]);
		expect(verifyMagicBytes(buffer)).toBe("tiff");
	});

	it("should detect TIFF big-endian magic bytes", () => {
		const buffer = Buffer.from([0x4d, 0x4d, 0x00, 0x2a]);
		expect(verifyMagicBytes(buffer)).toBe("tiff");
	});

	it("should detect WebP magic bytes (RIFF...WEBP)", () => {
		const buffer = Buffer.alloc(12);
		// RIFF header
		buffer[0] = 0x52; // R
		buffer[1] = 0x49; // I
		buffer[2] = 0x46; // F
		buffer[3] = 0x46; // F
		// WEBP at offset 8
		buffer[8] = 0x57; // W
		buffer[9] = 0x45; // E
		buffer[10] = 0x42; // B
		buffer[11] = 0x50; // P
		expect(verifyMagicBytes(buffer)).toBe("webp");
	});

	it("should return null for unknown magic bytes", () => {
		const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03]);
		expect(verifyMagicBytes(buffer)).toBeNull();
	});

	it("should return null for too-short buffer", () => {
		const buffer = Buffer.from([0x25, 0x50]);
		expect(verifyMagicBytes(buffer)).toBeNull();
	});
});

describe("detectFileType", () => {
	it("should detect PDF by MIME type", () => {
		expect(detectFileType("application/pdf")).toBe("pdf");
	});

	it("should detect image by MIME type", () => {
		expect(detectFileType("image/jpeg")).toBe("image");
		expect(detectFileType("image/png")).toBe("image");
		expect(detectFileType("image/tiff")).toBe("image");
		expect(detectFileType("image/webp")).toBe("image");
	});

	it("should detect PDF by extension when no MIME type", () => {
		expect(detectFileType(undefined, "invoice.pdf")).toBe("pdf");
	});

	it("should detect image by extension when no MIME type", () => {
		expect(detectFileType(undefined, "scan.jpg")).toBe("image");
		expect(detectFileType(undefined, "scan.PNG")).toBe("image");
		expect(detectFileType(undefined, "scan.tiff")).toBe("image");
	});

	it("should return null for unsupported MIME type", () => {
		expect(detectFileType("application/zip")).toBeNull();
	});

	it("should return null when no MIME type and unsupported extension", () => {
		expect(detectFileType(undefined, "doc.docx")).toBeNull();
	});

	it("should return null when both undefined", () => {
		expect(detectFileType()).toBeNull();
	});
});

describe("validateInvoiceFile", () => {
	function makePdfBuffer(size = 100): Buffer {
		const buf = Buffer.alloc(size, 0);
		buf[0] = 0x25; // %
		buf[1] = 0x50; // P
		buf[2] = 0x44; // D
		buf[3] = 0x46; // F
		return buf;
	}

	function makeJpegBuffer(size = 100): Buffer {
		const buf = Buffer.alloc(size, 0);
		buf[0] = 0xff;
		buf[1] = 0xd8;
		buf[2] = 0xff;
		return buf;
	}

	it("should return null for a valid PDF buffer", () => {
		const result = validateInvoiceFile(
			makePdfBuffer(),
			"application/pdf",
			"invoice.pdf",
		);
		expect(result).toBeNull();
	});

	it("should return null for a valid JPEG buffer", () => {
		const result = validateInvoiceFile(
			makeJpegBuffer(),
			"image/jpeg",
			"photo.jpg",
		);
		expect(result).toBeNull();
	});

	it("should return FILE_TOO_LARGE when buffer exceeds 10MB", () => {
		const bigBuffer = Buffer.alloc(MAX_INVOICE_FILE_SIZE + 1, 0x25);
		bigBuffer[1] = 0x50;
		bigBuffer[2] = 0x44;
		bigBuffer[3] = 0x46;
		const result = validateInvoiceFile(bigBuffer, "application/pdf");
		expect(result).not.toBeNull();
		expect(result?.error.code).toBe("FILE_TOO_LARGE");
	});

	it("should return UNSUPPORTED_FILE_TYPE for unsupported MIME type", () => {
		const buffer = makePdfBuffer();
		const result = validateInvoiceFile(
			buffer,
			"application/zip",
			"file.zip",
		);
		expect(result).not.toBeNull();
		expect(result?.error.code).toBe("UNSUPPORTED_FILE_TYPE");
	});

	it("should return INVALID_FILE_FORMAT for empty/unrecognized buffer", () => {
		const buffer = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x00]);
		const result = validateInvoiceFile(buffer, "application/pdf");
		expect(result).not.toBeNull();
		expect(result?.error.code).toBe("INVALID_FILE_FORMAT");
	});

	it("should return INVALID_FILE_FORMAT when magic bytes mismatch claimed MIME type", () => {
		// JPEG bytes but claiming PDF
		const result = validateInvoiceFile(
			makeJpegBuffer(),
			"application/pdf",
			"invoice.pdf",
		);
		expect(result).not.toBeNull();
		expect(result?.error.code).toBe("INVALID_FILE_FORMAT");
	});
});
