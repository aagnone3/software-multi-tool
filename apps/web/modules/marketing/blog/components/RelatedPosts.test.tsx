import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { RelatedPosts } from "./RelatedPosts";

const basePost = {
	content: "",
	body: "",
	authorName: "Test Author",
	locale: "en",
};

const mockPosts = vi.hoisted(() => {
	const base = {
		content: "",
		body: "",
		authorName: "Test Author",
		locale: "en",
	};
	return [
		{
			...base,
			path: "post-a",
			title: "Post A",
			excerpt: "Excerpt A",
			published: true,
			date: "2026-01-01",
			tags: ["ai", "productivity"],
		},
		{
			...base,
			path: "post-b",
			title: "Post B",
			excerpt: "Excerpt B",
			published: true,
			date: "2026-01-02",
			tags: ["ai"],
		},
		{
			...base,
			path: "current-post",
			title: "Current Post",
			excerpt: "Current",
			published: true,
			date: "2026-01-03",
			tags: ["ai"],
		},
	];
});

vi.mock("@marketing/blog/utils/lib/posts", () => ({
	getAllPosts: vi.fn().mockResolvedValue(mockPosts),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...rest
	}: {
		href: string;
		children: React.ReactNode;
	}) => (
		<a href={href} {...rest}>
			{children}
		</a>
	),
}));

describe("RelatedPosts", () => {
	it("renders related articles heading", async () => {
		const component = await RelatedPosts({
			currentSlug: "current-post",
			tags: ["ai"],
		});
		render(component as React.ReactElement);
		expect(screen.getByText("Related Articles")).toBeInTheDocument();
	});

	it("excludes the current post from related posts", async () => {
		const component = await RelatedPosts({
			currentSlug: "current-post",
			tags: ["ai"],
		});
		render(component as React.ReactElement);
		expect(screen.queryByText("Current Post")).not.toBeInTheDocument();
	});

	it("renders posts with matching tags", async () => {
		const component = await RelatedPosts({
			currentSlug: "current-post",
			tags: ["ai"],
		});
		render(component as React.ReactElement);
		expect(screen.getByText("Post A")).toBeInTheDocument();
		expect(screen.getByText("Post B")).toBeInTheDocument();
	});

	it("returns null when no related posts exist", async () => {
		// Override with a single post matching currentSlug so no related posts remain
		vi.mocked(
			(await import("@marketing/blog/utils/lib/posts")).getAllPosts,
		).mockResolvedValueOnce([
			{
				...basePost,
				path: "only-post",
				title: "Only",
				published: true,
				date: "2026-01-01",
				tags: [],
			},
		]);
		const result = await RelatedPosts({
			currentSlug: "only-post",
			tags: [],
		});
		expect(result).toBeNull();
	});

	it("respects the limit prop", async () => {
		const component = await RelatedPosts({
			currentSlug: "current-post",
			tags: ["ai"],
			limit: 1,
		});
		render(component as React.ReactElement);
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(1);
	});
});
