import { describe, expect, it, vi } from "vitest";

const mockPosts = [
	{ path: "hello-world", locale: "en", title: "Hello World" },
	{ path: "hello-world", locale: "fr", title: "Bonjour Monde" },
	{ path: "another-post", locale: "en", title: "Another Post" },
];

vi.mock("content-collections", () => ({
	allPosts: mockPosts,
}));

describe("getAllPosts", () => {
	it("returns all posts", async () => {
		const { getAllPosts } = await import("./posts");
		const posts = await getAllPosts();
		expect(posts).toEqual(mockPosts);
	});
});

describe("getPostBySlug", () => {
	it("returns the post matching the slug", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("another-post");
		expect(post).toEqual({
			path: "another-post",
			locale: "en",
			title: "Another Post",
		});
	});

	it("returns null when slug does not match", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("non-existent");
		expect(post).toBeNull();
	});

	it("returns the post matching slug and locale", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world", { locale: "fr" });
		expect(post).toEqual({
			path: "hello-world",
			locale: "fr",
			title: "Bonjour Monde",
		});
	});

	it("returns the first match when locale is not specified", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world");
		expect(post).toEqual({
			path: "hello-world",
			locale: "en",
			title: "Hello World",
		});
	});

	it("returns null when slug matches but locale does not", async () => {
		const { getPostBySlug } = await import("./posts");
		const post = await getPostBySlug("hello-world", { locale: "de" });
		expect(post).toBeNull();
	});
});
