import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/utils", () => ({
	getBaseUrl: () => "https://example.com",
}));

const mockPosts = [
	{
		path: "hello-world",
		locale: "en",
		title: "Hello World",
		excerpt: "A post",
	},
	{ path: "hello-world", locale: "fr", title: "Bonjour Monde", excerpt: "" },
	{
		path: "another-post",
		locale: "en",
		title: "Another Post",
		excerpt: "Another",
	},
	{
		path: "has-image",
		locale: "en",
		title: "Has Image",
		image: "/images/custom.png",
		excerpt: "With image",
	},
];

vi.mock("content-collections", () => ({
	allPosts: mockPosts,
}));

describe("getAllPosts", () => {
	it("returns all posts with OG image fallback for posts without image", async () => {
		const { getAllPosts } = await import("./posts");
		const posts = await getAllPosts();
		expect(posts).toHaveLength(4);
	});

	it("injects OG image URL for posts without an explicit image", async () => {
		const { getAllPosts } = await import("./posts");
		const posts = await getAllPosts();
		const post = posts.find((p) => p.path === "another-post");
		expect(post?.image).toMatch(/^https:\/\/example\.com\/api\/og\?/);
		expect(post?.image).toContain("title=Another+Post");
	});

	it("preserves explicit image when already set", async () => {
		const { getAllPosts } = await import("./posts");
		const posts = await getAllPosts();
		const post = posts.find((p) => p.path === "has-image");
		expect(post?.image).toBe("/images/custom.png");
	});
});

describe("getPostBySlug", () => {
	it("returns the post matching the slug with OG fallback", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("another-post");
		expect(post?.path).toBe("another-post");
		expect(post?.image).toMatch(/\/api\/og\?/);
	});

	it("returns null when slug does not match", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("non-existent");
		expect(post).toBeNull();
	});

	it("returns the post matching slug and locale", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world", { locale: "fr" });
		expect(post?.locale).toBe("fr");
	});

	it("returns the first match when locale is not specified", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world");
		expect(post?.locale).toBe("en");
	});

	it("returns null when slug matches but locale does not", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world", { locale: "de" });
		expect(post).toBeNull();
	});

	it("preserves explicit image when slug matches post with custom image", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("has-image");
		expect(post?.image).toBe("/images/custom.png");
	});
});
