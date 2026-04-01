import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { invoiceProcessorRouter } from "./router";

const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const buildUserPathMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	getSignedUploadUrl: getSignedUploadUrlMock,
	buildUserPath: buildUserPathMock,
}));

vi.mock("@repo/config", () => ({
	config: {
		storage: {
			bucketNames: {
				invoices: "invoices-bucket",
			},
		},
	},
}));

vi.mock("@repo/logs", () => ({
	logger: { error: vi.fn() },
}));

const mockSession = {
	user: {
		id: "user-1",
		email: "user@example.com",
		name: "Test User",
		role: "member",
	},
	session: { activeOrganizationId: "org-1" },
};

const caller = createProcedureClient(invoiceProcessorRouter.uploadUrl, {
	context: async () => {
		const session = await getSessionMock();
		return { user: session?.user, session: session?.session };
	},
});

describe("invoiceProcessorRouter.uploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
		buildUserPathMock.mockReturnValue(
			"organizations/org-1/users/user-1/invoices/uuid.pdf",
		);
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.example.com/signed-url",
		);
	});

	it("returns signed upload URL for valid PDF", async () => {
		const result = await caller({
			filename: "invoice.pdf",
			mimeType: "application/pdf",
		});

		expect(result.signedUploadUrl).toBe(
			"https://storage.example.com/signed-url",
		);
		expect(result.path).toBe(
			"organizations/org-1/users/user-1/invoices/uuid.pdf",
		);
		expect(result.bucket).toBe("invoices-bucket");
	});

	it("returns signed upload URL for valid image types", async () => {
		for (const mimeType of [
			"image/jpeg",
			"image/png",
			"image/tiff",
			"image/webp",
		]) {
			const result = await caller({ filename: "invoice.jpg", mimeType });
			expect(result.signedUploadUrl).toBeTruthy();
		}
	});

	it("throws BAD_REQUEST for unsupported MIME type", async () => {
		await expect(
			caller({ filename: "doc.docx", mimeType: "application/msword" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		getSessionMock.mockResolvedValue({
			...mockSession,
			session: { activeOrganizationId: null },
		});

		await expect(
			caller({ filename: "invoice.pdf", mimeType: "application/pdf" }),
		).rejects.toMatchObject({ code: "BAD_REQUEST" });
	});

	it("throws UNAUTHORIZED when no session", async () => {
		getSessionMock.mockResolvedValue(null);

		await expect(
			caller({ filename: "invoice.pdf", mimeType: "application/pdf" }),
		).rejects.toMatchObject({ code: "UNAUTHORIZED" });
	});
});
