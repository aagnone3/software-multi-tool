import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const handleStuckJobsMock = vi.hoisted(() => vi.fn());
const runCleanupMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	warn: vi.fn(),
	error: vi.fn(),
}));

vi.mock("@repo/api/modules/jobs/lib/job-runner", () => ({
	handleStuckJobs: handleStuckJobsMock,
	runCleanup: runCleanupMock,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

function makeRequest(authHeader?: string): Request {
	const headers = new Headers();
	if (authHeader) {
		headers.set("authorization", authHeader);
	}
	return new Request("http://localhost/api/cron/job-maintenance", {
		headers,
	});
}

describe("GET /api/cron/job-maintenance", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		handleStuckJobsMock.mockResolvedValue({ count: 0 });
		runCleanupMock.mockResolvedValue({ deleted: 0 });
	});

	it("returns success with zero counts when nothing to do", async () => {
		const response = await GET(makeRequest());
		const json = await response.json();
		expect(response.status).toBe(200);
		expect(json.success).toBe(true);
		expect(json.stuckJobsMarkedFailed).toBe(0);
		expect(json.expiredJobsDeleted).toBe(0);
	});

	it("returns counts from handleStuckJobs and runCleanup", async () => {
		handleStuckJobsMock.mockResolvedValue({ count: 3 });
		runCleanupMock.mockResolvedValue({ deleted: 7 });
		const response = await GET(makeRequest());
		const json = await response.json();
		expect(json.stuckJobsMarkedFailed).toBe(3);
		expect(json.expiredJobsDeleted).toBe(7);
	});

	it("returns 401 when CRON_SECRET is set and auth header is missing", async () => {
		vi.stubEnv("CRON_SECRET", "secret123");
		const response = await GET(makeRequest());
		expect(response.status).toBe(401);
	});

	it("returns 401 when CRON_SECRET is set and auth header is wrong", async () => {
		vi.stubEnv("CRON_SECRET", "secret123");
		const response = await GET(makeRequest("Bearer wrong"));
		expect(response.status).toBe(401);
	});

	it("succeeds when CRON_SECRET matches", async () => {
		vi.stubEnv("CRON_SECRET", "secret123");
		const response = await GET(makeRequest("Bearer secret123"));
		expect(response.status).toBe(200);
	});

	it("returns 500 when an error is thrown", async () => {
		handleStuckJobsMock.mockRejectedValue(new Error("db error"));
		const response = await GET(makeRequest());
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.message).toBe("db error");
	});
});
