import { createProcedureClient, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationsRouter } from "./router";

// Mock dependencies
const getOrganizationBySlugMock = vi.hoisted(() => vi.fn());
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	getOrganizationBySlug: getOrganizationBySlugMock,
}));

vi.mock("@repo/storage", () => ({
	getSignedUploadUrl: getSignedUploadUrlMock,
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

describe("Organizations Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.test/signed-upload-url",
		);
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
			const result = await client();

			expect(result).toEqual({
				signedUploadUrl: "https://storage.test/signed-upload-url",
			});
			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				"user-123.png",
				{
					bucket: expect.any(String),
				},
			);
		});

		it("uses user ID in filename", async () => {
			const client = createClient("different-user-id");
			await client();

			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				"different-user-id.png",
				expect.any(Object),
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

			await expect(client()).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});
	});
});
