import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { filesRouter } from "./router";

// Valid UUIDs for testing
const TEST_ORG_ID = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
const TEST_USER_ID = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
const TEST_FILE_ID = "c3d4e5f6-a7b8-4c9d-ae1f-2a3b4c5d6e7f";
const TEST_TAG_ID = "d4e5f6a7-b8c9-4dae-bf2a-3b4c5d6e7f8a";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const getSignedUrlMock = vi.hoisted(() => vi.fn());
const shouldUseSupabaseStorageMock = vi.hoisted(() => vi.fn(() => false));
const deleteStorageMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));

// Database mocks
const fileFindManyMock = vi.hoisted(() => vi.fn());
const fileCountMock = vi.hoisted(() => vi.fn());
const fileFindUniqueMock = vi.hoisted(() => vi.fn());
const fileFindFirstMock = vi.hoisted(() => vi.fn());
const fileCreateMock = vi.hoisted(() => vi.fn());
const fileUpdateMock = vi.hoisted(() => vi.fn());
const fileDeleteMock = vi.hoisted(() => vi.fn());
const fileTagFindManyMock = vi.hoisted(() => vi.fn());
const fileTagUpsertMock = vi.hoisted(() => vi.fn());
const fileTagFindUniqueMock = vi.hoisted(() => vi.fn());
const fileToTagUpsertMock = vi.hoisted(() => vi.fn());
const fileToTagDeleteManyMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@repo/storage")>();
	return {
		...actual,
		getSignedUrl: getSignedUrlMock,
		shouldUseSupabaseStorage: shouldUseSupabaseStorageMock,
		getDefaultSupabaseProvider: vi.fn(() => ({
			delete: deleteStorageMock,
		})),
	};
});

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	db: {
		file: {
			findMany: fileFindManyMock,
			count: fileCountMock,
			findUnique: fileFindUniqueMock,
			findFirst: fileFindFirstMock,
			create: fileCreateMock,
			update: fileUpdateMock,
			delete: fileDeleteMock,
		},
		fileTag: {
			findMany: fileTagFindManyMock,
			upsert: fileTagUpsertMock,
			findUnique: fileTagFindUniqueMock,
		},
		fileToTag: {
			upsert: fileToTagUpsertMock,
			deleteMany: fileToTagDeleteManyMock,
		},
	},
}));

