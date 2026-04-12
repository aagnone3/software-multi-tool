import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStorageProvider, getSignedUploadUrl, getSignedUrl } from ".";

// Mocks
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn());
const getDefaultSupabaseProviderMock = vi.hoisted(() => vi.fn());
const s3GetSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const s3GetSignedUrlMock = vi.hoisted(() => vi.fn());
const S3StorageProviderMock = vi.hoisted(() => vi.fn());
const LocalStorageProviderMock = vi.hoisted(() => vi.fn());
const SupabaseStorageProviderMock = vi.hoisted(() => vi.fn());

vi.mock("./provider/supabase", () => ({
	shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
	getDefaultSupabaseProvider: getDefaultSupabaseProviderMock,
	SupabaseStorageProvider: SupabaseStorageProviderMock,
	createSupabaseStorageProvider: vi.fn(),
}));

vi.mock("./provider/s3", () => ({
	S3StorageProvider: S3StorageProviderMock,
	getSignedUploadUrl: s3GetSignedUploadUrlMock,
	getSignedUrl: s3GetSignedUrlMock,
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

	it("creates a Supabase provider", () => {
		const result = createStorageProvider({
			type: "supabase",
			supabaseUrl: "https://project.supabase.co",
			supabaseServiceRoleKey: "service-role-key",
		});
		expect(SupabaseStorageProviderMock).toHaveBeenCalledWith({
			supabaseUrl: "https://project.supabase.co",
			supabaseServiceRoleKey: "service-role-key",
		});
		expect(result).toBeDefined();
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

	it("uses Supabase when shouldUseSupabaseStorage is true", async () => {
		shouldUseSupabaseStorageMock.mockReturnValue(true);
		const providerMock = {
			getSignedUploadUrl: vi
				.fn()
				.mockResolvedValue("https://supabase.upload"),
		};
		getDefaultSupabaseProviderMock.mockReturnValue(providerMock);

		const result = await getSignedUploadUrl("path/file.pdf", {
			bucket: "my-bucket",
		});

		expect(providerMock.getSignedUploadUrl).toHaveBeenCalledWith(
			"path/file.pdf",
			{
				bucket: "my-bucket",
				contentType: "image/jpeg",
				expiresIn: 60,
			},
		);
		expect(result).toBe("https://supabase.upload");
	});

	it("uses S3 when shouldUseSupabaseStorage is false", async () => {
		shouldUseSupabaseStorageMock.mockReturnValue(false);
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

	it("uses Supabase when shouldUseSupabaseStorage is true", async () => {
		shouldUseSupabaseStorageMock.mockReturnValue(true);
		const providerMock = {
			getSignedDownloadUrl: vi
				.fn()
				.mockResolvedValue("https://supabase.download"),
		};
		getDefaultSupabaseProviderMock.mockReturnValue(providerMock);

		const result = await getSignedUrl("path/file.pdf", {
			bucket: "my-bucket",
		});

		expect(providerMock.getSignedDownloadUrl).toHaveBeenCalledWith(
			"path/file.pdf",
			{
				bucket: "my-bucket",
				expiresIn: undefined,
			},
		);
		expect(result).toBe("https://supabase.download");
	});

	it("uses S3 when shouldUseSupabaseStorage is false", async () => {
		shouldUseSupabaseStorageMock.mockReturnValue(false);
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
