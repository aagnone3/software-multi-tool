import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ContentMenu } from "./ContentMenu";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

describe("ContentMenu", () => {
	const items = [
		{
			label: "Getting Started",
			path: "getting-started",
			isPage: true,
			children: [],
		},
		{
			label: "Guides",
			path: "guides",
			isPage: false,
			children: [
				{
					label: "Setup",
					path: "guides/setup",
					isPage: true,
					children: [],
				},
			],
		},
	];

	it("renders page items as links", () => {
		render(<ContentMenu items={items} activePath="getting-started" />);
		const link = screen.getByRole("link", { name: "Getting Started" });
		expect(link).toHaveAttribute("href", "/docs/getting-started");
	});

	it("renders non-page items as spans", () => {
		render(<ContentMenu items={items} activePath="" />);
		const span = screen.getByText("Guides");
		expect(span.tagName).toBe("SPAN");
	});

	it("highlights the active path", () => {
		render(<ContentMenu items={items} activePath="getting-started" />);
		const link = screen.getByRole("link", { name: "Getting Started" });
		expect(link.className).toContain("font-bold");
	});

	it("renders nested children", () => {
		render(<ContentMenu items={items} activePath="" />);
		const childLink = screen.getByRole("link", { name: "Setup" });
		expect(childLink).toHaveAttribute("href", "/docs/guides/setup");
	});

	it("non-active links do not have font-bold", () => {
		render(<ContentMenu items={items} activePath="guides/setup" />);
		const link = screen.getByRole("link", { name: "Getting Started" });
		expect(link.className).not.toContain("font-bold");
	});
});
