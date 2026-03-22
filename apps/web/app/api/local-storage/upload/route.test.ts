import { beforeEach, describe, expect, it, vi } from "vitest";
import { OPTIONS, PUT } from "./route";

const verifyTokenMock = vi.hoisted(() => vi.fn());
const writeFileMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	createLocalStorageProvider: () => ({
		verifyToken: verifyTokenMock,
		writeFile: writeFileMock,
	}),
}));

function makeRequest(
	params: Record<string, string>,
	body: ArrayBuffer = new ArrayBuffer(4),
): Request {
	const url = new URL("http://localhost/api/local-storage/upload");
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	return new Request(url, {
		method: "PUT",
		body,
	});
}

describe("PUT /api/local-storage/upload", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NODE_ENV", "test");
	});

	it("returns 403 in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "t",
		});
		const res = await PUT(req);
		expect(res.status).toBe(403);
	});

	it("returns 400 when required params missing", async () => {
		const req = makeRequest({ bucket: "b", key: "k" }); // missing expires, token
		const res = await PUT(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Missing required parameters");
	});

	it("returns 400 for invalid expires", async () => {
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "not-a-number",
			token: "t",
		});
		const res = await PUT(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Invalid expires parameter");
	});

	it("returns 403 for invalid token", async () => {
		verifyTokenMock.mockReturnValue(false);
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "bad",
		});
		const res = await PUT(req);
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.error).toMatch(/Invalid or expired/);
	});

	it("returns 400 for empty body", async () => {
		verifyTokenMock.mockReturnValue(true);
		const req = makeRequest(
			{ bucket: "b", key: "k", expires: "9999999999999", token: "t" },
			new ArrayBuffer(0),
		);
		const res = await PUT(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Empty file body");
	});

	it("returns 200 on successful upload", async () => {
		verifyTokenMock.mockReturnValue(true);
		writeFileMock.mockResolvedValue(undefined);
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "t",
		});
		const res = await PUT(req);
		expect(res.status).toBe(200);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.key).toBe("k");
		expect(body.bucket).toBe("b");
	});

	it("returns 500 when writeFile throws", async () => {
		verifyTokenMock.mockReturnValue(true);
		writeFileMock.mockRejectedValue(new Error("disk error"));
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "t",
		});
		const res = await PUT(req);
		expect(res.status).toBe(500);
		const body = await res.json();
		expect(body.error).toBe("Failed to save file");
	});
});

describe("OPTIONS /api/local-storage/upload", () => {
	it("returns 204 with CORS headers", async () => {
		const res = await OPTIONS();
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain(
			"PUT",
		);
	});
});
