import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addTag } from "./add-tag";
import { createFile } from "./create";
import { deleteFile } from "./delete";
import { getDownloadUrl } from "./get-download-url";
import { getUploadUrl } from "./get-upload-url";
import { listFiles } from "./list";
import { listTags } from "./list-tags";
import { removeTag } from "./remove-tag";

// Shared mocks
const getSessionMock = vi.hoisted(() => vi.fn());
const dbFileFindManyMock = vi.hoisted(() => vi.fn());
const dbFileCountMock = vi.hoisted(() => vi.fn());
const dbFileFindUniqueMock = vi.hoisted(() => vi.fn());
const dbFileFindFirstMock = vi.hoisted(() => vi.fn());
const dbFileCreateMock = vi.hoisted(() => vi.fn());
const dbFileUpdateMock = vi.hoisted(() => vi.fn());
const dbFileDeleteMock = vi.hoisted(() => vi.fn());
const dbFileTagFindManyMock = vi.hoisted(() => vi.fn());
const dbFileTagFindUniqueMock = vi.hoisted(() => vi.fn());
const dbFileTagUpsertMock = vi.hoisted(() => vi.fn());
const dbFileToTagUpsertMock = vi.hoisted(() => vi.fn());
const dbFileToTagDeleteManyMock = vi.hoisted(() => vi.fn());
const shouldUseSupabaseMock = vi.hoisted(() => vi.fn());
const getDefaultSupabaseProviderMock = vi.hoisted(() => vi.fn());
const getSignedUploadUrlMock = vi.hoisted(() => vi.fn());
const getSignedUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	db: {
		file: {
			findMany: dbFileFindManyMock,
			count: dbFileCountMock,
			findUnique: dbFileFindUniqueMock,
			findFirst: dbFileFindFirstMock,
			create: dbFileCreateMock,
			update: dbFileUpdateMock,
			delete: dbFileDeleteMock,
		},
		fileTag: {
			findMany: dbFileTagFindManyMock,
			findUnique: dbFileTagFindUniqueMock,
			upsert: dbFileTagUpsertMock,
		},
		fileToTag: {
			upsert: dbFileToTagUpsertMock,
			deleteMany: dbFileToTagDeleteManyMock,
		},
	},
}));

vi.mock("@repo/storage", () => ({
	shouldUseSupabaseStorage: shouldUseSupabaseMock,
	getDefaultSupabaseProvider: getDefaultSupabaseProviderMock,
	getSignedUploadUrl: getSignedUploadUrlMock,
	getSignedUrl: getSignedUrlMock,
}));

vi.mock("@repo/config", () => ({
	config: {
		storage: {
			bucketNames: { files: "files-bucket" },
		},
	},
}));

const orgId = "org-123";
const userId = "user-123";

const mockSession = {
	user: { id: userId, role: "member" },
	session: { id: "session-1", activeOrganizationId: orgId },
};

function makeContext() {
	getSessionMock.mockResolvedValue(mockSession);
	return { headers: new Headers() };
}

function makeNoOrgContext() {
	getSessionMock.mockResolvedValue({
		user: { id: userId, role: "member" },
		session: { id: "session-1", activeOrganizationId: null },
	});
	return { headers: new Headers() };
}

beforeEach(() => {
	vi.clearAllMocks();
	shouldUseSupabaseMock.mockReturnValue(false);
});

// ── listFiles ───────────────────────────────────────────────────────────────
describe("listFiles", () => {
	it("returns files with pagination", async () => {
		const mockFiles = [
			{
				id: "file-1",
				filename: "test.pdf",
				mimeType: "application/pdf",
				size: 1000,
				storagePath: "path/test.pdf",
				bucket: "files-bucket",
				createdAt: new Date(),
				updatedAt: new Date(),
				user: {
					id: userId,
					name: "Test User",
					email: "test@example.com",
				},
				tags: [],
			},
		];
		dbFileFindManyMock.mockResolvedValue(mockFiles);
		dbFileCountMock.mockResolvedValue(1);

		const client = createProcedureClient(listFiles, {
			context: makeContext(),
		});
		const result = await client({ page: 1, pageSize: 20 });

		expect(result.files).toHaveLength(1);
		expect(result.pagination.totalCount).toBe(1);
		expect(result.pagination.totalPages).toBe(1);
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		const client = createProcedureClient(listFiles, {
			context: makeNoOrgContext(),
		});
		await expect(client({ page: 1, pageSize: 20 })).rejects.toThrow(
			"An active organization is required",
		);
	});

	it("filters by MIME category", async () => {
		dbFileFindManyMock.mockResolvedValue([]);
		dbFileCountMock.mockResolvedValue(0);

		const client = createProcedureClient(listFiles, {
			context: makeContext(),
		});
		await client({ page: 1, pageSize: 20, mimeCategory: "audio" });

		expect(dbFileFindManyMock).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({
					OR: expect.arrayContaining([
						expect.objectContaining({
							mimeType: { startsWith: "audio/" },
						}),
					]),
				}),
			}),
		);
	});
});

