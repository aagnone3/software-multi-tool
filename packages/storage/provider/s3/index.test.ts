import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const putCommandSpy = vi.fn();
const getCommandSpy = vi.fn();
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

const s3ClientSpy = vi.fn();

vi.mock("@aws-sdk/client-s3", () => ({
	S3Client: class {
		constructor(options: unknown) {
			s3ClientSpy(options);
		}
	},
	PutObjectCommand: PutObjectCommandMock,
	GetObjectCommand: GetObjectCommandMock,
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
	});

	afterEach(() => {
		process.env = originalEnv;
	});

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
