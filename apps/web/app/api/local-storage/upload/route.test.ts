import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyTokenMock = vi.hoisted(() => vi.fn());
const writeFileMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/storage", () => ({
	createLocalStorageProvider: () => ({
		verifyToken: verifyTokenMock,
		writeFile: writeFileMock,
	}),
}));

describe("local-storage upload route", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.stubEnv("NODE_ENV", "test");
	});

	async function callRoute(url: string, body?: BodyInit) {
		const { PUT } = await import("./route");
		return PUT(new Request(url, { method: "PUT", body: body ?? "data" }));
	}

	it("returns 403 in production", async () => {
		vi.stubEnv("NODE_ENV", "production");
		vi.resetModules();
		const { PUT } = await import("./route");
		const res = await PUT(
			new Request("http://localhost/api/local-storage/upload"),
		);
		expect(res.status).toBe(403);
	});

	it("returns 400 when required params missing", async () => {
		vi.resetModules();
		const res = await callRoute(
			"http://localhost/api/local-storage/upload",
		);
		expect(res.status).toBe(400);
	});

	it("returns 400 for invalid expires param", async () => {
		vi.resetModules();
		const res = await callRoute(
			"http://localhost/api/local-storage/upload?bucket=b&key=k&expires=notanumber&token=t",
		);
		expect(res.status).toBe(400);
	});

	it("returns 403 for invalid token", async () => {
		verifyTokenMock.mockReturnValue(false);
		vi.resetModules();
		const { PUT } = await import("./route");
		const future = Date.now() + 10000;
		const res = await PUT(
			new Request(
				`http://localhost/api/local-storage/upload?bucket=b&key=k&expires=${future}&token=bad`,
				{ method: "PUT", body: "data" },
			),
		);
		expect(res.status).toBe(403);
	});

	it("returns 403 for expired token (verifyToken returns false)", async () => {
		verifyTokenMock.mockReturnValue(false);
		vi.resetModules();
		const { PUT } = await import("./route");
		const past = Date.now() - 10000;
		const res = await PUT(
			new Request(
				`http://localhost/api/local-storage/upload?bucket=b&key=k&expires=${past}&token=expired`,
				{ method: "PUT", body: "data" },
			),
		);
		expect(res.status).toBe(403);
	});

	it("returns 400 for empty body", async () => {
		verifyTokenMock.mockReturnValue(true);
		vi.resetModules();
		const { PUT } = await import("./route");
		const future = Date.now() + 10000;
		const res = await PUT(
			new Request(
				`http://localhost/api/local-storage/upload?bucket=b&key=k&expires=${future}&token=t`,
				{ method: "PUT", body: "" },
			),
		);
		expect(res.status).toBe(400);
	});

	it("returns 200 on successful upload", async () => {
		verifyTokenMock.mockReturnValue(true);
		writeFileMock.mockResolvedValue(undefined);
		vi.resetModules();
		const { PUT } = await import("./route");
		const future = Date.now() + 10000;
		const res = await PUT(
			new Request(
				`http://localhost/api/local-storage/upload?bucket=b&key=k&expires=${future}&token=t`,
				{ method: "PUT", body: "data" },
			),
		);
		expect(res.status).toBe(200);
	});

	it("returns 500 on write failure", async () => {
		verifyTokenMock.mockReturnValue(true);
		writeFileMock.mockRejectedValue(new Error("disk full"));
		vi.resetModules();
		const { PUT } = await import("./route");
		const future = Date.now() + 10000;
		const res = await PUT(
			new Request(
				`http://localhost/api/local-storage/upload?bucket=b&key=k&expires=${future}&token=t`,
				{ method: "PUT", body: "data" },
			),
		);
		expect(res.status).toBe(500);
	});
});
