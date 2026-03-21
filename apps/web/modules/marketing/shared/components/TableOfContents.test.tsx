import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TableOfContents } from "./TableOfContents";

const items = [
	{ slug: "intro", content: "Introduction", lvl: 1 },
	{ slug: "usage", content: "Usage", lvl: 2 },
	{ slug: "advanced", content: "Advanced", lvl: 3 },
];

describe("TableOfContents", () => {
	beforeEach(() => {
		vi.stubGlobal("scrollTo", vi.fn());
		Object.defineProperty(window, "scrollY", { value: 0, writable: true });
		Object.defineProperty(window, "location", {
			value: { hash: "" },
			writable: true,
		});
	});

	it("renders the On this page heading", () => {
		render(<TableOfContents items={items} />);
		expect(screen.getByText("On this page")).toBeInTheDocument();
	});

	it("renders all items as links", () => {
		render(<TableOfContents items={items} />);
		expect(
			screen.getByRole("link", { name: "Introduction" }),
		).toHaveAttribute("href", "#intro");
		expect(screen.getByRole("link", { name: "Usage" })).toHaveAttribute(
			"href",
			"#usage",
		);
		expect(screen.getByRole("link", { name: "Advanced" })).toHaveAttribute(
			"href",
			"#advanced",
		);
	});

	it("renders empty items list without crashing", () => {
		render(<TableOfContents items={[]} />);
		expect(screen.getByText("On this page")).toBeInTheDocument();
	});
});
