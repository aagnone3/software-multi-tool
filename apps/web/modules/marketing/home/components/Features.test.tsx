import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { Features } from "./Features";

describe("Features", () => {
	it("renders feature titles", () => {
		render(<Features />);
		expect(screen.getByText("Document Summarization")).toBeInTheDocument();
		expect(screen.getByText("Audio Processing")).toBeInTheDocument();
		expect(
			screen.getByText("Productivity Enhancement"),
		).toBeInTheDocument();
	});

	it("renders a section element", () => {
		const { container } = render(<Features />);
		const section = container.querySelector("section");
		expect(section).toBeTruthy();
	});
});