describe("Files Router", () => {
	const mockSession = {
		user: { id: TEST_USER_ID, role: "member" },
		session: { id: "session-1", activeOrganizationId: TEST_ORG_ID },
	};

	const createContext = () => ({
		headers: new Headers(),
	});

	beforeEach(() => {
		vi.clearAllMocks();
		getSessionMock.mockResolvedValue(mockSession);
	});

	describe("files.list", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.list, {
				context: createContext(),
			});

		it("lists files for the organization", async () => {
			const mockFiles = [
				{
					id: TEST_FILE_ID,
					filename: "test.png",
					mimeType: "image/png",
					size: 1024,
					storagePath: "organizations/test/test.png",
					bucket: "uploads",
					createdAt: new Date(),
					updatedAt: new Date(),
					user: {
						id: TEST_USER_ID,
						name: "Test User",
						email: "test@example.com",
					},
					tags: [],
				},
			];

			fileFindManyMock.mockResolvedValue(mockFiles);
			fileCountMock.mockResolvedValue(1);

			const client = createClient();
			const result = await client({
				page: 1,
				pageSize: 20,
			});

			expect(result.files).toHaveLength(1);
			expect(result.files[0].filename).toBe("test.png");
			expect(result.pagination.totalCount).toBe(1);
		});

		it("filters by MIME category", async () => {
			fileFindManyMock.mockResolvedValue([]);
			fileCountMock.mockResolvedValue(0);

			const client = createClient();
			await client({
				mimeCategory: "audio",
				page: 1,
				pageSize: 20,
			});

			expect(fileFindManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						organizationId: TEST_ORG_ID,
						OR: expect.any(Array),
					}),
				}),
			);
		});

		it("searches by filename", async () => {
			fileFindManyMock.mockResolvedValue([]);
			fileCountMock.mockResolvedValue(0);

			const client = createClient();
			await client({
				search: "test",
				page: 1,
				pageSize: 20,
			});

			expect(fileFindManyMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.objectContaining({
						filename: { contains: "test", mode: "insensitive" },
					}),
				}),
			);
		});

		it("throws BAD_REQUEST without active organization", async () => {
			getSessionMock.mockResolvedValue({
				...mockSession,
				session: { ...mockSession.session, activeOrganizationId: null },
			});

			const client = createClient();

			await expect(
				client({ page: 1, pageSize: 20 }),
			).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});
	});

	describe("files.create", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.create, {
				context: createContext(),
			});

		it("creates a new file record", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				filename: "test.png",
				mimeType: "image/png",
				size: 1024,
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
				organizationId: TEST_ORG_ID,
				userId: TEST_USER_ID,
				createdAt: new Date(),
				updatedAt: new Date(),
			};

			fileFindFirstMock.mockResolvedValue(null);
			fileCreateMock.mockResolvedValue(mockFile);

			const client = createClient();
			const result = await client({
				filename: "test.png",
				mimeType: "image/png",
				size: 1024,
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
			});

			expect(result.file.filename).toBe("test.png");
			expect(fileCreateMock).toHaveBeenCalledWith({
				data: expect.objectContaining({
					organizationId: TEST_ORG_ID,
					userId: TEST_USER_ID,
					filename: "test.png",
				}),
			});
		});

		it("updates existing file record with same path", async () => {
			const existingFile = {
				id: TEST_FILE_ID,
				filename: "old.png",
				mimeType: "image/png",
				size: 512,
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
			};

			const updatedFile = {
				...existingFile,
				filename: "new.png",
				size: 1024,
			};

			fileFindFirstMock.mockResolvedValue(existingFile);
			fileUpdateMock.mockResolvedValue(updatedFile);

			const client = createClient();
			const result = await client({
				filename: "new.png",
				mimeType: "image/png",
				size: 1024,
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
			});

			expect(result.file.filename).toBe("new.png");
			expect(fileUpdateMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: { id: TEST_FILE_ID },
				}),
			);
		});
	});

	describe("files.delete", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.delete, {
				context: createContext(),
			});

		it("deletes a file", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				organizationId: TEST_ORG_ID,
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
			};

			fileFindUniqueMock.mockResolvedValue(mockFile);
			fileDeleteMock.mockResolvedValue(mockFile);

			const client = createClient();
			const result = await client({ fileId: TEST_FILE_ID });

			expect(result.success).toBe(true);
			expect(fileDeleteMock).toHaveBeenCalledWith({
				where: { id: TEST_FILE_ID },
			});
		});

		it("throws NOT_FOUND for nonexistent file", async () => {
			fileFindUniqueMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({ fileId: TEST_FILE_ID }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN for file in different organization", async () => {
			fileFindUniqueMock.mockResolvedValue({
				id: TEST_FILE_ID,
				organizationId: "different-org-id",
			});

			const client = createClient();

			await expect(
				client({ fileId: TEST_FILE_ID }),
			).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});
	});

	describe("files.addTag", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.addTag, {
				context: createContext(),
			});

		it("adds a tag to a file", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				organizationId: TEST_ORG_ID,
			};

			const mockTag = {
				id: TEST_TAG_ID,
				name: "invoice",
				organizationId: TEST_ORG_ID,
			};

			fileFindUniqueMock.mockResolvedValue(mockFile);
			fileTagUpsertMock.mockResolvedValue(mockTag);
			fileToTagUpsertMock.mockResolvedValue({});

			const client = createClient();
			const result = await client({
				fileId: TEST_FILE_ID,
				tagName: "Invoice",
			});

			expect(result.tag.name).toBe("invoice");
			expect(fileTagUpsertMock).toHaveBeenCalledWith(
				expect.objectContaining({
					where: {
						organizationId_name: {
							organizationId: TEST_ORG_ID,
							name: "invoice",
						},
					},
				}),
			);
		});

		it("normalizes tag name to lowercase", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				organizationId: TEST_ORG_ID,
			};

			fileFindUniqueMock.mockResolvedValue(mockFile);
			fileTagUpsertMock.mockResolvedValue({
				id: TEST_TAG_ID,
				name: "invoice",
			});
			fileToTagUpsertMock.mockResolvedValue({});

			const client = createClient();
			await client({
				fileId: TEST_FILE_ID,
				tagName: "INVOICE",
			});

			expect(fileTagUpsertMock).toHaveBeenCalledWith(
				expect.objectContaining({
					create: expect.objectContaining({
						name: "invoice",
					}),
				}),
			);
		});
	});

	describe("files.removeTag", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.removeTag, {
				context: createContext(),
			});

		it("removes a tag from a file", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				organizationId: TEST_ORG_ID,
			};

			const mockTag = {
				id: TEST_TAG_ID,
				organizationId: TEST_ORG_ID,
			};

			fileFindUniqueMock.mockResolvedValue(mockFile);
			fileTagFindUniqueMock.mockResolvedValue(mockTag);
			fileToTagDeleteManyMock.mockResolvedValue({ count: 1 });

			const client = createClient();
			const result = await client({
				fileId: TEST_FILE_ID,
				tagId: TEST_TAG_ID,
			});

			expect(result.success).toBe(true);
			expect(fileToTagDeleteManyMock).toHaveBeenCalledWith({
				where: {
					fileId: TEST_FILE_ID,
					tagId: TEST_TAG_ID,
				},
			});
		});
	});

	describe("files.listTags", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.listTags, {
				context: createContext(),
			});

		it("lists all tags for the organization", async () => {
			const mockTags = [
				{
					id: TEST_TAG_ID,
					name: "invoice",
					createdAt: new Date(),
					_count: { files: 5 },
				},
			];

			fileTagFindManyMock.mockResolvedValue(mockTags);

			const client = createClient();
			const result = await client({});

			expect(result.tags).toHaveLength(1);
			expect(result.tags[0].name).toBe("invoice");
			expect(result.tags[0].fileCount).toBe(5);
		});
	});

	describe("files.getDownloadUrl", () => {
		const createClient = () =>
			createProcedureClient(filesRouter.getDownloadUrl, {
				context: createContext(),
			});

		it("returns a signed download URL", async () => {
			const mockFile = {
				id: TEST_FILE_ID,
				organizationId: TEST_ORG_ID,
				filename: "test.png",
				mimeType: "image/png",
				storagePath: "organizations/test/test.png",
				bucket: "uploads",
			};

			fileFindUniqueMock.mockResolvedValue(mockFile);
			getSignedUrlMock.mockResolvedValue(
				"https://storage.test/signed-url",
			);

			const client = createClient();
			const result = await client({ fileId: TEST_FILE_ID });

			expect(result.downloadUrl).toBe("https://storage.test/signed-url");
			expect(result.filename).toBe("test.png");
		});
	});
});
