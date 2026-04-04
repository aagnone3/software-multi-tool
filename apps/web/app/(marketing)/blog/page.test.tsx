import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@marketing/blog/components/BlogStickyCta", () => ({
	BlogStickyCta: () => <div data-testid="blog-sticky-cta" />,
}));

vi.mock("@marketing/blog/utils/lib/posts", () => ({
	getAllPosts: vi.fn().mockResolvedValue([
		{
			path: "post-1",
			title: "Post One",
			published: true,
			locale: "en",
			date: "2026-01-01",
		},
		{
			path: "post-2",
			title: "Post Two",
			published: false,
			locale: "en",
			date: "2026-01-02",
		},
		{
			path: "post-3",
			title: "Post Three",
			published: true,
			locale: "fr",
			date: "2026-01-03",
		},
	]),
}));

vi.mock("@marketing/blog/components/PostListItem", () => ({
	PostListItem: ({ post }: { post: { title: string } }) => (
		<article data-testid="post-list-item">{post.title}</article>
	),
}));

vi.mock("@repo/utils", () => ({
	getBaseUrl: vi.fn().mockReturnValue("https://softwaremultitool.com"),
}));

vi.mock("@repo/config", () => ({
	config: {
		appName: "TestApp",
		ui: { blog: { enabled: true } },
	},
}));

const mockNotFound = vi.fn();
vi.mock("next/navigation", () => ({
	notFound: mockNotFound,
}));

describe("BlogListPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders blog heading", async () => {
		const { default: BlogListPage } = await import("./page");
		render(await BlogListPage());
		expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
			"TestApp Blog",
		);
	});

	it("only renders published english posts", async () => {
		const { default: BlogListPage } = await import("./page");
		render(await BlogListPage());
		const items = screen.getAllByTestId("post-list-item");
		// only 1 published english post
		expect(items).toHaveLength(1);
		expect(items[0]).toHaveTextContent("Post One");
	});

	it("renders RSS feed link", async () => {
		const { default: BlogListPage } = await import("./page");
		render(await BlogListPage());
		// link has aria-label "Subscribe via RSS" and visible text "RSS Feed"
		const rssLink = screen.getByRole("link", { name: /rss/i });
		expect(rssLink).toHaveAttribute("href", "/feed.xml");
	});

	it("calls notFound when blog is disabled", async () => {
		const { config } = await import("@repo/config");
		(config.ui.blog as { enabled: boolean }).enabled = false;
		const { default: BlogListPage } = await import("./page");
		await BlogListPage();
		expect(mockNotFound).toHaveBeenCalled();
		// restore
		(config.ui.blog as { enabled: boolean }).enabled = true;
	});

	it("metadata export contains correct title", async () => {
		const { metadata } = await import("./page");
		expect(metadata.title).toContain("Blog");
		expect(metadata.title).toContain("TestApp");
	});
});
