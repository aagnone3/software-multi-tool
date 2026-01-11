import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const putCommandSpy = vi.fn();
const getCommandSpy = vi.fn();
const deleteCommandSpy = vi.fn();
const headCommandSpy = vi.fn();
const sendSpy = vi.fn();
const getSignedUrlMock = vi.fn();
const loggerError = vi.fn();

class PutObjectCommandMock {
	constructor(input: unknown) {
		putCommandSpy(input);
	}
}

class GetObjectCommandMock {
	constructor(input: unknown) {
		getCommandSpy(input);
	}
}

class DeleteObjectCommandMock {
	constructor(input: unknown) {
		deleteCommandSpy(input);
	}
}

class HeadObjectCommandMock {
	constructor(input: unknown) {
		headCommandSpy(input);
	}
}

const s3ClientSpy = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: class {
		constructor(options: unknown) {
			s3ClientSpy(options);
		}
		send = sendSpy;
	},
	PutObjectCommand: PutObjectCommandMock,
	GetObjectCommand: GetObjectCommandMock,
	DeleteObjectCommand: DeleteObjectCommandMock,
	HeadObjectCommand: HeadObjectCommandMock,
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
	getSignedUrl: getSignedUrlMock,
}));

vi.mock("@repo/logs", () => ({
	logger: { error: loggerError },
}));

