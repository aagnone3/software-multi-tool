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
const mockLoggerInfo = vi.hoisted(() => vi.fn());
const mockLoggerDebug = vi.hoisted(() => vi.fn());
const mockLoggerError = vi.hoisted(() => vi.fn());

const mockLoggerWarn = vi.hoisted(() => vi.fn());

vi.mock("@repo/logs", () => ({
	logger: {
		info: mockLoggerInfo,
		debug: mockLoggerDebug,
		error: mockLoggerError,
		warn: mockLoggerWarn,
	},
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

const deleteToolJobMock = vi.hoisted(() => vi.fn());
const deleteAudioFromStorageMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/database", () => ({
	createToolJob: createToolJobMock,
	getToolJobById: getToolJobByIdMock,
	getToolJobsByUserId: getToolJobsByUserIdMock,
	getToolJobsBySessionId: getToolJobsBySessionIdMock,
	cancelToolJob: cancelToolJobMock,
	deleteToolJob: deleteToolJobMock,
}));

vi.mock("../speaker-separation/lib/audio-storage", () => ({
	deleteAudioFromStorage: deleteAudioFromStorageMock,
}));

describe("Jobs Router", () => {
	// Use valid CUID format for test IDs
	const TEST_JOB_ID = "clz1234567890abcdefghij";
	const TEST_USER_ID = "clu1234567890abcdefghij";
	const TEST_SESSION_ID = "sess_test_12345";

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

		it("throws BAD_REQUEST when job is not cancellable", async () => {
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

	describe("jobs.delete", () => {
		let client: ReturnType<typeof createProcedureClient>;

		beforeEach(() => {
			client = createProcedureClient(jobsRouter.delete, {
				context: {
					headers: new Headers({ "x-session-id": TEST_SESSION_ID }),
				},
			});
			deleteToolJobMock.mockResolvedValue(undefined);
			deleteAudioFromStorageMock.mockResolvedValue(undefined);
		});

		it("deletes job for authenticated owner", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				id: TEST_JOB_ID,
				userId: TEST_USER_ID,
				sessionId: null,
				audioFileUrl: null,
			});

			const result = await client({ jobId: TEST_JOB_ID });
			expect(result).toEqual({ success: true });
			expect(deleteToolJobMock).toHaveBeenCalledWith(TEST_JOB_ID);
		});

		it("deletes job for session owner when not authenticated", async () => {
			getSessionMock.mockResolvedValue(null);
			getToolJobByIdMock.mockResolvedValue({
				id: TEST_JOB_ID,
				userId: null,
				sessionId: TEST_SESSION_ID,
				audioFileUrl: null,
			});

			const result = await client({ jobId: TEST_JOB_ID });
			expect(result).toEqual({ success: true });
		});

		it("throws NOT_FOUND when job does not exist", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue(null);

			await expect(client({ jobId: TEST_JOB_ID })).rejects.toMatchObject({
				code: "NOT_FOUND",
			});
		});

		it("throws FORBIDDEN when user does not own the job", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				id: TEST_JOB_ID,
				userId: "other-user-id",
				sessionId: "other-session-id",
				audioFileUrl: null,
			});

			await expect(client({ jobId: TEST_JOB_ID })).rejects.toMatchObject({
				code: "FORBIDDEN",
			});
		});

		it("deletes audio from storage when audioFileUrl is present", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				id: TEST_JOB_ID,
				userId: TEST_USER_ID,
				sessionId: null,
				audioFileUrl: "https://storage.example.com/audio/file.mp3",
			});

			await client({ jobId: TEST_JOB_ID });
			expect(deleteAudioFromStorageMock).toHaveBeenCalledWith(
				"https://storage.example.com/audio/file.mp3",
			);
		});

		it("still deletes job even if audio storage deletion fails", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				id: TEST_JOB_ID,
				userId: TEST_USER_ID,
				sessionId: null,
				audioFileUrl: "https://storage.example.com/audio/file.mp3",
			});
			deleteAudioFromStorageMock.mockRejectedValue(
				new Error("storage error"),
			);

			const result = await client({ jobId: TEST_JOB_ID });
			expect(result).toEqual({ success: true });
			expect(deleteToolJobMock).toHaveBeenCalledWith(TEST_JOB_ID);
		});
	});

	describe("jobs.stream", () => {
		// Helper to call stream handler directly (createProcedureClient doesn't support generators)
		async function collectStreamEvents(
			headers: Headers,
			jobId: string,
			signal?: AbortSignal,
		) {
			const { streamJob } = await import("./procedures/stream-job");
			const handler =
				(streamJob as any)["~orpc"]?.handler ??
				(streamJob as any).handler;
			if (!handler) {
				throw new Error("Cannot find stream handler");
			}
			const gen = handler({
				input: { jobId },
				context: { headers },
				signal,
			});
			const events: unknown[] = [];
			for await (const event of gen) {
				events.push(event);
			}
			return events;
		}

		it("throws NOT_FOUND when job does not exist", async () => {
			getToolJobByIdMock.mockResolvedValue(null);
			await expect(
				collectStreamEvents(new Headers(), TEST_JOB_ID),
			).rejects.toMatchObject({ code: "NOT_FOUND" });
		});

		it("throws FORBIDDEN when user does not own the job", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				...mockJob,
				userId: "different-user",
				sessionId: null,
			});
			await expect(
				collectStreamEvents(new Headers(), TEST_JOB_ID),
			).rejects.toMatchObject({ code: "FORBIDDEN" });
		});

		it("streams update and closes on terminal status for session owner", async () => {
			const sessionJob = {
				...mockJob,
				userId: null,
				sessionId: TEST_SESSION_ID,
				status: "COMPLETED",
			};
			getToolJobByIdMock.mockResolvedValue(sessionJob);
			const headers = new Headers({ "x-session-id": TEST_SESSION_ID });
			const events = await collectStreamEvents(headers, TEST_JOB_ID);
			expect(events.length).toBeGreaterThanOrEqual(1);
			expect((events[0] as { type: string }).type).toBe("update");
		});

		it("streams update for authenticated user owning the job", async () => {
			getSessionMock.mockResolvedValue({ user: { id: TEST_USER_ID } });
			getToolJobByIdMock.mockResolvedValue({
				...mockJob,
				status: "COMPLETED",
			});
			const events = await collectStreamEvents(
				new Headers(),
				TEST_JOB_ID,
			);
			expect(events[0]).toMatchObject({ type: "update" });
		});
	});
});
