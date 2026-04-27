import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const isStorageConfiguredMock = vi.hoisted(() => vi.fn());
const getDefaultS3ProviderMock = vi.hoisted(() => vi.fn());
const buildUserPathMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	getSignedUploadUrl: getSignedUploadUrlMock,
	isStorageConfigured: isStorageConfiguredMock,
	getDefaultS3Provider: getDefaultS3ProviderMock,
	buildUserPath: buildUserPathMock,
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/config", () => ({
	config: {
		storage: { bucketNames: { avatars: "avatars" } },
	},
}));

vi.mock("@repo/database", () => ({
	db: {},
}));

import { usersRouter } from "./router";

const TEST_USER_ID = "clu1234567890abcdefghij";
const TEST_ORG_ID = "clg1234567890abcdefghij";

const createClient = (orgId: string | null = TEST_ORG_ID) => {
	getSessionMock.mockResolvedValue({
		user: { id: TEST_USER_ID },
		session: { id: "session-1", activeOrganizationId: orgId },
	});
	return createProcedureClient(usersRouter.avatarUploadUrl, {
		context: { headers: new Headers() },
	});
};

describe("Users Router - avatarUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		buildUserPathMock.mockReturnValue(
			"organizations/org-1/users/user-1/avatar.png",
		);
	});

	it("returns signed upload url and path", async () => {
		isStorageConfiguredMock.mockReturnValue(false);
		getSignedUploadUrlMock.mockResolvedValue(
			"https://example.com/signed-url",
		);

		const result = await createClient()({});

		expect(result.signedUploadUrl).toBe("https://example.com/signed-url");
		expect(result.path).toBe("organizations/org-1/users/user-1/avatar.png");
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		await expect(createClient(null)({})).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
	});

	it("deletes existing avatar when S3 storage is in use", async () => {
		const mockProvider = {
			exists: vi.fn().mockResolvedValue(true),
			delete: vi.fn().mockResolvedValue(undefined),
		};
		isStorageConfiguredMock.mockReturnValue(true);
		getDefaultS3ProviderMock.mockReturnValue(mockProvider);
		getSignedUploadUrlMock.mockResolvedValue("https://example.com/url");

		await createClient()({});

		expect(mockProvider.exists).toHaveBeenCalled();
		expect(mockProvider.delete).toHaveBeenCalled();
	});

	it("skips delete when file does not exist in storage", async () => {
		const mockProvider = {
			exists: vi.fn().mockResolvedValue(false),
			delete: vi.fn(),
		};
		isStorageConfiguredMock.mockReturnValue(true);
		getDefaultS3ProviderMock.mockReturnValue(mockProvider);
		getSignedUploadUrlMock.mockResolvedValue("https://example.com/url");

		await createClient()({});

		expect(mockProvider.exists).toHaveBeenCalled();
		expect(mockProvider.delete).not.toHaveBeenCalled();
	});
});
