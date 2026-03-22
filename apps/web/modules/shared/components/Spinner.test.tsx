import { render } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Spinner } from "./Spinner";

describe("Spinner", () => {
	it("renders without error", () => {
		const { container } = render(<Spinner />);
		expect(container.firstChild).toBeDefined();
	});

	it("applies custom className", () => {
		const { container } = render(<Spinner className="text-red-500" />);
		const el = container.firstChild as Element;
		expect(el.className).toContain("text-red-500");
	});

	it("includes animate-spin by default", () => {
		const { container } = render(<Spinner />);
		const el = container.firstChild as Element;
		expect(el.className).toContain("animate-spin");
	});
});
