import { createProcedureClient, ORPCError } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	mockMailModule,
	mockPaymentsModule,
	resetExternalServicesMocks,
} from "../../../../../tests/fixtures/external-services";
import { createInvoiceUploadUrl } from "./create-invoice-upload-url";

const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const buildUserPathMock = vi.hoisted(() => vi.fn());
const getSessionMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/mail", () => mockMailModule());
vi.mock("@repo/payments", () => mockPaymentsModule());

vi.mock("@repo/storage", () => ({
	getSignedUploadUrl: getSignedUploadUrlMock,
	buildUserPath: buildUserPathMock,
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

describe("createInvoiceUploadUrl", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		resetExternalServicesMocks();
		buildUserPathMock.mockReturnValue(
			"organizations/org-456/users/user-123/invoices/uuid.pdf",
		);
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.test/signed-upload-url",
		);
	});

	const createClient = (sessionOverrides?: {
		userId?: string;
		organizationId?: string | null;
	}) => {
		const userId = sessionOverrides?.userId ?? "user-123";
		const organizationId =
			sessionOverrides?.organizationId !== undefined
				? sessionOverrides.organizationId
				: "org-456";

		getSessionMock.mockResolvedValue({
			user: { id: userId },
			session: { id: "session-1", activeOrganizationId: organizationId },
		});

		return createProcedureClient(createInvoiceUploadUrl, {
			context: { headers: new Headers() },
		});
	};

	it("returns signed upload URL for valid PDF input", async () => {
		const client = createClient();
		const result = await client({
			filename: "invoice.pdf",
			mimeType: "application/pdf",
		});

		expect(result.signedUploadUrl).toBe(
			"https://storage.test/signed-upload-url",
		);
		expect(result.path).toBeDefined();
		expect(result.bucket).toBeDefined();
		expect(getSignedUploadUrlMock).toHaveBeenCalledWith(
			expect.any(String),
			{
				bucket: expect.any(String),
			},
		);
	});

	it("returns signed upload URL for valid image input", async () => {
		const client = createClient();
		const result = await client({
			filename: "receipt.jpg",
			mimeType: "image/jpeg",
		});

		expect(result.signedUploadUrl).toBe(
			"https://storage.test/signed-upload-url",
		);
		expect(result.bucket).toBeDefined();
	});

	it("rejects unsupported MIME type", async () => {
		const client = createClient();

		await expect(
			client({
				filename: "document.docx",
				mimeType: "application/msword",
			}),
		).rejects.toThrow(ORPCError);
	});

	it("rejects when not authenticated", async () => {
		getSessionMock.mockResolvedValue(null);

		const client = createProcedureClient(createInvoiceUploadUrl, {
			context: { headers: new Headers() },
		});

		await expect(
			client({ filename: "invoice.pdf", mimeType: "application/pdf" }),
		).rejects.toThrow(ORPCError);
	});

	it("rejects when no active organization", async () => {
		const client = createClient({ organizationId: null });

		await expect(
			client({ filename: "invoice.pdf", mimeType: "application/pdf" }),
		).rejects.toThrow(ORPCError);
	});

	it("uses extension from filename when present", async () => {
		const client = createClient();
		await client({ filename: "my-invoice.png", mimeType: "image/png" });

		expect(buildUserPathMock).toHaveBeenCalledWith(
			expect.objectContaining({
				fileType: expect.stringMatching(/^invoices\/.*\.png$/),
			}),
		);
	});

	it("derives extension from MIME type when filename has no extension", async () => {
		const client = createClient();
		await client({ filename: "invoice", mimeType: "application/pdf" });

		expect(buildUserPathMock).toHaveBeenCalledWith(
			expect.objectContaining({
				fileType: expect.stringMatching(/^invoices\/.*\.pdf$/),
			}),
		);
	});

	it("accepts TIFF and WebP MIME types", async () => {
		const client = createClient();
		for (const mimeType of ["image/tiff", "image/webp"]) {
			await expect(
				client({ filename: "file", mimeType }),
			).resolves.toBeDefined();
		}
	});
});
