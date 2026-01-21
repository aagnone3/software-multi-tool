import { createProcedureClient, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsRouter } from "./router";

// Mock dependencies
const getOrganizationBySlugMock = vi.hoisted(() => vi.fn());
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn());
const getDefaultSupabaseProviderMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getOrganizationBySlug: getOrganizationBySlugMock,
}));

vi.mock("@repo/storage", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@repo/storage")>();
	return {
		...actual,
		getSignedUploadUrl: getSignedUploadUrlMock,
		shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
		getDefaultSupabaseProvider: getDefaultSupabaseProviderMock,
	};
});

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

describe("Organizations Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.test/signed-upload-url",
		);
		// Default to S3 provider (no Supabase)
		shouldUseSupabaseStorageMock.mockReturnValue(false);
	});

	describe("organizations.generateSlug", () => {
		const createClient = () =>
			createProcedureClient(organizationsRouter.generateSlug, {
				context: {
					headers: new Headers(),
				},
			});

		it("generates slug from organization name", async () => {
			getOrganizationBySlugMock.mockResolvedValue(null);

			const client = createClient();
			const result = await client({ name: "My Organization" });

			expect(result).toEqual({ slug: "my-organization" });
			expect(getOrganizationBySlugMock).toHaveBeenCalledWith(
				"my-organization",
			);
		});

		it("handles special characters in organization name", async () => {
			getOrganizationBySlugMock.mockResolvedValue(null);

			const client = createClient();
			const result = await client({ name: "My Org & Co.!" });

			expect(result.slug).toMatch(/^my-org-and-co/);
		});

		it("appends random suffix when slug already exists", async () => {
			// First call returns existing org, second call returns null
			getOrganizationBySlugMock
				.mockResolvedValueOnce({ id: "existing-org" })
				.mockResolvedValueOnce(null);

			const client = createClient();
			const result = await client({ name: "Existing Org" });

			expect(result.slug).toMatch(/^existing-org-[a-zA-Z0-9]{5}$/);
			expect(getOrganizationBySlugMock).toHaveBeenCalledTimes(2);
		});

		it("throws INTERNAL_SERVER_ERROR after 3 failed attempts", async () => {
			// All attempts return existing orgs
			getOrganizationBySlugMock.mockResolvedValue({ id: "existing-org" });

			const client = createClient();

			await expect(
				client({ name: "Popular Name" }),
			).rejects.toBeInstanceOf(ORPCError);

			await expect(
				client({ name: "Popular Name" }),
			).rejects.toMatchObject({
				code: "INTERNAL_SERVER_ERROR",
			});

			expect(getOrganizationBySlugMock).toHaveBeenCalledTimes(6); // 3 attempts x 2 calls
		});

		it("rejects missing name field", async () => {
			const client = createClient();

			await expect(
				// @ts-expect-error - testing runtime validation
				client({}),
			).rejects.toThrow();
		});
	});

	describe("organizations.createLogoUploadUrl", () => {
		// Valid UUIDs for testing (buildOrgPath validates UUID format)
		const TEST_ORG_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
		const OTHER_ORG_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";

		const createClient = (userId = "user-123") => {
			getSessionMock.mockResolvedValue({
				user: { id: userId, role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(
				organizationsRouter.createLogoUploadUrl,
				{
					context: {
						headers: new Headers(),
					},
				},
			);
		};

		it("creates signed upload URL for authenticated user", async () => {
			const client = createClient();
			const result = await client({ organizationId: TEST_ORG_ID });

			expect(result).toEqual({
				signedUploadUrl: "https://storage.test/signed-upload-url",
				path: `organizations/${TEST_ORG_ID}/logo.png`,
			});
			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				`organizations/${TEST_ORG_ID}/logo.png`,
				{
					bucket: expect.any(String),
				},
			);
		});

		it("uses organization ID in path", async () => {
			const client = createClient();
			await client({ organizationId: OTHER_ORG_ID });

			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				`organizations/${OTHER_ORG_ID}/logo.png`,
				{
					bucket: expect.any(String),
				},
			);
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(
				organizationsRouter.createLogoUploadUrl,
				{
					context: {
						headers: new Headers(),
					},
				},
			);

			await expect(
				client({ organizationId: TEST_ORG_ID }),
			).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
