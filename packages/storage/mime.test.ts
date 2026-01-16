import { describe, expect, it } from "vitest";
import {
	inferMimeType,
	isImageMimeType,
	SUPPORTED_IMAGE_EXTENSIONS,
	SUPPORTED_IMAGE_MIME_TYPES,
} from "./mime";

describe("inferMimeType", () => {
	describe("image formats", () => {
		it("infers JPEG from .jpg extension", () => {
			expect(inferMimeType("photo.jpg")).toBe("image/jpeg");
		});

		it("infers JPEG from .jpeg extension", () => {
			expect(inferMimeType("photo.jpeg")).toBe("image/jpeg");
		});

		it("infers PNG from .png extension", () => {
			expect(inferMimeType("image.png")).toBe("image/png");
		});

		it("infers GIF from .gif extension", () => {
			expect(inferMimeType("animation.gif")).toBe("image/gif");
		});

		it("infers WebP from .webp extension", () => {
			expect(inferMimeType("modern.webp")).toBe("image/webp");
		});

		it("infers SVG from .svg extension", () => {
			expect(inferMimeType("vector.svg")).toBe("image/svg+xml");
		});

		it("infers ICO from .ico extension", () => {
			expect(inferMimeType("favicon.ico")).toBe("image/x-icon");
		});

		it("infers BMP from .bmp extension", () => {
			expect(inferMimeType("bitmap.bmp")).toBe("image/bmp");
		});

		it("infers TIFF from .tiff extension", () => {
			expect(inferMimeType("scan.tiff")).toBe("image/tiff");
		});

		it("infers TIFF from .tif extension", () => {
			expect(inferMimeType("scan.tif")).toBe("image/tiff");
		});

		it("infers AVIF from .avif extension", () => {
			expect(inferMimeType("modern.avif")).toBe("image/avif");
		});

		it("infers HEIC from .heic extension", () => {
			expect(inferMimeType("iphone.heic")).toBe("image/heic");
		});

		it("infers HEIF from .heif extension", () => {
			expect(inferMimeType("iphone.heif")).toBe("image/heif");
		});
	});

	describe("document formats", () => {
		it("infers PDF from .pdf extension", () => {
			expect(inferMimeType("document.pdf")).toBe("application/pdf");
		});

		it("infers Word from .doc extension", () => {
			expect(inferMimeType("report.doc")).toBe("application/msword");
		});

		it("infers Word from .docx extension", () => {
			expect(inferMimeType("report.docx")).toBe(
				"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
			);
		});

		it("infers Excel from .xls extension", () => {
			expect(inferMimeType("data.xls")).toBe("application/vnd.ms-excel");
		});

		it("infers Excel from .xlsx extension", () => {
			expect(inferMimeType("data.xlsx")).toBe(
				"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
			);
		});

		it("infers PowerPoint from .ppt extension", () => {
			expect(inferMimeType("slides.ppt")).toBe(
				"application/vnd.ms-powerpoint",
			);
		});

		it("infers PowerPoint from .pptx extension", () => {
			expect(inferMimeType("slides.pptx")).toBe(
				"application/vnd.openxmlformats-officedocument.presentationml.presentation",
			);
		});

		it("infers plain text from .txt extension", () => {
			expect(inferMimeType("readme.txt")).toBe("text/plain");
		});

		it("infers markdown from .md extension", () => {
			expect(inferMimeType("README.md")).toBe("text/markdown");
		});

		it("infers CSV from .csv extension", () => {
			expect(inferMimeType("data.csv")).toBe("text/csv");
		});

		it("infers JSON from .json extension", () => {
			expect(inferMimeType("config.json")).toBe("application/json");
		});

		it("infers XML from .xml extension", () => {
			expect(inferMimeType("data.xml")).toBe("application/xml");
		});
	});

	describe("video formats", () => {
		it("infers MP4 from .mp4 extension", () => {
			expect(inferMimeType("video.mp4")).toBe("video/mp4");
		});

		it("infers WebM from .webm extension", () => {
			expect(inferMimeType("video.webm")).toBe("video/webm");
		});

		it("infers QuickTime from .mov extension", () => {
			expect(inferMimeType("video.mov")).toBe("video/quicktime");
		});

		it("infers AVI from .avi extension", () => {
			expect(inferMimeType("video.avi")).toBe("video/x-msvideo");
		});

		it("infers Matroska from .mkv extension", () => {
			expect(inferMimeType("video.mkv")).toBe("video/x-matroska");
		});
	});

	describe("audio formats", () => {
		it("infers MP3 from .mp3 extension", () => {
			expect(inferMimeType("song.mp3")).toBe("audio/mpeg");
		});

		it("infers WAV from .wav extension", () => {
			expect(inferMimeType("sound.wav")).toBe("audio/wav");
		});

		it("infers OGG from .ogg extension", () => {
			expect(inferMimeType("audio.ogg")).toBe("audio/ogg");
		});

		it("infers FLAC from .flac extension", () => {
			expect(inferMimeType("lossless.flac")).toBe("audio/flac");
		});

		it("infers AAC from .aac extension", () => {
			expect(inferMimeType("audio.aac")).toBe("audio/aac");
		});

		it("infers M4A from .m4a extension", () => {
			expect(inferMimeType("audio.m4a")).toBe("audio/mp4");
		});
	});

	describe("archive formats", () => {
		it("infers ZIP from .zip extension", () => {
			expect(inferMimeType("archive.zip")).toBe("application/zip");
		});

		it("infers TAR from .tar extension", () => {
			expect(inferMimeType("archive.tar")).toBe("application/x-tar");
		});

		it("infers GZIP from .gz extension", () => {
			expect(inferMimeType("archive.gz")).toBe("application/gzip");
		});

		it("infers RAR from .rar extension", () => {
			expect(inferMimeType("archive.rar")).toBe("application/vnd.rar");
		});

		it("infers 7z from .7z extension", () => {
			expect(inferMimeType("archive.7z")).toBe(
				"application/x-7z-compressed",
			);
		});
	});

	describe("case insensitivity", () => {
		it("handles uppercase extensions", () => {
			expect(inferMimeType("PHOTO.JPG")).toBe("image/jpeg");
		});

		it("handles mixed case extensions", () => {
			expect(inferMimeType("Photo.Png")).toBe("image/png");
		});
	});

	describe("paths with directories", () => {
		it("extracts extension from paths with directories", () => {
			expect(inferMimeType("uploads/avatars/user.png")).toBe("image/png");
		});

		it("handles nested paths", () => {
			expect(inferMimeType("/var/uploads/2024/01/file.pdf")).toBe(
				"application/pdf",
			);
		});
	});

	describe("fallback behavior", () => {
		it("returns application/octet-stream for unknown extensions", () => {
			expect(inferMimeType("file.xyz")).toBe("application/octet-stream");
		});

		it("returns application/octet-stream for files without extension", () => {
			expect(inferMimeType("filename")).toBe("application/octet-stream");
		});

		it("returns application/octet-stream for empty string", () => {
			expect(inferMimeType("")).toBe("application/octet-stream");
		});

		it("returns application/octet-stream for dot files", () => {
			expect(inferMimeType(".gitignore")).toBe(
				"application/octet-stream",
			);
		});
	});
});