describe("s3 provider", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
		process.env = {
			...originalEnv,
			S3_ENDPOINT: "https://s3.test",
			S3_REGION: "us-east-1",
			S3_ACCESS_KEY_ID: "key",
			S3_SECRET_ACCESS_KEY: "secret",
		};
		getSignedUrlMock.mockResolvedValue("signed-url");
		sendSpy.mockResolvedValue({ ETag: '"abc123"' });
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	// =========================================================================
	// Legacy function API tests (backwards compatibility)
	// =========================================================================

	describe("legacy function API", () => {
		it("creates a client lazily and returns upload URLs", async () => {
			const { getSignedUploadUrl } = await import("./index");

			const url = await getSignedUploadUrl("avatars/user.png", {
				bucket: "uploads",
			});

			expect(url).toBe("signed-url");
			expect(s3ClientSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					endpoint: "https://s3.test",
					credentials: {
						accessKeyId: "key",
						secretAccessKey: "secret",
					},
				}),
			);
			expect(putCommandSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					Bucket: "uploads",
					Key: "avatars/user.png",
					ContentType: "image/jpeg",
				}),
			);
		});

		it("supports download signed URLs", async () => {
			const { getSignedUrl } = await import("./index");

			const url = await getSignedUrl("avatars/user.png", {
				bucket: "uploads",
				expiresIn: 90,
			});

			expect(url).toBe("signed-url");
			expect(getCommandSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					Bucket: "uploads",
					Key: "avatars/user.png",
				}),
			);
			expect(getSignedUrlMock).toHaveBeenCalledWith(
				expect.anything(),
				expect.any(GetObjectCommandMock),
				expect.objectContaining({ expiresIn: 90 }),
			);
		});

		it("throws a descriptive error when S3 configuration is missing", async () => {
			// Explicitly delete S3 env vars (even if loaded from .env.local)
			const envWithoutS3 = { ...originalEnv };
			delete envWithoutS3.S3_ENDPOINT;
			delete envWithoutS3.S3_REGION;
			delete envWithoutS3.S3_ACCESS_KEY_ID;
			delete envWithoutS3.S3_SECRET_ACCESS_KEY;
			process.env = envWithoutS3;
			vi.resetModules();

			const { getSignedUrl } = await import("./index");

			await expect(
				getSignedUrl("file", { bucket: "uploads", expiresIn: 60 }),
			).rejects.toThrow("Missing env variable S3_ENDPOINT");
		});

		it("logs failures from presigner calls", async () => {
			getSignedUrlMock.mockRejectedValueOnce(new Error("broken"));
			const { getSignedUploadUrl } = await import("./index");

			await expect(
				getSignedUploadUrl("path", { bucket: "uploads" }),
			).rejects.toThrow("Could not get signed upload url");
			expect(loggerError).toHaveBeenCalled();
		});

		it("logs failures when generating download URLs", async () => {
			const { getSignedUrl } = await import("./index");
			getSignedUrlMock.mockImplementationOnce(() => {
				throw new Error("download broken");
			});

			await expect(
				getSignedUrl("path", { bucket: "uploads", expiresIn: 10 }),
			).rejects.toThrow("Could not get signed url");
			expect(loggerError).toHaveBeenCalled();
		});
	});

	// =========================================================================
	// S3StorageProvider class tests
	// =========================================================================

	describe("S3StorageProvider class", () => {
		it("creates provider with configuration", async () => {
			const { S3StorageProvider } = await import("./index");

			const provider = new S3StorageProvider({
				endpoint: "https://custom.s3.endpoint",
				region: "eu-west-1",
				accessKeyId: "custom-key",
				secretAccessKey: "custom-secret",
			});

			expect(provider.name).toBe("s3");
			expect(s3ClientSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					endpoint: "https://custom.s3.endpoint",
					region: "eu-west-1",
					forcePathStyle: true,
					credentials: {
						accessKeyId: "custom-key",
						secretAccessKey: "custom-secret",
					},
				}),
			);
		});

		it("allows custom forcePathStyle configuration", async () => {
			vi.resetModules();
			vi.clearAllMocks();
			const { S3StorageProvider } = await import("./index");

			new S3StorageProvider({
				endpoint: "https://s3.test",
				accessKeyId: "key",
				secretAccessKey: "secret",
				forcePathStyle: false,
			});

			expect(s3ClientSpy).toHaveBeenCalledWith(
				expect.objectContaining({
					forcePathStyle: false,
				}),
			);
		});

		describe("getSignedUploadUrl", () => {
			it("generates upload URL with custom content type", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				const url = await provider.getSignedUploadUrl("docs/file.pdf", {
					bucket: "documents",
					contentType: "application/pdf",
					expiresIn: 300,
				});

				expect(url).toBe("signed-url");
				expect(putCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						Bucket: "documents",
						Key: "docs/file.pdf",
						ContentType: "application/pdf",
					}),
				);
				expect(getSignedUrlMock).toHaveBeenCalledWith(
					expect.anything(),
					expect.any(PutObjectCommandMock),
					expect.objectContaining({ expiresIn: 300 }),
				);
			});

			it("uses default content type when not specified", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await provider.getSignedUploadUrl("file.bin", {
					bucket: "uploads",
				});

				expect(putCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						ContentType: "application/octet-stream",
					}),
				);
			});

			it("uses default expiration when not specified", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await provider.getSignedUploadUrl("file.bin", {
					bucket: "uploads",
				});

				expect(getSignedUrlMock).toHaveBeenCalledWith(
					expect.anything(),
					expect.anything(),
					expect.objectContaining({ expiresIn: 60 }),
				);
			});
		});

		describe("getSignedDownloadUrl", () => {
			it("generates download URL with custom expiration", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				const url = await provider.getSignedDownloadUrl(
					"docs/file.pdf",
					{
						bucket: "documents",
						expiresIn: 3600,
					},
				);

				expect(url).toBe("signed-url");
				expect(getCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						Bucket: "documents",
						Key: "docs/file.pdf",
					}),
				);
				expect(getSignedUrlMock).toHaveBeenCalledWith(
					expect.anything(),
					expect.any(GetObjectCommandMock),
					expect.objectContaining({ expiresIn: 3600 }),
				);
			});
		});

		describe("upload", () => {
			it("uploads a buffer with content type and metadata", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				const buffer = Buffer.from("test content");
				const result = await provider.upload("test/file.txt", buffer, {
					bucket: "uploads",
					contentType: "text/plain",
					metadata: { "x-custom": "value" },
				});

				expect(result).toEqual({
					key: "test/file.txt",
					bucket: "uploads",
					size: buffer.length,
					etag: '"abc123"',
				});
				expect(sendSpy).toHaveBeenCalled();
				expect(putCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						Bucket: "uploads",
						Key: "test/file.txt",
						Body: buffer,
						ContentType: "text/plain",
						Metadata: { "x-custom": "value" },
					}),
				);
			});

			it("uses default content type for uploads", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await provider.upload("test/file.bin", Buffer.from("data"), {
					bucket: "uploads",
				});

				expect(putCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						ContentType: "application/octet-stream",
					}),
				);
			});

			it("handles upload errors gracefully", async () => {
				sendSpy.mockRejectedValueOnce(new Error("upload failed"));
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await expect(
					provider.upload("test/file.txt", Buffer.from("data"), {
						bucket: "uploads",
					}),
				).rejects.toThrow("Could not upload file to test/file.txt");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("delete", () => {
			it("deletes a file from storage", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await provider.delete("test/file.txt", "uploads");

				expect(deleteCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						Bucket: "uploads",
						Key: "test/file.txt",
					}),
				);
			});

			it("handles delete errors gracefully", async () => {
				sendSpy.mockRejectedValueOnce(new Error("delete failed"));
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await expect(
					provider.delete("test/file.txt", "uploads"),
				).rejects.toThrow("Could not delete file test/file.txt");
				expect(loggerError).toHaveBeenCalled();
			});
		});

		describe("exists", () => {
			it("returns true when file exists", async () => {
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				const result = await provider.exists(
					"test/file.txt",
					"uploads",
				);

				expect(result).toBe(true);
				expect(headCommandSpy).toHaveBeenCalledWith(
					expect.objectContaining({
						Bucket: "uploads",
						Key: "test/file.txt",
					}),
				);
			});

			it("returns false when file does not exist", async () => {
				const notFoundError = new Error("Not Found");
				(notFoundError as unknown as { name: string }).name =
					"NotFound";
				sendSpy.mockRejectedValueOnce(notFoundError);

				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				const result = await provider.exists(
					"missing/file.txt",
					"uploads",
				);

				expect(result).toBe(false);
			});

			it("throws on other errors", async () => {
				sendSpy.mockRejectedValueOnce(new Error("network error"));
				const { S3StorageProvider } = await import("./index");
				const provider = new S3StorageProvider({
					endpoint: "https://s3.test",
					accessKeyId: "key",
					secretAccessKey: "secret",
				});

				await expect(
					provider.exists("test/file.txt", "uploads"),
				).rejects.toThrow(
					"Could not check if file test/file.txt exists",
				);
				expect(loggerError).toHaveBeenCalled();
			});
		});
	});
});

// =========================================================================
// Factory function tests
// =========================================================================

describe("createStorageProvider", () => {
	beforeEach(() => {
		vi.resetModules();
		vi.clearAllMocks();
	});

	it("creates an S3 provider from config", async () => {
		const { createStorageProvider } = await import("../../index");

		const provider = createStorageProvider({
			type: "s3",
			endpoint: "https://s3.example.com",
			region: "us-west-2",
			accessKeyId: "test-key",
			secretAccessKey: "test-secret",
		});

		expect(provider.name).toBe("s3");
	});
});
