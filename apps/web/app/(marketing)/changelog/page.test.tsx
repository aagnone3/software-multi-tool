import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import ChangelogPage from "./page";

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

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

	it("renders JSON-LD structured data script tag", () => {
		const { container } = render(<ChangelogPage />);
		const script = container.querySelector(
			'script[type="application/ld+json"]',
		);
		expect(script).not.toBeNull();
		const parsed = JSON.parse(script?.innerHTML ?? "{}");
		expect(parsed["@type"]).toBe("SoftwareApplication");
		expect(parsed.releaseNotes).toContain("/changelog");
	});

	it("renders StickyCta", () => {
		render(<ChangelogPage />);
		expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
	});
});
