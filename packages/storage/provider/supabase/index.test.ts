import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerError = vi.fn();

// Mock Supabase storage methods
const uploadMock = vi.fn();
const createSignedUploadUrlMock = vi.fn();
const createSignedUrlMock = vi.fn();
const removeMock = vi.fn();
const listMock = vi.fn();

// Mock storage.from() to return bucket-scoped methods
const fromMock = vi.fn(() => ({
	upload: uploadMock,
	createSignedUploadUrl: createSignedUploadUrlMock,
	createSignedUrl: createSignedUrlMock,
	remove: removeMock,
	list: listMock,
}));

const createClientMock = vi.fn(() => ({
	storage: {
		from: fromMock,
	},
}));

vi.mock("@supabase/supabase-js", () => ({
	createClient: createClientMock,
}));

vi.mock("@repo/logs", () => ({
	logger: { error: loggerError },
}));

describe("supabase provider", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			SUPABASE_URL: "https://test.supabase.co",
			SUPABASE_SERVICE_ROLE_KEY: "test-service-role-key",
		};

		// Default successful responses
		uploadMock.mockResolvedValue({
			data: { path: "test/file.txt", id: "file-id-123" },
			error: null,
		});
		createSignedUploadUrlMock.mockResolvedValue({
			data: {
				signedUrl:
					"https://test.supabase.co/storage/v1/upload/sign/bucket/test",
				token: "upload-token",
				path: "test/file.txt",
			},
			error: null,
		});
		createSignedUrlMock.mockResolvedValue({
			data: {
				signedUrl:
					"https://test.supabase.co/storage/v1/object/sign/bucket/test",
			},
			error: null,
		});
		removeMock.mockResolvedValue({ data: null, error: null });
		listMock.mockResolvedValue({ data: [], error: null });
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	// =========================================================================
	// SupabaseStorageProvider class tests
	// =========================================================================

	describe("SupabaseStorageProvider class", () => {
		it("creates provider with configuration", async () => {
			const { SupabaseStorageProvider } = await import("./index");

			const provider = new SupabaseStorageProvider({
				supabaseUrl: "https://custom.supabase.co",
				supabaseServiceRoleKey: "custom-key",
			});

			expect(provider.name).toBe("supabase");
			expect(createClientMock).toHaveBeenCalledWith(
				"https://custom.supabase.co",
				"custom-key",
				expect.objectContaining({
					auth: {
						persistSession: false,
						autoRefreshToken: false,
					},
				}),
			);
		});

		describe("upload", () => {
			it("uploads a buffer with content type", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const buffer = Buffer.from("test content");
				const result = await provider.upload("test/file.txt", buffer, {
					bucket: "uploads",
					contentType: "text/plain",
				});

				expect(result).toEqual({
					key: "test/file.txt",
					bucket: "uploads",
					size: buffer.length,
					etag: "file-id-123",
				});
				expect(fromMock).toHaveBeenCalledWith("uploads");
				expect(uploadMock).toHaveBeenCalledWith(
					"test/file.txt",
					buffer,
					expect.objectContaining({
						contentType: "text/plain",
						upsert: true,
					}),
				);
			});

			it("uses default content type for uploads", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await provider.upload("test/file.bin", Buffer.from("data"), {
					bucket: "uploads",
				});

				expect(uploadMock).toHaveBeenCalledWith(
					"test/file.bin",
					expect.any(Buffer),
					expect.objectContaining({
						contentType: "application/octet-stream",
					}),
				);
			});

			it("handles upload errors gracefully", async () => {
				uploadMock.mockResolvedValueOnce({
					data: null,
					error: { message: "Upload failed" },
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await expect(
					provider.upload("test/file.txt", Buffer.from("data"), {
						bucket: "uploads",
					}),
				).rejects.toThrow("Could not upload file to test/file.txt");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("getSignedUploadUrl", () => {
			it("generates upload URL with CORS support", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const url = await provider.getSignedUploadUrl("docs/file.pdf", {
					bucket: "documents",
					contentType: "application/pdf",
					expiresIn: 300,
				});

				expect(url).toBe(
					"https://test.supabase.co/storage/v1/upload/sign/bucket/test",
				);
				expect(fromMock).toHaveBeenCalledWith("documents");
				expect(createSignedUploadUrlMock).toHaveBeenCalledWith(
					"docs/file.pdf",
				);
			});

			it("handles signed upload URL errors", async () => {
				createSignedUploadUrlMock.mockResolvedValueOnce({
					data: null,
					error: { message: "Failed to create signed URL" },
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await expect(
					provider.getSignedUploadUrl("file.pdf", {
						bucket: "uploads",
					}),
				).rejects.toThrow("Could not get signed upload url");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("getSignedDownloadUrl", () => {
			it("generates download URL with custom expiration", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const url = await provider.getSignedDownloadUrl(
					"docs/file.pdf",
					{
						bucket: "documents",
						expiresIn: 3600,
					},
				);

				expect(url).toBe(
					"https://test.supabase.co/storage/v1/object/sign/bucket/test",
				);
				expect(fromMock).toHaveBeenCalledWith("documents");
				expect(createSignedUrlMock).toHaveBeenCalledWith(
					"docs/file.pdf",
					3600,
				);
			});

			it("uses default expiration when not specified", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await provider.getSignedDownloadUrl("file.pdf", {
					bucket: "uploads",
				});

				expect(createSignedUrlMock).toHaveBeenCalledWith(
					"file.pdf",
					60,
				);
			});

			it("handles signed download URL errors", async () => {
				createSignedUrlMock.mockResolvedValueOnce({
					data: null,
					error: { message: "Failed to create signed URL" },
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await expect(
					provider.getSignedDownloadUrl("file.pdf", {
						bucket: "uploads",
					}),
				).rejects.toThrow("Could not get signed url");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("delete", () => {
			it("deletes a file from storage", async () => {
				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await provider.delete("test/file.txt", "uploads");

				expect(fromMock).toHaveBeenCalledWith("uploads");
				expect(removeMock).toHaveBeenCalledWith(["test/file.txt"]);
			});

			it("handles delete errors gracefully", async () => {
				removeMock.mockResolvedValueOnce({
					data: null,
					error: { message: "Delete failed" },
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await expect(
					provider.delete("test/file.txt", "uploads"),
				).rejects.toThrow("Could not delete file test/file.txt");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("exists", () => {
			it("returns true when file exists", async () => {
				listMock.mockResolvedValueOnce({
					data: [{ name: "file.txt" }],
					error: null,
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const result = await provider.exists(
					"test/file.txt",
					"uploads",
				);

				expect(result).toBe(true);
				expect(fromMock).toHaveBeenCalledWith("uploads");
				expect(listMock).toHaveBeenCalledWith("test", {
					limit: 1,
					search: "file.txt",
				});
			});

			it("returns false when file does not exist", async () => {
				listMock.mockResolvedValueOnce({
					data: [],
					error: null,
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const result = await provider.exists(
					"missing/file.txt",
					"uploads",
				);

				expect(result).toBe(false);
			});

			it("returns false when not found error", async () => {
				listMock.mockRejectedValueOnce({
					message: "not found",
					statusCode: 404,
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const result = await provider.exists(
					"missing/file.txt",
					"uploads",
				);

				expect(result).toBe(false);
			});

			it("throws on other errors", async () => {
				listMock.mockRejectedValueOnce(new Error("network error"));

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				await expect(
					provider.exists("test/file.txt", "uploads"),
				).rejects.toThrow(
					"Could not check if file test/file.txt exists",
				);
				expect(loggerError).toHaveBeenCalled();
			});

			it("handles root level files without folder path", async () => {
				listMock.mockResolvedValueOnce({
					data: [{ name: "rootfile.txt" }],
					error: null,
				});

				const { SupabaseStorageProvider } = await import("./index");
				const provider = new SupabaseStorageProvider({
					supabaseUrl: "https://test.supabase.co",
					supabaseServiceRoleKey: "test-key",
				});

				const result = await provider.exists("rootfile.txt", "uploads");

				expect(result).toBe(true);
				expect(listMock).toHaveBeenCalledWith(undefined, {
					limit: 1,
					search: "rootfile.txt",
				});
			});
		});
	});

	// =========================================================================
	// Default provider and factory tests
	// =========================================================================

	describe("getDefaultSupabaseProvider", () => {
		it("creates provider from environment variables", async () => {
			const { getDefaultSupabaseProvider } = await import("./index");

			const provider = getDefaultSupabaseProvider();

			expect(provider.name).toBe("supabase");
			expect(createClientMock).toHaveBeenCalledWith(
				"https://test.supabase.co",
				"test-service-role-key",
				expect.anything(),
			);
		});

		it("throws when SUPABASE_URL is missing", async () => {
			const envWithoutUrl = { ...originalEnv };
			delete envWithoutUrl.SUPABASE_URL;
			delete envWithoutUrl.SUPABASE_SERVICE_ROLE_KEY;
			process.env = envWithoutUrl;
			vi.resetModules();

			const { getDefaultSupabaseProvider } = await import("./index");

			expect(() => getDefaultSupabaseProvider()).toThrow(
				"Missing env variable SUPABASE_URL",
			);
		});

		it("throws when SUPABASE_SERVICE_ROLE_KEY is missing", async () => {
			const envWithoutKey = { ...originalEnv };
			delete envWithoutKey.SUPABASE_SERVICE_ROLE_KEY;
			envWithoutKey.SUPABASE_URL = "https://test.supabase.co";
			process.env = envWithoutKey;
			vi.resetModules();

			const { getDefaultSupabaseProvider } = await import("./index");

			expect(() => getDefaultSupabaseProvider()).toThrow(
				"Missing env variable SUPABASE_SERVICE_ROLE_KEY",
			);
		});

		it("returns cached provider on subsequent calls", async () => {
			const { getDefaultSupabaseProvider } = await import("./index");

			const provider1 = getDefaultSupabaseProvider();
			const provider2 = getDefaultSupabaseProvider();

			expect(provider1).toBe(provider2);
			expect(createClientMock).toHaveBeenCalledTimes(1);
		});
	});

	describe("shouldUseSupabaseStorage", () => {
		it("returns true when SUPABASE_STORAGE_PROVIDER is true", async () => {
			process.env.SUPABASE_STORAGE_PROVIDER = "true";
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			expect(shouldUseSupabaseStorage()).toBe(true);
		});

		it("returns false when SUPABASE_STORAGE_PROVIDER is false", async () => {
			process.env.SUPABASE_STORAGE_PROVIDER = "false";
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			expect(shouldUseSupabaseStorage()).toBe(false);
		});

		it("returns true when Supabase credentials exist without S3 credentials", async () => {
			delete process.env.SUPABASE_STORAGE_PROVIDER;
			delete process.env.S3_ENDPOINT;
			delete process.env.S3_ACCESS_KEY_ID;
			delete process.env.S3_SECRET_ACCESS_KEY;
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			expect(shouldUseSupabaseStorage()).toBe(true);
		});

		it("returns true when both Supabase and S3 credentials are configured (prefers Supabase for CORS)", async () => {
			delete process.env.SUPABASE_STORAGE_PROVIDER;
			process.env.S3_ENDPOINT = "https://s3.test";
			process.env.S3_ACCESS_KEY_ID = "key";
			process.env.S3_SECRET_ACCESS_KEY = "secret";
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			// Supabase is preferred over S3 when both are configured
			// because Supabase's native Storage API has built-in CORS support
			expect(shouldUseSupabaseStorage()).toBe(true);
		});

		it("returns false when explicitly disabled even with Supabase credentials", async () => {
			process.env.SUPABASE_STORAGE_PROVIDER = "false";
			process.env.S3_ENDPOINT = "https://s3.test";
			process.env.S3_ACCESS_KEY_ID = "key";
			process.env.S3_SECRET_ACCESS_KEY = "secret";
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			// Explicit opt-out allows forcing S3 provider
			expect(shouldUseSupabaseStorage()).toBe(false);
		});

		it("returns false when no Supabase credentials", async () => {
			delete process.env.SUPABASE_STORAGE_PROVIDER;
			delete process.env.SUPABASE_URL;
			delete process.env.SUPABASE_SERVICE_ROLE_KEY;
			vi.resetModules();

			const { shouldUseSupabaseStorage } = await import("./index");

			expect(shouldUseSupabaseStorage()).toBe(false);
		});
	});
});

// =========================================================================
// Factory function tests
// =========================================================================

describe("createStorageProvider with supabase", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("creates a Supabase provider from config", async () => {
		const { createStorageProvider } = await import("../../index");

		const provider = createStorageProvider({
			type: "supabase",
			supabaseUrl: "https://example.supabase.co",
			supabaseServiceRoleKey: "test-key",
		});

		expect(provider.name).toBe("supabase");
	});
});
