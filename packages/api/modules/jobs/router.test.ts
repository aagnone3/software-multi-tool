import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { jobsRouter } from "./router";

// Mock dependencies
const getSessionMock = vi.hoisted(() => vi.fn());
const createToolJobMock = vi.hoisted(() => vi.fn());
const getToolJobByIdMock = vi.hoisted(() => vi.fn());
const getToolJobsByUserIdMock = vi.hoisted(() => vi.fn());
const getToolJobsBySessionIdMock = vi.hoisted(() => vi.fn());
const cancelToolJobMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	createToolJob: createToolJobMock,
	getToolJobById: getToolJobByIdMock,
	getToolJobsByUserId: getToolJobsByUserIdMock,
	getToolJobsBySessionId: getToolJobsBySessionIdMock,
	cancelToolJob: cancelToolJobMock,
}));

describe("Jobs Router", () => {
	// Use valid CUID format for test IDs
	const TEST_JOB_ID = "clz1234567890abcdefghij";
	const TEST_USER_ID = "clu1234567890abcdefghij";

	const mockJob = {
		id: TEST_JOB_ID,
		toolSlug: "bg-remover",
		status: "PENDING",
		priority: 0,
		input: { imageUrl: "https://example.com/image.png" },
		output: null,
		error: null,
		userId: TEST_USER_ID,
		sessionId: null,
		attempts: 0,
		maxAttempts: 3,
		startedAt: null,
		completedAt: null,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("jobs.create", () => {
		const createClient = (headers?: Headers) =>
			createProcedureClient(jobsRouter.create, {
				context: {
					headers: headers ?? new Headers(),
				},
			});

		it("creates job for authenticated user", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			createToolJobMock.mockResolvedValue(mockJob);

			const client = createClient();
			const result = await client({
				toolSlug: "bg-remover",
				input: { imageUrl: "https://example.com/image.png" },
			});

			expect(result).toEqual({ job: mockJob });
			expect(createToolJobMock).toHaveBeenCalledWith({
				toolSlug: "bg-remover",
				input: { imageUrl: "https://example.com/image.png" },
				userId: TEST_USER_ID,
				sessionId: undefined,
				priority: undefined,
			});
		});

		it("creates job with sessionId for anonymous user", async () => {
			getSessionMock.mockResolvedValue(null);
			createToolJobMock.mockResolvedValue({
				...mockJob,
				userId: null,
				sessionId: "anon-session-123",
			});

			const client = createClient();
			const result = await client({
				toolSlug: "bg-remover",
				input: { imageUrl: "https://example.com/image.png" },
				sessionId: "anon-session-123",
			});

			expect(result.job.sessionId).toBe("anon-session-123");
			expect(createToolJobMock).toHaveBeenCalledWith({
				toolSlug: "bg-remover",
				input: { imageUrl: "https://example.com/image.png" },
				userId: undefined,
				sessionId: "anon-session-123",
				priority: undefined,
			});
		});

		it("throws BAD_REQUEST when neither authenticated nor sessionId provided", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createClient();

			await expect(
				client({
					toolSlug: "bg-remover",
					input: { imageUrl: "https://example.com/image.png" },
				}),
			).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});

		it("creates job with priority", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			createToolJobMock.mockResolvedValue({
				...mockJob,
				priority: 5,
			});

			const client = createClient();
			const result = await client({
				toolSlug: "bg-remover",
				input: { imageUrl: "https://example.com/image.png" },
				priority: 5,
			});

			expect(result.job.priority).toBe(5);
		});
	});

	describe("jobs.get", () => {
		const createClient = (headers?: Headers) =>
			createProcedureClient(jobsRouter.get, {
				context: {
					headers: headers ?? new Headers(),
				},
			});

		it("returns job for owner", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(mockJob);

			const client = createClient();
			const result = await client({ jobId: TEST_JOB_ID });

			expect(result).toEqual({ job: mockJob });
		});

		it("throws NOT_FOUND when job does not exist", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(null);

			const client = createClient();

			// Use a valid CUID format for the non-existent job
			await expect(
				client({ jobId: "cln9999999999abcdefghij" }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the job", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: "cldifferentuser1234567" },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(mockJob);

			const client = createClient();

			await expect(client({ jobId: TEST_JOB_ID })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("allows access via sessionId header", async () => {
			getSessionMock.mockResolvedValue(null);
			const sessionJob = {
				...mockJob,
				userId: null,
				sessionId: "anon-session-123",
			};
			getToolJobByIdMock.mockResolvedValue(sessionJob);

			const headers = new Headers();
			headers.set("x-session-id", "anon-session-123");

			const client = createClient(headers);
			const result = await client({ jobId: TEST_JOB_ID });

			expect(result).toEqual({ job: sessionJob });
		});
	});

	describe("jobs.list", () => {
		const createClient = (headers?: Headers) =>
			createProcedureClient(jobsRouter.list, {
				context: {
					headers: headers ?? new Headers(),
				},
			});

		it("lists jobs for authenticated user", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobsByUserIdMock.mockResolvedValue([mockJob]);

			const client = createClient();
			const result = await client({});

			expect(result).toEqual({ jobs: [mockJob] });
			expect(getToolJobsByUserIdMock).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				toolSlug: undefined,
				limit: 20,
				offset: 0,
			});
		});

		it("lists jobs with filters", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobsByUserIdMock.mockResolvedValue([mockJob]);

			const client = createClient();
			await client({ toolSlug: "bg-remover", limit: 10, offset: 5 });

			expect(getToolJobsByUserIdMock).toHaveBeenCalledWith({
				userId: TEST_USER_ID,
				toolSlug: "bg-remover",
				limit: 10,
				offset: 5,
			});
		});

		it("lists jobs for session when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);
			getToolJobsBySessionIdMock.mockResolvedValue([mockJob]);

			const headers = new Headers();
			headers.set("x-session-id", "anon-session-123");

			const client = createClient(headers);
			const result = await client({});

			expect(result).toEqual({ jobs: [mockJob] });
			expect(getToolJobsBySessionIdMock).toHaveBeenCalledWith({
				sessionId: "anon-session-123",
				toolSlug: undefined,
				limit: 20,
				offset: 0,
			});
		});

		it("throws BAD_REQUEST when neither authenticated nor sessionId provided", async () => {
			getSessionMock.mockResolvedValue(null);

			const client = createClient();

			await expect(client({})).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});
	});

	describe("jobs.cancel", () => {
		const createClient = (headers?: Headers) =>
			createProcedureClient(jobsRouter.cancel, {
				context: {
					headers: headers ?? new Headers(),
				},
			});

		it("cancels pending job", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(mockJob);
			cancelToolJobMock.mockResolvedValue({
				...mockJob,
				status: "CANCELLED",
			});

			const client = createClient();
			const result = await client({ jobId: TEST_JOB_ID });

			expect(result.job.status).toBe("CANCELLED");
			expect(cancelToolJobMock).toHaveBeenCalledWith(TEST_JOB_ID);
		});

		it("throws NOT_FOUND when job does not exist", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(null);

			const client = createClient();

			// Use a valid CUID format for the non-existent job
			await expect(
				client({ jobId: "cln9999999999abcdefghij" }),
			).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the job", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: "cldifferentuser1234567" },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue(mockJob);

			const client = createClient();

			await expect(client({ jobId: TEST_JOB_ID })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("throws BAD_REQUEST when job is not pending", async () => {
			getSessionMock.mockResolvedValue({
				user: { id: TEST_USER_ID },
				session: { id: "session-1" },
			});
			getToolJobByIdMock.mockResolvedValue({
				...mockJob,
				status: "PROCESSING",
			});

			const client = createClient();

			await expect(client({ jobId: TEST_JOB_ID })).rejects.toMatchObject({
				code: "BAD_REQUEST",
			});
		});
	});
});
