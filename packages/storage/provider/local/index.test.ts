import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { Readable } from "node:stream";
import {
	afterAll,
	afterEach,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from "vitest";
import { LocalStorageProvider, shouldUseLocalStorage } from "./index";

// Use unique directory per test run to avoid conflicts in parallel execution
const TEST_BASE_DIR = `/tmp/storage-provider-test-${process.pid}-${Date.now()}`;
const TEST_BASE_URL = "http://localhost:3500";
const TEST_SIGNING_SECRET = "test-secret";

describe("LocalStorageProvider", () => {
	let provider: LocalStorageProvider;

	beforeAll(async () => {
		// Ensure test directory exists
		await mkdir(TEST_BASE_DIR, { recursive: true });
	});

	beforeEach(() => {
		provider = new LocalStorageProvider({
			baseDir: TEST_BASE_DIR,
			baseUrl: TEST_BASE_URL,
			signingSecret: TEST_SIGNING_SECRET,
		});
	});

	afterEach(async () => {
		// Clean up test files after each test
		try {
			await rm(TEST_BASE_DIR, { recursive: true, force: true });
			await mkdir(TEST_BASE_DIR, { recursive: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	afterAll(async () => {
		// Final cleanup
		try {
			await rm(TEST_BASE_DIR, { recursive: true, force: true });
		} catch {
			// Ignore cleanup errors
		}
	});

	describe("constructor", () => {
		it("should create provider with name 'local'", () => {
			expect(provider.name).toBe("local");
		});

		it("should use default values when config is empty", () => {
			const defaultProvider = new LocalStorageProvider({});
			expect(defaultProvider.getBaseDir()).toBe(
				"/tmp/software-multi-tool-uploads",
			);
		});

		it("should use custom baseDir", () => {
			expect(provider.getBaseDir()).toBe(TEST_BASE_DIR);
		});
	});

	describe("upload", () => {
		it("should upload a buffer and return result", async () => {
			const buffer = Buffer.from("test content");
			const result = await provider.upload("test/file.txt", buffer, {
				bucket: "uploads",
				contentType: "text/plain",
			});

			expect(result).toEqual({
				key: "test/file.txt",
				bucket: "uploads",
				size: buffer.length,
				etag: expect.stringMatching(/^"[a-f0-9]{32}"$/),
			});
		});

		it("should create nested directories", async () => {
			const buffer = Buffer.from("nested content");
			await provider.upload("deeply/nested/path/file.txt", buffer, {
				bucket: "uploads",
			});

			const filePath = join(
				TEST_BASE_DIR,
				"uploads",
				"deeply/nested/path/file.txt",
			);
			const content = await readFile(filePath, "utf-8");
			expect(content).toBe("nested content");
		});

		it("should upload a readable stream", async () => {
			const stream = Readable.from(["stream ", "content"]);
			const result = await provider.upload("stream-file.txt", stream, {
				bucket: "uploads",
			});

			expect(result.key).toBe("stream-file.txt");
			expect(result.size).toBe(14); // "stream content".length
		});

		it("should store metadata in sidecar file", async () => {
			const buffer = Buffer.from("test");
			await provider.upload("meta-test.txt", buffer, {
				bucket: "uploads",
				contentType: "text/plain",
				metadata: { "x-custom": "value" },
			});

			const metadataPath = join(
				TEST_BASE_DIR,
				"uploads",
				"meta-test.txt.meta.json",
			);
			const metadata = JSON.parse(await readFile(metadataPath, "utf-8"));

			expect(metadata.contentType).toBe("text/plain");
			expect(metadata.metadata).toEqual({ "x-custom": "value" });
			expect(metadata.size).toBe(4);
			expect(metadata.etag).toBeDefined();
			expect(metadata.uploadedAt).toBeDefined();
		});

		it("should use default content type when not specified", async () => {
			const buffer = Buffer.from("test");
			await provider.upload("default-type.bin", buffer, {
				bucket: "uploads",
			});

			const metadataPath = join(
				TEST_BASE_DIR,
				"uploads",
				"default-type.bin.meta.json",
			);
			const metadata = JSON.parse(await readFile(metadataPath, "utf-8"));

			expect(metadata.contentType).toBe("application/octet-stream");
		});

		it("should sanitize key to prevent directory traversal", async () => {
			const buffer = Buffer.from("test");
			await provider.upload("../../../etc/passwd", buffer, {
				bucket: "uploads",
			});

			// File should be created safely inside the bucket directory
			const exists = await provider.exists("etc/passwd", "uploads");
			expect(exists).toBe(true);
		});
	});

	describe("getSignedUploadUrl", () => {
		it("should generate valid upload URL", async () => {
			const url = await provider.getSignedUploadUrl("test.txt", {
				bucket: "uploads",
				contentType: "text/plain",
				expiresIn: 300,
			});

			expect(url).toContain(TEST_BASE_URL);
			expect(url).toContain("/api/local-storage/upload");
			expect(url).toContain("bucket=uploads");
			expect(url).toContain("key=test.txt");
			expect(url).toContain("expires=");
			expect(url).toContain("token=");
			expect(url).toContain("contentType=text%2Fplain");
		});

		it("should use default expiration", async () => {
			const url = await provider.getSignedUploadUrl("test.txt", {
				bucket: "uploads",
			});

			const urlObj = new URL(url);
			const expires = Number.parseInt(
				urlObj.searchParams.get("expires") ?? "0",
				10,
			);

			// Default is 60 seconds
			const expectedExpiry = Date.now() + 60 * 1000;
			expect(expires).toBeGreaterThan(Date.now());
			expect(expires).toBeLessThanOrEqual(expectedExpiry + 1000);
		});
	});

	describe("getSignedDownloadUrl", () => {
		it("should generate valid download URL", async () => {
			const url = await provider.getSignedDownloadUrl("test.txt", {
				bucket: "uploads",
				expiresIn: 3600,
			});

			expect(url).toContain(TEST_BASE_URL);
			expect(url).toContain("/api/local-storage/download");
			expect(url).toContain("bucket=uploads");
			expect(url).toContain("key=test.txt");
			expect(url).toContain("expires=");
			expect(url).toContain("token=");
		});

		it("should respect custom expiration", async () => {
			const url = await provider.getSignedDownloadUrl("test.txt", {
				bucket: "uploads",
				expiresIn: 7200,
			});

			const urlObj = new URL(url);
			const expires = Number.parseInt(
				urlObj.searchParams.get("expires") ?? "0",
				10,
			);

			const expectedExpiry = Date.now() + 7200 * 1000;
			expect(expires).toBeGreaterThan(Date.now() + 3600 * 1000);
			expect(expires).toBeLessThanOrEqual(expectedExpiry + 1000);
		});
	});

	describe("verifyToken", () => {
		const extractUrlParams = (url: string) => {
			const urlObj = new URL(url);
			const token = urlObj.searchParams.get("token") ?? "";
			const expires = Number.parseInt(
				urlObj.searchParams.get("expires") ?? "0",
				10,
			);
			return { token, expires };
		};

		it("should verify valid upload token", async () => {
			const url = await provider.getSignedUploadUrl("test.txt", {
				bucket: "uploads",
				expiresIn: 300,
			});

			const { token, expires } = extractUrlParams(url);

			const isValid = provider.verifyToken(
				"uploads",
				"test.txt",
				expires,
				"upload",
				token,
			);
			expect(isValid).toBe(true);
		});

		it("should verify valid download token", async () => {
			const url = await provider.getSignedDownloadUrl("test.txt", {
				bucket: "uploads",
				expiresIn: 300,
			});

			const { token, expires } = extractUrlParams(url);

			const isValid = provider.verifyToken(
				"uploads",
				"test.txt",
				expires,
				"download",
				token,
			);
			expect(isValid).toBe(true);
		});

		it("should reject expired token", () => {
			const expiredTime = Date.now() - 1000;
			const isValid = provider.verifyToken(
				"uploads",
				"test.txt",
				expiredTime,
				"download",
				"fake-token",
			);
			expect(isValid).toBe(false);
		});

		it("should reject invalid token", () => {
			const futureTime = Date.now() + 60000;
			const isValid = provider.verifyToken(
				"uploads",
				"test.txt",
				futureTime,
				"download",
				"invalid-token",
			);
			expect(isValid).toBe(false);
		});

		it("should reject token for wrong operation", async () => {
			const url = await provider.getSignedUploadUrl("test.txt", {
				bucket: "uploads",
				expiresIn: 300,
			});

			const { token, expires } = extractUrlParams(url);

			// Try to use upload token for download
			const isValid = provider.verifyToken(
				"uploads",
				"test.txt",
				expires,
				"download",
				token,
			);
			expect(isValid).toBe(false);
		});
	});

	describe("delete", () => {
		it("should delete existing file", async () => {
			const buffer = Buffer.from("to delete");
			await provider.upload("delete-me.txt", buffer, {
				bucket: "uploads",
			});

			expect(await provider.exists("delete-me.txt", "uploads")).toBe(
				true,
			);

			await provider.delete("delete-me.txt", "uploads");

			expect(await provider.exists("delete-me.txt", "uploads")).toBe(
				false,
			);
		});

		it("should also delete metadata file", async () => {
			const buffer = Buffer.from("to delete");
			await provider.upload("delete-meta.txt", buffer, {
				bucket: "uploads",
			});

			const metadataPath = join(
				TEST_BASE_DIR,
				"uploads",
				"delete-meta.txt.meta.json",
			);
			const metadataExists = async () => {
				try {
					await readFile(metadataPath);
					return true;
				} catch {
					return false;
				}
			};

			expect(await metadataExists()).toBe(true);

			await provider.delete("delete-meta.txt", "uploads");

			expect(await metadataExists()).toBe(false);
		});

		it("should not throw when deleting non-existent file", async () => {
			await expect(
				provider.delete("non-existent.txt", "uploads"),
			).resolves.not.toThrow();
		});
	});

	describe("exists", () => {
		it("should return true for existing file", async () => {
			const buffer = Buffer.from("exists");
			await provider.upload("exists.txt", buffer, { bucket: "uploads" });

			const result = await provider.exists("exists.txt", "uploads");
			expect(result).toBe(true);
		});

		it("should return false for non-existent file", async () => {
			const result = await provider.exists(
				"does-not-exist.txt",
				"uploads",
			);
			expect(result).toBe(false);
		});
	});

	describe("readFile", () => {
		it("should read file with content type from metadata", async () => {
			const buffer = Buffer.from("read me");
			await provider.upload("readable.txt", buffer, {
				bucket: "uploads",
				contentType: "text/plain",
			});

			const { data, contentType } = await provider.readFile(
				"readable.txt",
				"uploads",
			);

			expect(data.toString()).toBe("read me");
			expect(contentType).toBe("text/plain");
		});

		it("should use default content type when metadata is missing", async () => {
			// Manually create file without metadata
			const filePath = join(TEST_BASE_DIR, "uploads", "no-meta.txt");
			await mkdir(join(TEST_BASE_DIR, "uploads"), { recursive: true });
			await writeFile(filePath, "no metadata");

			const { data, contentType } = await provider.readFile(
				"no-meta.txt",
				"uploads",
			);

			expect(data.toString()).toBe("no metadata");
			expect(contentType).toBe("application/octet-stream");
		});

		it("should throw for non-existent file", async () => {
			await expect(
				provider.readFile("missing.txt", "uploads"),
			).rejects.toThrow("Could not read file missing.txt");
		});
	});

	describe("writeFile", () => {
		it("should write file using upload internally", async () => {
			await provider.writeFile(
				"written.txt",
				"uploads",
				Buffer.from("written content"),
				"text/plain",
			);

			const { data, contentType } = await provider.readFile(
				"written.txt",
				"uploads",
			);

			expect(data.toString()).toBe("written content");
			expect(contentType).toBe("text/plain");
		});
	});
});

describe("shouldUseLocalStorage", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("should return true when LOCAL_STORAGE_PROVIDER is 'true'", () => {
		process.env.LOCAL_STORAGE_PROVIDER = "true";
		expect(shouldUseLocalStorage()).toBe(true);
	});

	it("should return false when LOCAL_STORAGE_PROVIDER is 'false'", () => {
		process.env.LOCAL_STORAGE_PROVIDER = "false";
		process.env.NODE_ENV = "development";
		expect(shouldUseLocalStorage()).toBe(false);
	});

	it("should return true in development without S3 credentials", () => {
		process.env.NODE_ENV = "development";
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY_ID;
		delete process.env.S3_SECRET_ACCESS_KEY;
		delete process.env.LOCAL_STORAGE_PROVIDER;

		expect(shouldUseLocalStorage()).toBe(true);
	});

	it("should return false in development with S3 credentials", () => {
		process.env.NODE_ENV = "development";
		process.env.S3_ENDPOINT = "https://s3.example.com";
		process.env.S3_ACCESS_KEY_ID = "key";
		process.env.S3_SECRET_ACCESS_KEY = "secret";
		delete process.env.LOCAL_STORAGE_PROVIDER;

		expect(shouldUseLocalStorage()).toBe(false);
	});

	it("should return false in production without explicit opt-in", () => {
		process.env.NODE_ENV = "production";
		delete process.env.S3_ENDPOINT;
		delete process.env.S3_ACCESS_KEY_ID;
		delete process.env.S3_SECRET_ACCESS_KEY;
		delete process.env.LOCAL_STORAGE_PROVIDER;

		expect(shouldUseLocalStorage()).toBe(false);
	});
});

describe("createStorageProvider with local type", () => {
	it("should create LocalStorageProvider from factory", async () => {
		const { createStorageProvider } = await import("../../index");

		const provider = createStorageProvider({
			type: "local",
			baseDir: TEST_BASE_DIR,
			baseUrl: TEST_BASE_URL,
		});

		expect(provider.name).toBe("local");
	});
});
