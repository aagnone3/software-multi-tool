import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "./route";

const deleteExpiredAuditLogsMock = vi.hoisted(() => vi.fn());
const loggerMock = vi.hoisted(() => ({
	info: vi.fn(),
	error: vi.fn(),
}));

vi.mock("@repo/database", () => ({
	deleteExpiredAuditLogs: deleteExpiredAuditLogsMock,
}));

vi.mock("@repo/logs", () => ({
	logger: loggerMock,
}));

function makeRequest(authHeader?: string): Request {
	const headers = new Headers();
	if (authHeader) {
		headers.set("authorization", authHeader);
	}
	return new Request("http://localhost/api/cron/audit-log-cleanup", {
		headers,
	});
}

describe("GET /api/cron/audit-log-cleanup", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.unstubAllEnvs();
		deleteExpiredAuditLogsMock.mockResolvedValue(0);
	});

	it("returns success with deleted count", async () => {
		deleteExpiredAuditLogsMock.mockResolvedValue(12);
		const response = await GET(makeRequest());
		const json = await response.json();
		expect(response.status).toBe(200);
		expect(json.success).toBe(true);
		expect(json.deletedCount).toBe(12);
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

	it("returns 500 on error", async () => {
		deleteExpiredAuditLogsMock.mockRejectedValue(new Error("db error"));
		const response = await GET(makeRequest());
		expect(response.status).toBe(500);
		const json = await response.json();
		expect(json.message).toBe("db error");
	});
});
