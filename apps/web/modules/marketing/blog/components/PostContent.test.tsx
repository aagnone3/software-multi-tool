import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PostContent } from "./PostContent";

vi.mock("@content-collections/mdx/react", () => ({
	MDXContent: ({
		code,
		components: _components,
	}: {
		code: string;
		components: unknown;
	}) => <div data-testid="mdx-content" data-code={code} />,
}));

vi.mock("../utils/mdx-components", () => ({
	mdxComponents: {
		a: ({
			href,
			children,
		}: {
			href: string;
			children: React.ReactNode;
		}) => <a href={href}>{children}</a>,
		MidPostCTA: () => <div data-testid="mid-post-cta" />,
	},
}));

describe("PostContent", () => {
	it("renders the MDX content", () => {
		render(<PostContent content="test-code" />);
		expect(screen.getByTestId("mdx-content")).toBeInTheDocument();
	});

	it("passes the code prop to MDXContent", () => {
		render(<PostContent content="my-mdx-code" />);
		const el = screen.getByTestId("mdx-content");
		expect(el).toHaveAttribute("data-code", "my-mdx-code");
	});

	it("renders inside a prose container", () => {
		const { container } = render(<PostContent content="test" />);
		const prose = container.querySelector(".prose");
		expect(prose).not.toBeNull();
	});
});
