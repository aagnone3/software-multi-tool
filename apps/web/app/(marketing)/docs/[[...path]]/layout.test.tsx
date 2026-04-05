import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@marketing/home/components/StickyCta", () => ({
	StickyCta: () => <div data-testid="sticky-cta" />,
}));

vi.mock("fumadocs-ui/layouts/docs", () => ({
	DocsLayout: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="docs-layout">{children}</div>
	),
}));

vi.mock("../../../docs-source", () => ({
	docsSource: {
		pageTree: {
			en: {
				name: "docs",
				children: [],
			},
		},
	},
}));

describe("DocumentationLayout", () => {
	it("renders children and StickyCta", async () => {
		const { default: DocumentationLayout } = await import("./layout");

		const ui = await DocumentationLayout({
			children: <div>docs content</div>,
		});
		render(ui);

		expect(screen.getByTestId("docs-layout")).toBeInTheDocument();
		expect(screen.getByText("docs content")).toBeInTheDocument();
		expect(screen.getByTestId("sticky-cta")).toBeInTheDocument();
	});
});
