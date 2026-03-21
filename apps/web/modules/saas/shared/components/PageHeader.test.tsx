import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
	it("renders title", () => {
		render(<PageHeader title="My Page" />);
		expect(screen.getByText("My Page")).toBeInTheDocument();
	});

	it("renders subtitle when provided", () => {
		render(<PageHeader title="My Page" subtitle="A description" />);
		expect(screen.getByText("A description")).toBeInTheDocument();
	});

	it("renders without subtitle", () => {
		const { container } = render(<PageHeader title="My Page" />);
		expect(container.querySelector("p")).toBeInTheDocument();
		expect(container.querySelector("p")?.textContent).toBe("");
	});
});
