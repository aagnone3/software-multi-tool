import { describe, expect, it, vi } from "vitest";
import type { StorageProvider } from "./types";
import {
	audioUploadRules,
	avatarUploadRules,
	createUploadValidator,
	documentUploadRules,
	imageUploadRules,
	videoUploadRules,
	withValidation,
} from "./validation";

// Real PNG file header (magic bytes)
const PNG_HEADER = Buffer.from([
	0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
	0x49, 0x48, 0x44, 0x52,
]);

// Real JPEG file header (magic bytes)
const JPEG_HEADER = Buffer.from([
	0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46,
]);

// Real GIF file header (magic bytes) - available for future tests
const _GIF_HEADER = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);

// Real PDF file header (magic bytes)
const PDF_HEADER = Buffer.from("%PDF-1.4");

// Create a buffer of specified size with PNG header
function createPngBuffer(size: number): Buffer {
	const buffer = Buffer.alloc(size);
	PNG_HEADER.copy(buffer);
	return buffer;
}

// Create a buffer of specified size with JPEG header
function createJpegBuffer(size: number): Buffer {
	const buffer = Buffer.alloc(size);
	JPEG_HEADER.copy(buffer);
	return buffer;
}

// Create a buffer of specified size with PDF header
function createPdfBuffer(size: number): Buffer {
	const buffer = Buffer.alloc(size);
	PDF_HEADER.copy(buffer);
	return buffer;
}

// Create a plain text buffer
function createTextBuffer(content: string): Buffer {
	return Buffer.from(content);
}

