import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageProvider, getSignedUploadUrl, getSignedUrl } from ".";

// Mocks
const s3GetSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const s3GetSignedUrlMock = vi.hoisted(() => vi.fn());
const S3StorageProviderMock = vi.hoisted(() => vi.fn());
const LocalStorageProviderMock = vi.hoisted(() => vi.fn());

vi.mock("./provider/s3", () => ({
	S3StorageProvider: S3StorageProviderMock,
	getSignedUploadUrl: s3GetSignedUploadUrlMock,
	getSignedUrl: s3GetSignedUrlMock,
	getDefaultS3Provider: vi.fn(),
	isStorageConfigured: vi.fn(),
}));

vi.mock("./provider/local", () => ({
	LocalStorageProvider: LocalStorageProviderMock,
	createLocalStorageProvider: vi.fn(),
	shouldUseLocalStorage: vi.fn(),
}));

describe("createStorageProvider", () => {
	it("creates an S3 provider", () => {
		const _result = createStorageProvider({
			type: "s3",
			endpoint: "https://s3.example.com",
			region: "us-east-1",
			accessKeyId: "key",
			secretAccessKey: "secret",
		});
		expect(S3StorageProviderMock).toHaveBeenCalledWith({
			endpoint: "https://s3.example.com",
			region: "us-east-1",
			accessKeyId: "key",
			secretAccessKey: "secret",
		});
	});

	it("creates a local provider", () => {
		const _result = createStorageProvider({
			type: "local",
			baseDir: "/tmp/uploads",
			baseUrl: "http://localhost:3500",
		});
		expect(LocalStorageProviderMock).toHaveBeenCalledWith({
			baseDir: "/tmp/uploads",
			baseUrl: "http://localhost:3500",
		});
	});

	it("throws on unknown provider type", () => {
		expect(() =>
			createStorageProvider({ type: "unknown" } as never),
		).toThrow("Unknown storage provider type: unknown");
	});
});

describe("getSignedUploadUrl (legacy)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates to S3", async () => {
		s3GetSignedUploadUrlMock.mockResolvedValue("https://s3.upload");

		const result = await getSignedUploadUrl("path/file.pdf", {
			bucket: "my-bucket",
		});

		expect(s3GetSignedUploadUrlMock).toHaveBeenCalledWith("path/file.pdf", {
			bucket: "my-bucket",
		});
		expect(result).toBe("https://s3.upload");
	});
});

describe("getSignedUrl (legacy)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("delegates to S3", async () => {
		s3GetSignedUrlMock.mockResolvedValue("https://s3.download");

		const result = await getSignedUrl("path/file.pdf", {
			bucket: "my-bucket",
			expiresIn: 3600,
		});

		expect(s3GetSignedUrlMock).toHaveBeenCalledWith("path/file.pdf", {
			bucket: "my-bucket",
			expiresIn: 3600,
		});
		expect(result).toBe("https://s3.download");
	});
});
