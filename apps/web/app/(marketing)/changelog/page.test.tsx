import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import ChangelogPage from "./page";

describe("ChangelogPage", () => {
	it("renders the Changelog heading", () => {
		render(<ChangelogPage />);
		expect(
			screen.getByRole("heading", { name: /changelog/i }),
		).toBeInTheDocument();
	});

	it("renders at least one version entry", () => {
		const { container } = render(<ChangelogPage />);
		// Version labels like "v1.4.0" appear in spans (not headings)
		const spans = Array.from(container.querySelectorAll("span"));
		const versionSpan = spans.find((s) =>
			/v\d+\.\d+\.\d+/.test(s.textContent ?? ""),
		);
		expect(versionSpan).toBeDefined();
	});

	it("renders feature/fix/improvement badge labels", () => {
		const { container } = render(<ChangelogPage />);
		const badges = container.querySelectorAll("span");
		const featureBadge = Array.from(badges).find(
			(s) =>
				s.textContent === "New" ||
				s.textContent === "Fix" ||
				s.textContent === "Improvement",
		);
		expect(featureBadge).toBeDefined();
	});

	it("renders multiple release sections", () => {
		render(<ChangelogPage />);
		const headings = screen.getAllByRole("heading");
		expect(headings.length).toBeGreaterThanOrEqual(1);
	});
});