describe("isImageMimeType", () => {
	it("returns true for image/jpeg", () => {
		expect(isImageMimeType("image/jpeg")).toBe(true);
	});

	it("returns true for image/png", () => {
		expect(isImageMimeType("image/png")).toBe(true);
	});

	it("returns true for image/gif", () => {
		expect(isImageMimeType("image/gif")).toBe(true);
	});

	it("returns true for image/webp", () => {
		expect(isImageMimeType("image/webp")).toBe(true);
	});

	it("returns true for image/svg+xml", () => {
		expect(isImageMimeType("image/svg+xml")).toBe(true);
	});

	it("returns false for application/pdf", () => {
		expect(isImageMimeType("application/pdf")).toBe(false);
	});

	it("returns false for video/mp4", () => {
		expect(isImageMimeType("video/mp4")).toBe(false);
	});

	it("returns false for text/plain", () => {
		expect(isImageMimeType("text/plain")).toBe(false);
	});

	it("returns false for application/octet-stream", () => {
		expect(isImageMimeType("application/octet-stream")).toBe(false);
	});
});

describe("SUPPORTED_IMAGE_MIME_TYPES", () => {
	it("includes common image types", () => {
		expect(SUPPORTED_IMAGE_MIME_TYPES).toContain("image/jpeg");
		expect(SUPPORTED_IMAGE_MIME_TYPES).toContain("image/png");
		expect(SUPPORTED_IMAGE_MIME_TYPES).toContain("image/gif");
		expect(SUPPORTED_IMAGE_MIME_TYPES).toContain("image/webp");
	});
});

describe("SUPPORTED_IMAGE_EXTENSIONS", () => {
	it("includes common image extensions", () => {
		expect(SUPPORTED_IMAGE_EXTENSIONS).toContain(".jpg");
		expect(SUPPORTED_IMAGE_EXTENSIONS).toContain(".jpeg");
		expect(SUPPORTED_IMAGE_EXTENSIONS).toContain(".png");
		expect(SUPPORTED_IMAGE_EXTENSIONS).toContain(".gif");
		expect(SUPPORTED_IMAGE_EXTENSIONS).toContain(".webp");
	});
});
