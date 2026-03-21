import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: {
		storage: {
			bucketNames: {
				avatars: "avatars",
			},
		},
	},
}));

const mockGetSignedUrl = vi.fn();
vi.mock("@repo/storage", () => ({
	getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

const mockNextResponseRedirect = vi.fn();
vi.mock("next/server", () => ({
	NextResponse: {
		redirect: (...args: unknown[]) => mockNextResponseRedirect(...args),
	},
}));

describe("image-proxy GET route", () => {
	let GET: (
		req: Request,
		ctx: { params: Promise<{ path: string[] }> },
	) => Promise<Response>;

	beforeEach(async () => {
		vi.spyOn(console, "error").mockImplementation(() => {});
		vi.resetModules();
		({ GET } = await import("./route"));
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	const makeCtx = (path: string[]) => ({
		params: Promise.resolve({ path }),
	});

	it("returns 400 when bucket is missing", async () => {
		const res = await GET(new Request("http://localhost"), makeCtx([]));
		expect(res.status).toBe(400);
	});

	it("returns 400 when file path is missing", async () => {
		const res = await GET(
			new Request("http://localhost"),
			makeCtx(["avatars"]),
		);
		expect(res.status).toBe(400);
	});

	it("returns 404 for non-avatar bucket", async () => {
		const res = await GET(
			new Request("http://localhost"),
			makeCtx(["other-bucket", "some/file.png"]),
		);
		expect(res.status).toBe(404);
	});

	it("redirects with signed URL for avatar bucket", async () => {
		const signedUrl = "https://storage.example.com/signed?token=abc";
		mockGetSignedUrl.mockResolvedValue(signedUrl);
		mockNextResponseRedirect.mockReturnValue(
			new Response(null, { status: 302 }),
		);

		await GET(
			new Request("http://localhost"),
			makeCtx(["avatars", "user123", "avatar.png"]),
		);

		expect(mockGetSignedUrl).toHaveBeenCalledWith("user123/avatar.png", {
			bucket: "avatars",
			expiresIn: 3600,
		});
		expect(mockNextResponseRedirect).toHaveBeenCalledWith(signedUrl, {
			headers: { "Cache-Control": "max-age=3600" },
		});
	});

	it("returns 500 when getSignedUrl throws", async () => {
		mockGetSignedUrl.mockRejectedValue(new Error("storage error"));

		const res = await GET(
			new Request("http://localhost"),
			makeCtx(["avatars", "user123", "avatar.png"]),
		);
		expect(res.status).toBe(500);
	});
});