// ── createFile ──────────────────────────────────────────────────────────────
describe("createFile", () => {
	const input = {
		filename: "new.pdf",
		mimeType: "application/pdf",
		size: 500,
		storagePath: "path/new.pdf",
		bucket: "files-bucket",
	};

	it("creates a new file record when none exists", async () => {
		dbFileFindFirstMock.mockResolvedValue(null);
		const created = {
			id: "file-new",
			...input,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		dbFileCreateMock.mockResolvedValue(created);

		const client = createProcedureClient(createFile, {
			context: makeContext(),
		});
		const result = await client(input);

		expect(result.file.id).toBe("file-new");
		expect(dbFileCreateMock).toHaveBeenCalled();
	});

	it("updates existing file record on path conflict", async () => {
		const existing = { id: "file-existing", ...input };
		dbFileFindFirstMock.mockResolvedValue(existing);
		const updated = {
			...existing,
			createdAt: new Date(),
			updatedAt: new Date(),
		};
		dbFileUpdateMock.mockResolvedValue(updated);

		const client = createProcedureClient(createFile, {
			context: makeContext(),
		});
		const result = await client(input);

		expect(result.file.id).toBe("file-existing");
		expect(dbFileUpdateMock).toHaveBeenCalled();
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		const client = createProcedureClient(createFile, {
			context: makeNoOrgContext(),
		});
		await expect(client(input)).rejects.toThrow(
			"An active organization is required",
		);
	});
});

// ── deleteFile ──────────────────────────────────────────────────────────────
describe("deleteFile", () => {
	const mockFile = {
		id: "file-1",
		organizationId: orgId,
		storagePath: "path/file.pdf",
		bucket: "files-bucket",
	};

	it("deletes a file successfully", async () => {
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		dbFileDeleteMock.mockResolvedValue(mockFile);

		const client = createProcedureClient(deleteFile, {
			context: makeContext(),
		});
		const result = await client({ fileId: "file-1" });

		expect(result.success).toBe(true);
	});

	it("throws NOT_FOUND when file does not exist", async () => {
		dbFileFindUniqueMock.mockResolvedValue(null);

		const client = createProcedureClient(deleteFile, {
			context: makeContext(),
		});
		await expect(client({ fileId: "missing" })).rejects.toThrow(
			"File not found",
		);
	});

	it("throws FORBIDDEN when file belongs to another org", async () => {
		dbFileFindUniqueMock.mockResolvedValue({
			...mockFile,
			organizationId: "other-org",
		});

		const client = createProcedureClient(deleteFile, {
			context: makeContext(),
		});
		await expect(client({ fileId: "file-1" })).rejects.toThrow(
			"You do not have permission",
		);
	});

	it("deletes from Supabase storage when enabled", async () => {
		shouldUseSupabaseMock.mockReturnValue(true);
		const providerDeleteMock = vi.fn().mockResolvedValue(undefined);
		getDefaultSupabaseProviderMock.mockReturnValue({
			delete: providerDeleteMock,
		});
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		dbFileDeleteMock.mockResolvedValue(mockFile);

		const client = createProcedureClient(deleteFile, {
			context: makeContext(),
		});
		await client({ fileId: "file-1" });

		expect(providerDeleteMock).toHaveBeenCalledWith(
			mockFile.storagePath,
			mockFile.bucket,
		);
	});
});

// ── getUploadUrl ────────────────────────────────────────────────────────────
describe("getUploadUrl", () => {
	it("returns signed upload URL (non-Supabase)", async () => {
		getSignedUploadUrlMock.mockResolvedValue(
			"https://storage.example.com/upload",
		);

		const client = createProcedureClient(getUploadUrl, {
			context: makeContext(),
		});
		const result = await client({
			filename: "test.pdf",
			contentType: "application/pdf",
		});

		expect(result.signedUploadUrl).toBe(
			"https://storage.example.com/upload",
		);
		expect(result.bucket).toBe("files-bucket");
		expect(result.path).toMatch(/organizations\/org-123\/files\//);
	});

	it("uses Supabase provider when enabled", async () => {
		shouldUseSupabaseMock.mockReturnValue(true);
		const getSignedUploadUrlProviderMock = vi
			.fn()
			.mockResolvedValue("https://supabase.example.com/upload");
		getDefaultSupabaseProviderMock.mockReturnValue({
			getSignedUploadUrl: getSignedUploadUrlProviderMock,
		});

		const client = createProcedureClient(getUploadUrl, {
			context: makeContext(),
		});
		const result = await client({
			filename: "test.pdf",
			contentType: "application/pdf",
		});

		expect(result.signedUploadUrl).toBe(
			"https://supabase.example.com/upload",
		);
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		const client = createProcedureClient(getUploadUrl, {
			context: makeNoOrgContext(),
		});
		await expect(
			client({ filename: "test.pdf", contentType: "application/pdf" }),
		).rejects.toThrow("An active organization is required");
	});
});

// ── getDownloadUrl ──────────────────────────────────────────────────────────
describe("getDownloadUrl", () => {
	const mockFile = {
		id: "file-1",
		organizationId: orgId,
		storagePath: "path/file.pdf",
		bucket: "files-bucket",
		filename: "file.pdf",
		mimeType: "application/pdf",
	};

	it("returns signed download URL", async () => {
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		getSignedUrlMock.mockResolvedValue("https://cdn.example.com/download");

		const client = createProcedureClient(getDownloadUrl, {
			context: makeContext(),
		});
		const result = await client({ fileId: "file-1" });

		expect(result.downloadUrl).toBe("https://cdn.example.com/download");
		expect(result.filename).toBe("file.pdf");
	});

	it("throws NOT_FOUND for missing file", async () => {
		dbFileFindUniqueMock.mockResolvedValue(null);

		const client = createProcedureClient(getDownloadUrl, {
			context: makeContext(),
		});
		await expect(client({ fileId: "missing" })).rejects.toThrow(
			"File not found",
		);
	});

	it("throws FORBIDDEN for file in another org", async () => {
		dbFileFindUniqueMock.mockResolvedValue({
			...mockFile,
			organizationId: "other-org",
		});

		const client = createProcedureClient(getDownloadUrl, {
			context: makeContext(),
		});
		await expect(client({ fileId: "file-1" })).rejects.toThrow(
			"You do not have permission",
		);
	});
});

// ── addTag ──────────────────────────────────────────────────────────────────
describe("addTag", () => {
	const mockFile = { id: "file-1", organizationId: orgId };

	it("creates and associates a new tag", async () => {
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		const createdTag = { id: "tag-1", name: "invoice" };
		dbFileTagUpsertMock.mockResolvedValue(createdTag);
		dbFileToTagUpsertMock.mockResolvedValue({});

		const client = createProcedureClient(addTag, {
			context: makeContext(),
		});
		const result = await client({ fileId: "file-1", tagName: "Invoice" });

		expect(result.tag.name).toBe("invoice"); // normalized
	});

	it("throws NOT_FOUND for missing file", async () => {
		dbFileFindUniqueMock.mockResolvedValue(null);

		const client = createProcedureClient(addTag, {
			context: makeContext(),
		});
		await expect(
			client({ fileId: "missing", tagName: "test" }),
		).rejects.toThrow("File not found");
	});

	it("throws FORBIDDEN for file in another org", async () => {
		dbFileFindUniqueMock.mockResolvedValue({
			...mockFile,
			organizationId: "other-org",
		});

		const client = createProcedureClient(addTag, {
			context: makeContext(),
		});
		await expect(
			client({ fileId: "file-1", tagName: "test" }),
		).rejects.toThrow("You do not have permission");
	});
});

// ── removeTag ───────────────────────────────────────────────────────────────
describe("removeTag", () => {
	const mockFile = { id: "file-1", organizationId: orgId };
	const mockTag = { id: "tag-1", organizationId: orgId };

	it("removes tag association successfully", async () => {
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		dbFileTagFindUniqueMock.mockResolvedValue(mockTag);
		dbFileToTagDeleteManyMock.mockResolvedValue({ count: 1 });

		const client = createProcedureClient(removeTag, {
			context: makeContext(),
		});
		const result = await client({ fileId: "file-1", tagId: "tag-1" });

		expect(result.success).toBe(true);
	});

	it("throws NOT_FOUND when tag belongs to another org", async () => {
		dbFileFindUniqueMock.mockResolvedValue(mockFile);
		dbFileTagFindUniqueMock.mockResolvedValue({
			...mockTag,
			organizationId: "other-org",
		});

		const client = createProcedureClient(removeTag, {
			context: makeContext(),
		});
		await expect(
			client({ fileId: "file-1", tagId: "tag-1" }),
		).rejects.toThrow("Tag not found");
	});
});

// ── listTags ─────────────────────────────────────────────────────────────────
describe("listTags", () => {
	it("returns tags with file counts", async () => {
		dbFileTagFindManyMock.mockResolvedValue([
			{
				id: "tag-1",
				name: "invoice",
				createdAt: new Date(),
				_count: { files: 3 },
			},
		]);

		const client = createProcedureClient(listTags, {
			context: makeContext(),
		});
		const result = await client(undefined);

		expect(result.tags).toHaveLength(1);
		expect(result.tags[0].fileCount).toBe(3);
	});

	it("throws BAD_REQUEST when no active organization", async () => {
		const client = createProcedureClient(listTags, {
			context: makeNoOrgContext(),
		});
		await expect(client(undefined)).rejects.toThrow(
			"An active organization is required",
		);
	});
});