describe("createUploadValidator", () => {
	describe("empty file validation", () => {
		it("rejects empty files by default", async () => {
			const validator = createUploadValidator({});
			const result = await validator.validate({
				buffer: Buffer.alloc(0),
				filename: "empty.txt",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("EMPTY_FILE");
				expect(result.error.message).toBe("File is empty");
				expect(result.error.details?.actual).toBe(0);
			}
		});

		it("allows empty files when allowEmpty is true", async () => {
			const validator = createUploadValidator({ allowEmpty: true });
			const result = await validator.validate({
				buffer: Buffer.alloc(0),
				filename: "empty.txt",
			});

			expect(result.success).toBe(true);
		});
	});

	describe("size validation", () => {
		it("accepts files under maxSize", async () => {
			const validator = createUploadValidator({
				maxSize: 1024, // 1KB
			});

			const result = await validator.validate({
				buffer: createTextBuffer("small file"),
				filename: "small.txt",
			});

			expect(result.success).toBe(true);
		});

		it("accepts files exactly at maxSize", async () => {
			const validator = createUploadValidator({
				maxSize: 10,
			});

			const result = await validator.validate({
				buffer: createTextBuffer("exactly 10"),
				filename: "exact.txt",
			});

			expect(result.success).toBe(true);
		});

		it("rejects files over maxSize", async () => {
			const validator = createUploadValidator({
				maxSize: 5,
			});

			const result = await validator.validate({
				buffer: createTextBuffer("too large file"),
				filename: "large.txt",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("FILE_TOO_LARGE");
				expect(result.error.message).toContain("exceeds maximum");
				expect(result.error.details?.actual).toBe(14);
				expect(result.error.details?.maxAllowed).toBe(5);
			}
		});

		it("formats sizes in human-readable format", async () => {
			const validator = createUploadValidator({
				maxSize: 1024 * 1024, // 1MB
			});

			const largeBuffer = Buffer.alloc(2 * 1024 * 1024); // 2MB
			const result = await validator.validate({
				buffer: largeBuffer,
				filename: "large.bin",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.message).toContain("2 MB");
				expect(result.error.message).toContain("1 MB");
			}
		});
	});

	describe("extension validation", () => {
		it("accepts allowed extensions (case-insensitive)", async () => {
			const validator = createUploadValidator({
				allowedExtensions: [".jpg", ".png"],
			});

			const result1 = await validator.validate({
				buffer: createPngBuffer(100),
				filename: "image.png",
			});
			expect(result1.success).toBe(true);

			const result2 = await validator.validate({
				buffer: createPngBuffer(100),
				filename: "image.PNG",
			});
			expect(result2.success).toBe(true);

			const result3 = await validator.validate({
				buffer: createJpegBuffer(100),
				filename: "image.JPG",
			});
			expect(result3.success).toBe(true);
		});

		it("rejects disallowed extensions", async () => {
			const validator = createUploadValidator({
				allowedExtensions: [".jpg", ".png"],
			});

			const result = await validator.validate({
				buffer: createTextBuffer("not an image"),
				filename: "file.txt",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_EXTENSION");
				expect(result.error.message).toContain(".txt");
				expect(result.error.details?.actual).toBe(".txt");
				expect(result.error.details?.expected).toEqual([
					".jpg",
					".png",
				]);
			}
		});

		it("handles files without extensions", async () => {
			const validator = createUploadValidator({
				allowedExtensions: [".jpg", ".png"],
			});

			const result = await validator.validate({
				buffer: createTextBuffer("no extension"),
				filename: "noextension",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_EXTENSION");
				expect(result.error.details?.actual).toBe("");
			}
		});
	});

	describe("MIME type validation", () => {
		it("accepts allowed MIME types based on file content", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["image/png", "image/jpeg"],
			});

			const result = await validator.validate({
				buffer: createPngBuffer(100),
				filename: "image.png",
			});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.detectedMimeType).toBe("image/png");
			}
		});

		it("rejects disallowed MIME types", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["image/png"],
			});

			const result = await validator.validate({
				buffer: createJpegBuffer(100),
				filename: "image.jpg",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_MIME_TYPE");
				expect(result.error.message).toContain("image/jpeg");
				expect(result.error.details?.actual).toBe("image/jpeg");
			}
		});

		it("supports wildcard MIME patterns (image/*)", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["image/*"],
			});

			const pngResult = await validator.validate({
				buffer: createPngBuffer(100),
				filename: "image.png",
			});
			expect(pngResult.success).toBe(true);

			const jpegResult = await validator.validate({
				buffer: createJpegBuffer(100),
				filename: "image.jpg",
			});
			expect(jpegResult.success).toBe(true);
		});

		it("supports universal wildcard (*/*)", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["*/*"],
			});

			const result = await validator.validate({
				buffer: createPdfBuffer(100),
				filename: "doc.pdf",
			});

			expect(result.success).toBe(true);
		});

		it("falls back to claimed MIME type when detection fails", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["text/plain"],
			});

			// Plain text doesn't have magic bytes
			const result = await validator.validate({
				buffer: createTextBuffer("Hello, world!"),
				filename: "hello.txt",
				mimeType: "text/plain",
			});

			expect(result.success).toBe(true);
		});

		it("falls back to application/octet-stream when no MIME info available", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["application/octet-stream"],
			});

			const result = await validator.validate({
				buffer: createTextBuffer("random data"),
				filename: "data.bin",
			});

			expect(result.success).toBe(true);
		});

		it("rejects when detection fails and no fallback allowed", async () => {
			const validator = createUploadValidator({
				allowedMimeTypes: ["image/png"],
			});

			const result = await validator.validate({
				buffer: createTextBuffer("not an image"),
				filename: "fake.png",
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.code).toBe("INVALID_MIME_TYPE");
			}
		});
	});

	describe("combined validation", () => {
		it("validates size, extension, and MIME type together", async () => {
			const validator = createUploadValidator({
				maxSize: 1024,
				allowedExtensions: [".png"],
				allowedMimeTypes: ["image/png"],
			});

			// Valid file
			const validResult = await validator.validate({
				buffer: createPngBuffer(500),
				filename: "image.png",
			});
			expect(validResult.success).toBe(true);

			// Too large
			const largeResult = await validator.validate({
				buffer: createPngBuffer(2000),
				filename: "image.png",
			});
			expect(largeResult.success).toBe(false);
			if (!largeResult.success) {
				expect(largeResult.error.code).toBe("FILE_TOO_LARGE");
			}

			// Wrong extension (checked before MIME)
			const wrongExtResult = await validator.validate({
				buffer: createPngBuffer(500),
				filename: "image.jpg",
			});
			expect(wrongExtResult.success).toBe(false);
			if (!wrongExtResult.success) {
				expect(wrongExtResult.error.code).toBe("INVALID_EXTENSION");
			}

			// Wrong MIME (extension passes but content fails)
			const wrongMimeResult = await validator.validate({
				buffer: createJpegBuffer(500),
				filename: "fake.png",
			});
			expect(wrongMimeResult.success).toBe(false);
			if (!wrongMimeResult.success) {
				expect(wrongMimeResult.error.code).toBe("INVALID_MIME_TYPE");
			}
		});

		it("stops at first validation failure", async () => {
			const validator = createUploadValidator({
				maxSize: 100, // Will fail first
				allowedExtensions: [".png"],
				allowedMimeTypes: ["image/png"],
			});

			const result = await validator.validate({
				buffer: Buffer.alloc(500), // Fails size
				filename: "file.txt", // Would also fail extension
			});

			expect(result.success).toBe(false);
			if (!result.success) {
				// Size is checked first
				expect(result.error.code).toBe("FILE_TOO_LARGE");
			}
		});
	});

	describe("options property", () => {
		it("exposes frozen options", () => {
			const options = {
				maxSize: 1024,
				allowedExtensions: [".png"],
			};
			const validator = createUploadValidator(options);

			expect(validator.options).toEqual(options);
			expect(Object.isFrozen(validator.options)).toBe(true);
		});
	});
});

