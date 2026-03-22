import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, OPTIONS } from "./route";

const verifyTokenMock = vi.hoisted(() => vi.fn());
const readFileMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	createLocalStorageProvider: () => ({
		verifyToken: verifyTokenMock,
		readFile: readFileMock,
	}),
}));

function makeRequest(params: Record<string, string>): Request {
	const url = new URL("http://localhost/api/local-storage/download");
	for (const [k, v] of Object.entries(params)) {
		url.searchParams.set(k, v);
	}
	return new Request(url);
}

describe("GET /api/local-storage/download", () => {
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
		const res = await GET(req);
		expect(res.status).toBe(403);
	});

	it("returns 400 when required params missing", async () => {
		const req = makeRequest({ bucket: "b", key: "k" });
		const res = await GET(req);
		expect(res.status).toBe(400);
		const body = await res.json();
		expect(body.error).toBe("Missing required parameters");
	});

	it("returns 400 for invalid expires", async () => {
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "bad",
			token: "t",
		});
		const res = await GET(req);
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
		const res = await GET(req);
		expect(res.status).toBe(403);
		const body = await res.json();
		expect(body.error).toMatch(/Invalid or expired/);
	});

	it("returns file content on success", async () => {
		verifyTokenMock.mockReturnValue(true);
		readFileMock.mockResolvedValue({
			data: Buffer.from("hello"),
			contentType: "text/plain",
		});
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "t",
		});
		const res = await GET(req);
		expect(res.status).toBe(200);
		expect(res.headers.get("Content-Type")).toBe("text/plain");
		const text = await res.text();
		expect(text).toBe("hello");
	});

	it("returns 404 when readFile throws", async () => {
		verifyTokenMock.mockReturnValue(true);
		readFileMock.mockRejectedValue(new Error("not found"));
		const req = makeRequest({
			bucket: "b",
			key: "k",
			expires: "9999999999999",
			token: "t",
		});
		const res = await GET(req);
		expect(res.status).toBe(404);
		const body = await res.json();
		expect(body.error).toBe("File not found");
	});
});

describe("OPTIONS /api/local-storage/download", () => {
	it("returns 204 with CORS headers", async () => {
		const res = await OPTIONS();
		expect(res.status).toBe(204);
		expect(res.headers.get("Access-Control-Allow-Methods")).toContain(
			"GET",
		);
	});
});
