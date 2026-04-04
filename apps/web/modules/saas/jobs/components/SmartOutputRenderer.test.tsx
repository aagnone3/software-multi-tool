import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { SmartOutputRenderer } from "./SmartOutputRenderer";

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

// Mock clipboard
Object.defineProperty(navigator, "clipboard", {
	value: { writeText: vi.fn().mockResolvedValue(undefined) },
	writable: true,
	configurable: true,
});

describe("SmartOutputRenderer", () => {
	it("renders raw output for a primitive string", () => {
		render(<SmartOutputRenderer output="hello world" />);
		// String output is JSON-serialized in the pre block (with surrounding quotes)
		expect(screen.getByText(/"hello world"/)).toBeInTheDocument();
	});

	it("renders raw output for a number", () => {
		render(<SmartOutputRenderer output={42} />);
		expect(screen.getByText("42")).toBeInTheDocument();
	});

	it("renders formatted and raw tabs for an object", () => {
		render(<SmartOutputRenderer output={{ name: "test", value: 99 }} />);
		expect(
			screen.getByRole("tab", { name: /formatted/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: /raw json/i }),
		).toBeInTheDocument();
	});

	it("shows key-value list in smart view for object", () => {
		render(<SmartOutputRenderer output={{ status: "ok", count: 5 }} />);
		expect(screen.getByText(/status/i)).toBeInTheDocument();
		expect(screen.getByText("ok")).toBeInTheDocument();
	});

	it("shows table view for array of objects", () => {
		const output = [
			{ name: "Alice", score: 100 },
			{ name: "Bob", score: 80 },
		];
		render(<SmartOutputRenderer output={output} />);
		expect(
			screen.getByRole("tab", { name: /formatted/i }),
		).toBeInTheDocument();
		expect(screen.getByText("Alice")).toBeInTheDocument();
		expect(screen.getByText("Bob")).toBeInTheDocument();
	});

	it("raw JSON tab is present and labeled for an object", () => {
		render(<SmartOutputRenderer output={{ x: 1 }} />);
		const rawTab = screen.getByRole("tab", { name: /raw json/i });
		expect(rawTab).toBeInTheDocument();
		// Tab controls a panel (aria-controls attribute present)
		expect(rawTab).toHaveAttribute("aria-controls");
	});

	it("renders Copy button on raw output", () => {
		render(<SmartOutputRenderer output="simple text" />);
		expect(
			screen.getByRole("button", { name: /copy/i }),
		).toBeInTheDocument();
	});

	it("shows boolean true as check icon (not text 'true')", () => {
		render(<SmartOutputRenderer output={{ active: true }} />);
		// The boolean renders as an icon, not literal "true" text
		expect(screen.queryByText("true")).not.toBeInTheDocument();
	});

	it("renders truncated text with show more for long strings", () => {
		const longText = "x".repeat(200);
		render(<SmartOutputRenderer output={{ description: longText }} />);
		expect(
			screen.getByRole("button", { name: /show more/i }),
		).toBeInTheDocument();
	});

	it("expands truncated text when show more is clicked", () => {
		const longText = "a".repeat(200);
		render(<SmartOutputRenderer output={{ description: longText }} />);
		const showMore = screen.getByRole("button", { name: /show more/i });
		fireEvent.click(showMore);
		expect(
			screen.getByRole("button", { name: /show less/i }),
		).toBeInTheDocument();
	});

	it("fires smart_output_raw_copied when Copy is clicked on raw output", async () => {
		mockTrack.mockClear();
		render(
			<SmartOutputRenderer
				output="plain text"
				toolSlug="invoice-processor"
			/>,
		);
		const copyBtn = screen.getByRole("button", { name: /copy/i });
		fireEvent.click(copyBtn);
		// Wait for async clipboard write
		await Promise.resolve();
		expect(mockTrack).toHaveBeenCalledWith({
			name: "smart_output_raw_copied",
			props: { tool_slug: "invoice-processor" },
		});
	});
});