describe("preset upload rules", () => {
	describe("imageUploadRules", () => {
		it("has correct configuration", () => {
			expect(imageUploadRules.maxSize).toBe(5 * 1024 * 1024);
			expect(imageUploadRules.allowedMimeTypes).toContain("image/jpeg");
			expect(imageUploadRules.allowedMimeTypes).toContain("image/png");
			expect(imageUploadRules.allowedMimeTypes).toContain("image/gif");
			expect(imageUploadRules.allowedMimeTypes).toContain("image/webp");
			expect(imageUploadRules.allowedMimeTypes).toContain(
				"image/svg+xml",
			);
			expect(imageUploadRules.allowedExtensions).toContain(".jpg");
			expect(imageUploadRules.allowedExtensions).toContain(".png");
			expect(imageUploadRules.allowedExtensions).toContain(".svg");
		});

		it("works with createUploadValidator", async () => {
			const validator = createUploadValidator(imageUploadRules);
			const result = await validator.validate({
				buffer: createPngBuffer(1000),
				filename: "image.png",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("documentUploadRules", () => {
		it("has correct configuration", () => {
			expect(documentUploadRules.maxSize).toBe(10 * 1024 * 1024);
			expect(documentUploadRules.allowedMimeTypes).toContain(
				"application/pdf",
			);
			expect(documentUploadRules.allowedMimeTypes).toContain(
				"text/plain",
			);
			expect(documentUploadRules.allowedExtensions).toContain(".pdf");
			expect(documentUploadRules.allowedExtensions).toContain(".txt");
		});

		it("works with createUploadValidator", async () => {
			const validator = createUploadValidator(documentUploadRules);
			const result = await validator.validate({
				buffer: createPdfBuffer(1000),
				filename: "document.pdf",
			});
			expect(result.success).toBe(true);
		});
	});

	describe("avatarUploadRules", () => {
		it("has stricter limits than general images", () => {
			expect(avatarUploadRules.maxSize).toBe(2 * 1024 * 1024);
			expect(avatarUploadRules.allowedMimeTypes).not.toContain(
				"image/svg+xml",
			);
			expect(avatarUploadRules.allowedMimeTypes).not.toContain(
				"image/gif",
			);
		});
	});

	describe("videoUploadRules", () => {
		it("has appropriate size limit", () => {
			expect(videoUploadRules.maxSize).toBe(100 * 1024 * 1024);
			expect(videoUploadRules.allowedMimeTypes).toContain("video/mp4");
			expect(videoUploadRules.allowedExtensions).toContain(".mp4");
		});
	});

	describe("audioUploadRules", () => {
		it("has appropriate size limit", () => {
			expect(audioUploadRules.maxSize).toBe(20 * 1024 * 1024);
			expect(audioUploadRules.allowedMimeTypes).toContain("audio/mpeg");
			expect(audioUploadRules.allowedExtensions).toContain(".mp3");
		});
	});
});

describe("withValidation", () => {
	const createMockProvider = (): StorageProvider => ({
		name: "mock",
		upload: vi.fn().mockResolvedValue({
			key: "test/file.png",
			bucket: "uploads",
			size: 100,
			etag: '"abc123"',
		}),
		getSignedUploadUrl: vi
			.fn()
			.mockResolvedValue("https://example.com/upload"),
		getSignedDownloadUrl: vi
			.fn()
			.mockResolvedValue("https://example.com/download"),
		delete: vi.fn().mockResolvedValue(undefined),
		exists: vi.fn().mockResolvedValue(true),
	});

	it("creates a validated provider with correct name", () => {
		const provider = createMockProvider();
		const validator = createUploadValidator(imageUploadRules);
		const validated = withValidation(provider, validator);

		expect(validated.name).toBe("mock");
		expect(validated.provider).toBe(provider);
		expect(validated.validator).toBe(validator);
	});

	it("passes through non-upload methods", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator(imageUploadRules);
		const validated = withValidation(provider, validator);

		await validated.getSignedUploadUrl("test.png", {
			bucket: "uploads",
		});
		expect(provider.getSignedUploadUrl).toHaveBeenCalledWith("test.png", {
			bucket: "uploads",
		});

		await validated.getSignedDownloadUrl("test.png", {
			bucket: "uploads",
		});
		expect(provider.getSignedDownloadUrl).toHaveBeenCalled();

		await validated.delete("test.png", "uploads");
		expect(provider.delete).toHaveBeenCalledWith("test.png", "uploads");

		await validated.exists("test.png", "uploads");
		expect(provider.exists).toHaveBeenCalledWith("test.png", "uploads");
	});

	it("validates before uploading", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator({
			maxSize: 1024,
			allowedMimeTypes: ["image/png"],
			allowedExtensions: [".png"],
		});
		const validated = withValidation(provider, validator);

		const result = await validated.upload(
			"test/file.png",
			createPngBuffer(500),
			{
				bucket: "uploads",
				filename: "file.png",
			},
		);

		expect(result.success).not.toBe(false);
		expect(provider.upload).toHaveBeenCalled();
	});

	it("returns validation error without uploading when validation fails", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator({
			maxSize: 100,
		});
		const validated = withValidation(provider, validator);

		const result = await validated.upload(
			"test/file.png",
			createPngBuffer(500),
			{
				bucket: "uploads",
				filename: "file.png",
			},
		);

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.code).toBe("FILE_TOO_LARGE");
		}
		expect(provider.upload).not.toHaveBeenCalled();
	});

	it("uses detected MIME type when no content type specified", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator({
			allowedMimeTypes: ["image/png"],
		});
		const validated = withValidation(provider, validator);

		await validated.upload("test/file.png", createPngBuffer(500), {
			bucket: "uploads",
			filename: "file.png",
		});

		expect(provider.upload).toHaveBeenCalledWith(
			"test/file.png",
			expect.any(Buffer),
			expect.objectContaining({
				contentType: "image/png",
			}),
		);
	});

	it("preserves specified content type", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator({});
		const validated = withValidation(provider, validator);

		await validated.upload("test/file.png", createPngBuffer(500), {
			bucket: "uploads",
			filename: "file.png",
			contentType: "application/custom",
		});

		expect(provider.upload).toHaveBeenCalledWith(
			"test/file.png",
			expect.any(Buffer),
			expect.objectContaining({
				contentType: "application/custom",
			}),
		);
	});

	it("includes validation result in upload result", async () => {
		const provider = createMockProvider();
		const validator = createUploadValidator({
			allowedMimeTypes: ["image/png"],
		});
		const validated = withValidation(provider, validator);

		const result = await validated.upload(
			"test/file.png",
			createPngBuffer(500),
			{
				bucket: "uploads",
				filename: "file.png",
			},
		);

		expect(result.success).not.toBe(false);
		if ("validation" in result) {
			expect(result.validation.success).toBe(true);
			expect(result.key).toBe("test/file.png");
			expect(result.bucket).toBe("uploads");
		}
	});
});
