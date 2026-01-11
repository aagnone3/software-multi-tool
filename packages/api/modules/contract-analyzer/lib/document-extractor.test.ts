import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	MAX_CONTRACT_FILE_SIZE,
	SUPPORTED_EXTENSIONS,
	SUPPORTED_MIME_TYPES,
	detectFileType,
	extractTextFromDocument,
	extractTextFromDocx,
	extractTextFromPdf,
	extractTextFromTxt,
} from "./document-extractor";

const pdfParseMock = vi.hoisted(() => vi.fn());
const mammothMock = vi.hoisted(() => ({
	extractRawText: vi.fn(),
}));
const loggerMock = vi.hoisted(() => ({
	warn: vi.fn(),
}));

vi.mock("pdf-parse", () => ({
	default: pdfParseMock,
}));

vi.mock("mammoth", () => ({
	extractRawText: mammothMock.extractRawText,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

describe("document-extractor", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("constants", () => {
		it("should have MAX_CONTRACT_FILE_SIZE set to 25MB", () => {
			expect(MAX_CONTRACT_FILE_SIZE).toBe(25 * 1024 * 1024);
		});

		it("should support PDF, DOCX, and TXT MIME types", () => {
			expect(SUPPORTED_MIME_TYPES).toContain("application/pdf");
			expect(SUPPORTED_MIME_TYPES).toContain(
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			);
			expect(SUPPORTED_MIME_TYPES).toContain("text/plain");
		});

		it("should support .pdf, .docx, and .txt extensions", () => {
			expect(SUPPORTED_EXTENSIONS).toContain(".pdf");
			expect(SUPPORTED_EXTENSIONS).toContain(".docx");
			expect(SUPPORTED_EXTENSIONS).toContain(".txt");
		});
	});

	describe("detectFileType", () => {
		it("should detect PDF from MIME type", () => {
			expect(detectFileType("application/pdf")).toBe("pdf");
		});

		it("should detect DOCX from MIME type", () => {
			expect(
				detectFileType(
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				),
			).toBe("docx");
		});

		it("should detect TXT from MIME type", () => {
			expect(detectFileType("text/plain")).toBe("txt");
		});

		it("should detect PDF from filename extension", () => {
			expect(detectFileType(undefined, "contract.pdf")).toBe("pdf");
		});

		it("should detect DOCX from filename extension", () => {
			expect(detectFileType(undefined, "contract.docx")).toBe("docx");
		});

		it("should detect TXT from filename extension", () => {
			expect(detectFileType(undefined, "contract.txt")).toBe("txt");
		});

		it("should prefer MIME type over filename", () => {
			expect(detectFileType("application/pdf", "contract.docx")).toBe(
				"pdf",
			);
		});

		it("should return null for unsupported types", () => {
			expect(detectFileType("image/png")).toBeNull();
			expect(detectFileType(undefined, "image.png")).toBeNull();
		});

		it("should handle case-insensitive extensions", () => {
			expect(detectFileType(undefined, "CONTRACT.PDF")).toBe("pdf");
			expect(detectFileType(undefined, "Document.DOCX")).toBe("docx");
		});
	});

	describe("extractTextFromPdf", () => {
		it("should extract text from PDF successfully", async () => {
			const mockPdfData = {
				text: "This is a sample contract text from a PDF.",
				numpages: 3,
			};
			pdfParseMock.mockResolvedValue(mockPdfData);

			const buffer = Buffer.from("fake pdf content");
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe(
					"This is a sample contract text from a PDF.",
				);
				expect(result.metadata.fileType).toBe("pdf");
				expect(result.metadata.pageCount).toBe(3);
				expect(result.metadata.characterCount).toBe(42);
			}
		});

		it("should return error for empty PDF", async () => {
			pdfParseMock.mockResolvedValue({
				text: "   ",
				numpages: 1,
			});

			const buffer = Buffer.from("fake pdf content");
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EMPTY_DOCUMENT");
				expect(result.error.message).toContain(
					"PDF appears to be empty or contains only images",
				);
			}
		});

		it("should handle PDF parsing errors", async () => {
			pdfParseMock.mockRejectedValue(new Error("Invalid PDF structure"));

			const buffer = Buffer.from("corrupted pdf");
			const result = await extractTextFromPdf(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EXTRACTION_FAILED");
				expect(result.error.message).toContain("Invalid PDF structure");
			}
		});
	});

	describe("extractTextFromDocx", () => {
		it("should extract text from DOCX successfully", async () => {
			mammothMock.extractRawText.mockResolvedValue({
				value: "This is a sample contract from a Word document.",
				messages: [],
			});

			const buffer = Buffer.from("fake docx content");
			const result = await extractTextFromDocx(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe(
					"This is a sample contract from a Word document.",
				);
				expect(result.metadata.fileType).toBe("docx");
				expect(result.metadata.characterCount).toBe(47);
			}
		});

		it("should return error for empty DOCX", async () => {
			mammothMock.extractRawText.mockResolvedValue({
				value: "   ",
				messages: [],
			});

			const buffer = Buffer.from("fake docx content");
			const result = await extractTextFromDocx(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EMPTY_DOCUMENT");
				expect(result.error.message).toContain(
					"Word document appears to be empty",
				);
			}
		});

		it("should handle DOCX parsing errors", async () => {
			mammothMock.extractRawText.mockRejectedValue(
				new Error("Corrupted DOCX file"),
			);

			const buffer = Buffer.from("corrupted docx");
			const result = await extractTextFromDocx(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EXTRACTION_FAILED");
				expect(result.error.message).toContain("Corrupted DOCX file");
			}
		});

		it("should log warnings from mammoth", async () => {
			mammothMock.extractRawText.mockResolvedValue({
				value: "Some text",
				messages: [{ type: "warning", message: "Some warning" }],
			});

			const buffer = Buffer.from("fake docx content");
			await extractTextFromDocx(buffer);

			expect(loggerMock.warn).toHaveBeenCalledWith(
				"DOCX extraction warnings",
				{ messages: expect.any(Array) },
			);
		});
	});

	describe("extractTextFromTxt", () => {
		it("should extract text from TXT successfully", () => {
			const buffer = Buffer.from("This is plain text content.");
			const result = extractTextFromTxt(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe("This is plain text content.");
				expect(result.metadata.fileType).toBe("txt");
				expect(result.metadata.characterCount).toBe(27);
			}
		});

		it("should return error for empty TXT", () => {
			const buffer = Buffer.from("   ");
			const result = extractTextFromTxt(buffer);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EMPTY_DOCUMENT");
				expect(result.error.message).toContain("text file is empty");
			}
		});

		it("should trim whitespace from text", () => {
			const buffer = Buffer.from("  \n  Some text with whitespace  \n  ");
			const result = extractTextFromTxt(buffer);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe("Some text with whitespace");
			}
		});
	});

	describe("extractTextFromDocument", () => {
		it("should reject files larger than 25MB", async () => {
			const largeBuffer = Buffer.alloc(26 * 1024 * 1024);
			const result = await extractTextFromDocument(
				largeBuffer,
				"application/pdf",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("FILE_TOO_LARGE");
				expect(result.error.message).toContain(
					"exceeds maximum allowed size",
				);
			}
		});

		it("should reject unsupported file types", async () => {
			const buffer = Buffer.from("some content");
			const result = await extractTextFromDocument(buffer, "image/png");

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("UNSUPPORTED_FILE_TYPE");
				expect(result.error.message).toContain("Unsupported file type");
			}
		});

		it("should route PDF files to PDF extractor", async () => {
			pdfParseMock.mockResolvedValue({
				text: "PDF content",
				numpages: 1,
			});

			const buffer = Buffer.from("pdf content");
			const result = await extractTextFromDocument(
				buffer,
				"application/pdf",
			);

			expect(pdfParseMock).toHaveBeenCalledWith(buffer);
			expect(result.success).toBe(true);
		});

		it("should route DOCX files to DOCX extractor", async () => {
			mammothMock.extractRawText.mockResolvedValue({
				value: "DOCX content",
				messages: [],
			});

			const buffer = Buffer.from("docx content");
			const result = await extractTextFromDocument(
				buffer,
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			);

			expect(mammothMock.extractRawText).toHaveBeenCalledWith({ buffer });
			expect(result.success).toBe(true);
		});

		it("should route TXT files to TXT extractor", async () => {
			const buffer = Buffer.from("Plain text content");
			const result = await extractTextFromDocument(buffer, "text/plain");

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.text).toBe("Plain text content");
				expect(result.metadata.fileType).toBe("txt");
			}
		});

		it("should detect file type from filename when MIME type is missing", async () => {
			const buffer = Buffer.from("Plain text from file");
			const result = await extractTextFromDocument(
				buffer,
				undefined,
				"contract.txt",
			);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.metadata.fileType).toBe("txt");
			}
		});
	});
});
