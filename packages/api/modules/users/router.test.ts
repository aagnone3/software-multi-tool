import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usersRouter } from "./router";

// Mock dependencies
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	getDefaultSupabaseProvider: () => ({
		getSignedUploadUrl: getSignedUploadUrlMock,
	}),
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

describe("Users Router", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.test/signed-upload-url",
		);
	});

	describe("users.avatarUploadUrl", () => {
		const createClient = (userId = "user-123") => {
			getSessionMock.mockResolvedValue({
				user: { id: userId, role: "member" },
				session: { id: "session-1" },
			});

			return createProcedureClient(usersRouter.avatarUploadUrl, {
				context: {
					headers: new Headers(),
				},
			});
		};

		it("creates signed upload URL for authenticated user", async () => {
			const client = createClient();
			const result = await client();

			expect(result).toEqual({
				signedUploadUrl: "https://storage.test/signed-upload-url",
			});
			expect(getSignedUploadUrlMock).toHaveBeenCalledWith("user-123.png", {
				bucket: expect.any(String),
				contentType: "image/png",
				expiresIn: 60,
			});
		});

		it("uses user ID in filename", async () => {
			const client = createClient("different-user-id");
			await client();

			expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
				"different-user-id.png",
				{
					bucket: expect.any(String),
					contentType: "image/png",
					expiresIn: 60,
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
