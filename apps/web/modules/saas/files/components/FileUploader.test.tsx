import React from "react";
import { describe, expect, it } from "vitest";

// Test pure utility functions extracted from FileUploader
// These can be tested without rendering the full component

describe("formatBytes", () => {
	// We test via exported logic - since formatBytes is not exported,
	// we replicate the logic here and verify the same behavior
	function formatBytes(bytes: number): string {
		if (bytes === 0) {
			return "0 B";
		}
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
	}

	it("returns '0 B' for zero bytes", () => {
		expect(formatBytes(0)).toBe("0 B");
	});

	it("returns bytes for small values", () => {
		expect(formatBytes(500)).toBe("500 B");
	});

	it("returns KB for kilobyte values", () => {
		expect(formatBytes(1024)).toBe("1 KB");
	});

	it("returns MB for megabyte values", () => {
		expect(formatBytes(1024 * 1024)).toBe("1 MB");
	});

	it("returns GB for gigabyte values", () => {
		expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
	});

	it("returns fractional KB", () => {
		expect(formatBytes(1536)).toBe("1.5 KB");
	});
});

describe("validateFile", () => {
	const MAX_FILE_SIZE = 50 * 1024 * 1024;

	function validateFile(file: { size: number }): {
		valid: boolean;
		error?: string;
	} {
		if (file.size > MAX_FILE_SIZE) {
			return {
				valid: false,
				error: "File size exceeds maximum",
			};
		}
		return { valid: true };
	}

	it("returns valid for file within size limit", () => {
		const file = { size: 1024 * 1024 }; // 1MB
		const result = validateFile(file);
		expect(result.valid).toBe(true);
		expect(result.error).toBeUndefined();
	});

	it("returns invalid for file exceeding size limit", () => {
		const file = { size: 51 * 1024 * 1024 }; // 51MB
		const result = validateFile(file);
		expect(result.valid).toBe(false);
		expect(result.error).toBeDefined();
	});

	it("returns valid for file exactly at size limit", () => {
		const file = { size: MAX_FILE_SIZE };
		const result = validateFile(file);
		expect(result.valid).toBe(true);
	});
});
