import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { Features } from "./Features";

describe("Features", () => {
	it("renders the section heading", () => {
		render(<Features />);
		expect(
			screen.getByText("8 AI tools, ready to use today"),
		).toBeInTheDocument();
	});

	it("renders all 8 tool cards", () => {
		render(<Features />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Contract Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
		expect(
			screen.getByText("Customer Feedback Analyzer"),
		).toBeInTheDocument();
		expect(screen.getByText("Expense Categorizer")).toBeInTheDocument();
		expect(screen.getByText("Speaker Separation")).toBeInTheDocument();
		expect(screen.getByText("Background Remover")).toBeInTheDocument();
	});

	it("marks background remover as coming soon", () => {
		render(<Features />);
		expect(screen.getByText("Soon")).toBeInTheDocument();
	});

	it("renders Try it links for non-coming-soon tools", () => {
		render(<Features />);
		const links = screen.getAllByText("Try it →");
		expect(links.length).toBe(7);
	});

	it("renders a section element", () => {
		const { container } = render(<Features />);
		const section = container.querySelector("section");
		expect(section).toBeTruthy();
	});

	it("tracks tool click when Try it link is clicked", async () => {
		render(<Features />);
		const links = screen.getAllByText("Try it →");
		await userEvent.click(links[0]);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "home_features_tool_clicked",
			props: expect.objectContaining({ tool_id: expect.any(String) }),
		});
	});

	it("all tool links point to marketing pages (/tools/...), not authenticated routes (/app/tools/...)", () => {
		render(<Features />);
		const links = screen.getAllByText("Try it →");
		for (const link of links) {
			const href =
				link.getAttribute("href") ??
				link.closest("a")?.getAttribute("href") ??
				"";
			expect(href).toMatch(/^\/tools\//);
			expect(href).not.toMatch(/^\/app\/tools\//);
		}
	});
});
