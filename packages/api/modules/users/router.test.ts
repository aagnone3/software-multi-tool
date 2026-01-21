import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersRouter } from "./router";

// Mock dependencies
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn(() => false));
const existsMock = vi.hoisted(() => vi.fn(() => Promise.resolve(false)));
const deleteMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

vi.mock("@repo/storage", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@repo/storage")>();
	return {
		...actual,
		getSignedUploadUrl: getSignedUploadUrlMock,
		shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
		getDefaultSupabaseProvider: vi.fn(() => ({
			exists: existsMock,
			delete: deleteMock,
		})),
	};
});

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

describe("Users Router", () => {
	// Valid UUIDs for testing (buildUserPath validates UUID format)
	const TEST_ORG_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
	const TEST_USER_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
	const OTHER_USER_ID = "c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f";

	beforeEach(() => {
		vi.clearAllMocks();
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.test/signed-upload-url",
		);
	});

	describe("users.avatarUploadUrl", () => {
		const createClient = (
			userId = TEST_USER_ID,
			activeOrganizationId: string | null = TEST_ORG_ID,
		) => {
			getSessionMock.mockResolvedValue({
				user: { id: userId, role: "member" },
				session: { id: "session-1", activeOrganizationId },
			});

			return createProcedureClient(usersRouter.avatarUploadUrl, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("creates signed upload URL for authenticated user with org-scoped path", async () => {
			const client = createClient();
			const result = await client();

			expect(result).toEqual({
				signedUploadUrl: "https://storage.test/signed-upload-url",
				path: `organizations/${TEST_ORG_ID}/users/${TEST_USER_ID}/avatar.png`,
			});
			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				`organizations/${TEST_ORG_ID}/users/${TEST_USER_ID}/avatar.png`,
				{
					bucket: expect.any(String),
				},
			);
		});

		it("uses user ID and organization ID in path", async () => {
			const client = createClient(OTHER_USER_ID);
			await client();

			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				`organizations/${TEST_ORG_ID}/users/${OTHER_USER_ID}/avatar.png`,
				{
					bucket: expect.any(String),
				},
			);
		});

		it("throws UNAUTHORIZED when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createProcedureClient(usersRouter.avatarUploadUrl, {
				context: {
					headers: new Headers(),
				},
			});

			await expect(client()).rejects.toMatchObject({
				code: "UNAUTHORIZED",
			});
		});

		it("throws BAD_REQUEST when no active organization", async () => {
			const client = createClient(TEST_USER_ID, null);

			await expect(client()).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});

		it("handles storage service errors", async () => {
			getSignedUploadUrlMock.mockRejectedValue(
				new Error("Storage service unavailable"),
			);

			const client = createClient();

			await expect(client()).rejects.toThrow(
				"Storage service unavailable",
			);
		});
	});
});
