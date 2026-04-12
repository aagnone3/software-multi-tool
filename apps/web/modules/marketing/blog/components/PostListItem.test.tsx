import type { Post } from "@marketing/blog/types";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PostListItem } from "./PostListItem";

vi.mock("next/image", () => ({
	default: ({ src, alt }: { src: string; alt: string }) => (
		<img src={src} alt={alt} />
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

const basePost = {
	title: "Test Post Title",
	excerpt: "This is an excerpt",
	authorName: "Jane Doe",
	date: "2024-01-15",
	path: "test-post-slug",
	tags: ["typescript", "react"],
	published: true,
	content: "",
	body: "",
	locale: "en",
} as Post;

describe("PostListItem", () => {
	it("renders the post title", () => {
		render(<PostListItem post={basePost} />);
		expect(screen.getByText("Test Post Title")).toBeDefined();
	});

	it("renders the excerpt", () => {
		render(<PostListItem post={basePost} />);
		expect(screen.getByText("This is an excerpt")).toBeDefined();
	});

	it("renders tags", () => {
		render(<PostListItem post={basePost} />);
		expect(screen.getByText("#typescript")).toBeDefined();
		expect(screen.getByText("#react")).toBeDefined();
	});

	it("renders author name", () => {
		render(<PostListItem post={basePost} />);
		expect(screen.getByText("Jane Doe")).toBeDefined();
	});

	it("renders blog link with correct path", () => {
		render(<PostListItem post={basePost} />);
		const links = screen.getAllByRole("link");
		const blogLinks = links.filter(
			(l) => l.getAttribute("href") === "/blog/test-post-slug",
		);
		expect(blogLinks.length).toBeGreaterThan(0);
	});

	it("renders author image when provided", () => {
		const post = { ...basePost, authorImage: "/images/author.jpg" };
		render(<PostListItem post={post} />);
		expect(screen.getByAltText("Jane Doe")).toBeDefined();
	});

	it("renders post image when provided", () => {
		const post = { ...basePost, image: "/images/post.jpg" };
		render(<PostListItem post={post} />);
		expect(screen.getByAltText("Test Post Title")).toBeDefined();
	});

	it("renders without optional fields", () => {
		const post = {
			title: "Minimal Post",
			date: "2024-01-01",
			path: "minimal-post",
			authorName: "Author",
			tags: [],
			published: true,
			content: "",
			body: "",
			locale: "en",
		} as Post;
		render(<PostListItem post={post} />);
		expect(screen.getByText("Minimal Post")).toBeDefined();
	});
});
