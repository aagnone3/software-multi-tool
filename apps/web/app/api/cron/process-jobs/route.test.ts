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
	return new Request("http://localhost/api/cron/process-jobs", { headers });
}

describe("GET /api/cron/process-jobs (deprecated)", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		handleStuckJobsMock.mockResolvedValue({ count: 0 });
		runCleanupMock.mockResolvedValue({ deleted: 0 });
	});

	it("returns success with deprecated flag", async () => {
		const response = await GET(makeRequest());
		const json = await response.json();
		expect(response.status).toBe(200);
		expect(json.success).toBe(true);
		expect(json.deprecated).toBe(true);
	});

	it("returns 401 when CRON_SECRET is set and auth header is wrong", async () => {
		vi.stubEnv("CRON_SECRET", "secret123");
		const response = await GET(makeRequest("Bearer wrong"));
		expect(response.status).toBe(401);
	});

	it("returns 500 on error", async () => {
		handleStuckJobsMock.mockRejectedValue(new Error("fail"));
		const response = await GET(makeRequest());
		expect(response.status).toBe(500);
	});
});
