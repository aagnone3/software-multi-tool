import { describe, expect, it, vi } from "vitest";

vi.mock("@marketing/blog/utils/lib/posts", () => ({
	getAllPosts: vi.fn().mockResolvedValue([
		{
			title: "Test Post",
			path: "test-post",
			locale: "en",
			date: "2026-01-01",
			published: true,
			excerpt: "A test excerpt",
		},
		{
			title: "Another Post",
			path: "another-post",
			locale: "en",
			date: "2026-01-15",
			published: true,
			excerpt: "Another excerpt",
		},
		{
			title: "French Post",
			path: "french-post",
			locale: "fr",
			date: "2026-01-10",
			published: true,
			excerpt: "Une description",
		},
		{
			title: "Draft Post",
			path: "draft-post",
			locale: "en",
			date: "2026-01-20",
			published: false,
			excerpt: "A draft",
		},
	]),
}));

vi.mock("@repo/config", () => ({
	config: {
		appName: "Test App",
		appDescription: "Test description",
		ui: { blog: { enabled: true } },
	},
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
}));

describe("GET /feed.xml", () => {
	it("returns an RSS feed with the correct content-type", async () => {
		const { GET } = await import("./route");
		const response = await GET();
		expect(response.headers.get("Content-Type")).toContain(
			"application/xml",
		);
	});

	it("includes English posts sorted by date descending", async () => {
		const { GET } = await import("./route");
		const response = await GET();
		const text = await response.text();
		expect(text).toContain("Another Post");
		expect(text).toContain("Test Post");
		// Another Post (Jan 15) should appear before Test Post (Jan 1)
		const anotherIdx = text.indexOf("Another Post");
		const testIdx = text.indexOf("Test Post");
		expect(anotherIdx).toBeLessThan(testIdx);
	});

	it("excludes non-English posts", async () => {
		const { GET } = await import("./route");
		const response = await GET();
		const text = await response.text();
		expect(text).not.toContain("French Post");
	});

	it("excludes unpublished posts", async () => {
		const { GET } = await import("./route");
		const response = await GET();
		const text = await response.text();
		expect(text).not.toContain("Draft Post");
	});

	it("contains valid RSS structure", async () => {
		const { GET } = await import("./route");
		const response = await GET();
		const text = await response.text();
		expect(text).toContain('<?xml version="1.0"');
		expect(text).toContain("<rss");
		expect(text).toContain("<channel>");
		expect(text).toContain("<item>");
		expect(text).toContain("</channel>");
		expect(text).toContain("</rss>");
	});

	it("escapes XML special characters in titles and excerpts", async () => {
		const { getAllPosts } = await import("@marketing/blog/utils/lib/posts");
		vi.mocked(getAllPosts).mockResolvedValueOnce([
			{
				title: 'Post with "quotes" & <tags>',
				path: "special-post",
				locale: "en",
				date: "2026-01-01",
				published: true,
				excerpt: "Excerpt & more",
			} as any,
		]);
		const { GET } = await import("./route");
		const response = await GET();
		const text = await response.text();
		expect(text).toContain(
			"Post with &quot;quotes&quot; &amp; &lt;tags&gt;",
		);
		expect(text).toContain("Excerpt &amp; more");
	});
});
