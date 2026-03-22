import { createProcedureClient } from "@orpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { gdprRouter } from "./router";

const getSessionMock = vi.hoisted(() => vi.fn());
const getRecentGdprExportJobsMock = vi.hoisted(() => vi.fn());
const getActiveGdprExportJobMock = vi.hoisted(() => vi.fn());
const createToolJobMock = vi.hoisted(() => vi.fn());
const getToolJobByIdMock = vi.hoisted(() => vi.fn());
const getToolJobsByUserIdMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	error: vi.fn(),
	warn: vi.fn(),
}));

vi.mock("@repo/auth", () => ({
	auth: { api: { getSession: getSessionMock } },
}));

vi.mock("@repo/database", () => ({
	getRecentGdprExportJobs: getRecentGdprExportJobsMock,
	getActiveGdprExportJob: getActiveGdprExportJobMock,
	createToolJob: createToolJobMock,
	getToolJobById: getToolJobByIdMock,
	getToolJobsByUserId: getToolJobsByUserIdMock,
}));

vi.mock("@repo/logs", () => ({ logger: loggerMock }));

const USER = { id: "user-1", email: "user@example.com", role: "user" };
const mockSession = {
	user: USER,
	session: { id: "session-1", userId: USER.id },
};

const makeJob = (overrides = {}) => ({
	id: "job-1",
	toolSlug: "gdpr-exporter",
	status: "PENDING",
	userId: USER.id,
	createdAt: new Date("2026-01-01T00:00:00Z"),
	completedAt: null,
	output: null,
	error: null,
	...overrides,
});

beforeEach(() => {
	vi.clearAllMocks();
	getSessionMock.mockResolvedValue(mockSession);
});

describe("gdprRouter.requestExport", () => {
	it("creates and returns a new export job", async () => {
		const job = makeJob();
		getRecentGdprExportJobsMock.mockResolvedValue([]);
		getActiveGdprExportJobMock.mockResolvedValue(null);
		createToolJobMock.mockResolvedValue(job);

		const client = createProcedureClient(gdprRouter.requestExport, {
			context: { user: USER },
		});
		const result = await client({ format: "json" });

		expect(result.job.id).toBe("job-1");
		expect(createToolJobMock).toHaveBeenCalledOnce();
	});

	it("returns existing active job instead of creating new one", async () => {
		const activeJob = makeJob({ status: "PROCESSING" });
		getRecentGdprExportJobsMock.mockResolvedValue([]);
		getActiveGdprExportJobMock.mockResolvedValue(activeJob);

		const client = createProcedureClient(gdprRouter.requestExport, {
			context: { user: USER },
		});
		const result = await client({ format: "json" });

		expect(result.job.id).toBe("job-1");
		expect(createToolJobMock).not.toHaveBeenCalled();
	});

	it("throws TOO_MANY_REQUESTS when rate limit hit", async () => {
		getRecentGdprExportJobsMock.mockResolvedValue([
			makeJob({ createdAt: new Date() }),
		]);

		const client = createProcedureClient(gdprRouter.requestExport, {
			context: { user: USER },
		});
		await expect(client({ format: "json" })).rejects.toMatchObject({
			code: "TOO_MANY_REQUESTS",
		});
	});

	it("throws INTERNAL_SERVER_ERROR when job creation fails", async () => {
		getRecentGdprExportJobsMock.mockResolvedValue([]);
		getActiveGdprExportJobMock.mockResolvedValue(null);
		createToolJobMock.mockResolvedValue(null);

		const client = createProcedureClient(gdprRouter.requestExport, {
			context: { user: USER },
		});
		await expect(client({ format: "json" })).rejects.toMatchObject({
			code: "INTERNAL_SERVER_ERROR",
		});
	});
});

describe("gdprRouter.getExportStatus", () => {
	it("returns status for own job", async () => {
		const job = makeJob({ status: "COMPLETED", completedAt: new Date() });
		getToolJobByIdMock.mockResolvedValue(job);

		const client = createProcedureClient(gdprRouter.getExportStatus, {
			context: { user: USER },
		});
		const result = await client({ jobId: "job-1" });

		expect(result.jobId).toBe("job-1");
		expect(result.status).toBe("COMPLETED");
	});

	it("throws NOT_FOUND when job does not exist", async () => {
		getToolJobByIdMock.mockResolvedValue(null);

		const client = createProcedureClient(gdprRouter.getExportStatus, {
			context: { user: USER },
		});
		await expect(client({ jobId: "missing" })).rejects.toMatchObject({
			code: "NOT_FOUND",
		});
	});

	it("throws FORBIDDEN when job belongs to another user", async () => {
		const job = makeJob({ userId: "other-user" });
		getToolJobByIdMock.mockResolvedValue(job);

		const client = createProcedureClient(gdprRouter.getExportStatus, {
			context: { user: USER },
		});
		await expect(client({ jobId: "job-1" })).rejects.toMatchObject({
			code: "FORBIDDEN",
		});
	});

	it("throws BAD_REQUEST when job is not a GDPR export", async () => {
		const job = makeJob({ toolSlug: "other-tool" });
		getToolJobByIdMock.mockResolvedValue(job);

		const client = createProcedureClient(gdprRouter.getExportStatus, {
			context: { user: USER },
		});
		await expect(client({ jobId: "job-1" })).rejects.toMatchObject({
			code: "BAD_REQUEST",
		});
	});
});

describe("gdprRouter.listExports", () => {
	it("returns paginated export history", async () => {
		const jobs = [makeJob(), makeJob({ id: "job-2" })];
		getToolJobsByUserIdMock.mockResolvedValue(jobs);

		const client = createProcedureClient(gdprRouter.listExports, {
			context: { user: USER },
		});
		const result = await client({ limit: 10, offset: 0 });

		expect(result.exports).toHaveLength(2);
		expect(result.pagination.limit).toBe(10);
	});

	it("returns empty list when user has no exports", async () => {
		getToolJobsByUserIdMock.mockResolvedValue([]);

		const client = createProcedureClient(gdprRouter.listExports, {
			context: { user: USER },
		});
		const result = await client({ limit: 10, offset: 0 });

		expect(result.exports).toHaveLength(0);
		expect(result.pagination.hasMore).toBe(false);
	});
});
