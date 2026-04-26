import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockMailModule,
	mockPaymentsModule,
	resetExternalServicesMocks,
} from "../../../../../tests/fixtures/external-services";

const buildOrgPathMock = vi.hoisted(() => vi.fn());
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const isStorageConfiguredMock = vi.hoisted(() => vi.fn());
const getDefaultS3ProviderMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/mail", () => mockMailModule());
vi.mock("@repo/payments", () => mockPaymentsModule());

vi.mock("@repo/storage", () => ({
	buildOrgPath: buildOrgPathMock,
	getSignedUploadUrl: getSignedUploadUrlMock,
	isStorageConfigured: isStorageConfiguredMock,
	getDefaultS3Provider: getDefaultS3ProviderMock,
}));

vi.mock("@repo/config", () => ({
	config: {
		storage: { bucketNames: { avatars: "avatars-bucket" } },
	},
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", async () => {
	const { z } = await import("zod");
	return {
		db: {},
		zodSchemas: {
			AuditActionSchema: z.enum(["CREATE", "READ", "UPDATE", "DELETE"]),
		},
	};
});

import { createLogoUploadUrl } from "./create-logo-upload-url";

const createClient = () => {
	getSessionMock.mockResolvedValue({
		user: { id: "user-123" },
		session: { id: "session-1", activeOrganizationId: "org123" },
	});
	return createProcedureClient(createLogoUploadUrl, {
		context: { headers: new Headers() },
	});
};

describe("createLogoUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetExternalServicesMocks();
		buildOrgPathMock.mockReturnValue("organizations/org123/logo.png");
		getSignedUploadUrlMock.mockResolvedValue(
			"https://example.com/signed-url",
		);
		isStorageConfiguredMock.mockReturnValue(false);
	});

	it("returns signed URL and path for S3 storage", async () => {
		const client = createClient();
		const result = await client({ organizationId: "org123" });

		expect(result).toEqual({
			signedUploadUrl: "https://example.com/signed-url",
			path: "organizations/org123/logo.png",
		});
		expect(buildOrgPathMock).toHaveBeenCalledWith({
			organizationId: "org123",
			fileType: "logo.png",
		});
		expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
			"organizations/org123/logo.png",
			{ bucket: "avatars-bucket" },
		);
	});

	it("deletes existing file before upload when using S3 storage and file exists", async () => {
		isStorageConfiguredMock.mockReturnValue(true);
		const existsMock = vi.fn().mockResolvedValue(true);
		const deleteMock = vi.fn().mockResolvedValue(undefined);
		getDefaultS3ProviderMock.mockReturnValue({
			exists: existsMock,
			delete: deleteMock,
		});

		const client = createClient();
		await client({ organizationId: "org123" });

		expect(existsMock).toHaveBeenCalledWith(
			"organizations/org123/logo.png",
			"avatars-bucket",
		);
		expect(deleteMock).toHaveBeenCalledWith(
			"organizations/org123/logo.png",
			"avatars-bucket",
		);
	});

	it("skips delete when file does not exist", async () => {
		isStorageConfiguredMock.mockReturnValue(true);
		const existsMock = vi.fn().mockResolvedValue(false);
		const deleteMock = vi.fn();
		getDefaultS3ProviderMock.mockReturnValue({
			exists: existsMock,
			delete: deleteMock,
		});

		const client = createClient();
		await client({ organizationId: "org123" });

		expect(existsMock).toHaveBeenCalled();
		expect(deleteMock).not.toHaveBeenCalled();
	});

	it("ignores errors during delete attempt", async () => {
		isStorageConfiguredMock.mockReturnValue(true);
		const existsMock = vi
			.fn()
			.mockRejectedValue(new Error("storage error"));
		getDefaultS3ProviderMock.mockReturnValue({ exists: existsMock });

		const client = createClient();
		// Should not throw
		const result = await client({ organizationId: "org123" });
		expect(result.signedUploadUrl).toBe("https://example.com/signed-url");
	});
});
