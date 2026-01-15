import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
	computeDirectoryHash,
	computeFileHash,
	hasStagedPrismaChanges,
	PRISMA_SCHEMA_PATH,
	PRISMA_ZOD_DIR,
	REPO_ROOT,
} from "./check-prisma-sync";

describe("check-prisma-sync", () => {
	describe("constants", () => {
		it("exports valid REPO_ROOT path", () => {
			expect(REPO_ROOT).toBeDefined();
			expect(fs.existsSync(REPO_ROOT)).toBe(true);
		});

		it("exports valid PRISMA_SCHEMA_PATH", () => {
			expect(PRISMA_SCHEMA_PATH).toContain(
				"packages/database/prisma/schema.prisma",
			);
		});

		it("exports valid PRISMA_ZOD_DIR", () => {
			expect(PRISMA_ZOD_DIR).toContain("packages/database/prisma/zod");
		});
	});

	describe("computeFileHash", () => {
		let tempDir: string;
		let tempFile: string;

		beforeEach(() => {
			tempDir = fs.mkdtempSync(
				path.join(os.tmpdir(), "prisma-sync-test-"),
			);
			tempFile = path.join(tempDir, "test-file.txt");
		});

		afterEach(() => {
			fs.rmSync(tempDir, { recursive: true, force: true });
		});

		it("returns null for non-existent file", () => {
			const hash = computeFileHash("/non/existent/file.txt");
			expect(hash).toBeNull();
		});

		it("returns consistent hash for same content", () => {
			fs.writeFileSync(tempFile, "test content");
			const hash1 = computeFileHash(tempFile);
			const hash2 = computeFileHash(tempFile);
			expect(hash1).toBe(hash2);
		});

		it("returns different hash for different content", () => {
			fs.writeFileSync(tempFile, "content 1");
			const hash1 = computeFileHash(tempFile);

			fs.writeFileSync(tempFile, "content 2");
			const hash2 = computeFileHash(tempFile);

			expect(hash1).not.toBe(hash2);
		});

		it("returns a 64-character hex string (SHA-256)", () => {
			fs.writeFileSync(tempFile, "test");
			const hash = computeFileHash(tempFile);
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[a-f0-9]+$/);
		});
	});

	describe("computeDirectoryHash", () => {
		let tempDir: string;

		beforeEach(() => {
			tempDir = fs.mkdtempSync(
				path.join(os.tmpdir(), "prisma-sync-test-"),
			);
		});

		afterEach(() => {
			fs.rmSync(tempDir, { recursive: true, force: true });
		});

		it("returns null for non-existent directory", () => {
			const hash = computeDirectoryHash("/non/existent/dir");
			expect(hash).toBeNull();
		});

		it("returns consistent hash for same directory contents", () => {
			fs.writeFileSync(path.join(tempDir, "file1.ts"), "content 1");
			fs.writeFileSync(path.join(tempDir, "file2.ts"), "content 2");

			const hash1 = computeDirectoryHash(tempDir);
			const hash2 = computeDirectoryHash(tempDir);

			expect(hash1).toBe(hash2);
		});

		it("returns different hash when file content changes", () => {
			fs.writeFileSync(path.join(tempDir, "file.ts"), "original");
			const hash1 = computeDirectoryHash(tempDir);

			fs.writeFileSync(path.join(tempDir, "file.ts"), "modified");
			const hash2 = computeDirectoryHash(tempDir);

			expect(hash1).not.toBe(hash2);
		});

		it("returns different hash when file is added", () => {
			fs.writeFileSync(path.join(tempDir, "file1.ts"), "content");
			const hash1 = computeDirectoryHash(tempDir);

			fs.writeFileSync(path.join(tempDir, "file2.ts"), "more content");
			const hash2 = computeDirectoryHash(tempDir);

			expect(hash1).not.toBe(hash2);
		});

		it("returns a 64-character hex string (SHA-256)", () => {
			fs.writeFileSync(path.join(tempDir, "test.ts"), "test");
			const hash = computeDirectoryHash(tempDir);
			expect(hash).toHaveLength(64);
			expect(hash).toMatch(/^[a-f0-9]+$/);
		});
	});

	describe("hasStagedPrismaChanges", () => {
		it("returns true for schema.prisma changes", () => {
			const result = hasStagedPrismaChanges([
				"packages/database/prisma/schema.prisma",
			]);
			expect(result).toBe(true);
		});

		it("returns true for migration changes", () => {
			const result = hasStagedPrismaChanges([
				"packages/database/prisma/migrations/20260115171412_add_notification_model/migration.sql",
			]);
			expect(result).toBe(true);
		});

		it("returns false for unrelated files", () => {
			const result = hasStagedPrismaChanges([
				"apps/web/src/app/page.tsx",
				"packages/utils/src/index.ts",
			]);
			expect(result).toBe(false);
		});

		it("returns true when Prisma files are mixed with other files", () => {
			const result = hasStagedPrismaChanges([
				"apps/web/src/app/page.tsx",
				"packages/database/prisma/schema.prisma",
				"packages/utils/src/index.ts",
			]);
			expect(result).toBe(true);
		});

		it("returns false for empty file list", () => {
			const result = hasStagedPrismaChanges([]);
			expect(result).toBe(false);
		});

		it("returns false for Zod generated files (they are output, not input)", () => {
			const result = hasStagedPrismaChanges([
				"packages/database/prisma/zod/index.ts",
			]);
			expect(result).toBe(false);
		});
	});
});
