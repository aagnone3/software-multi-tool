import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";
import { ToolSampleOutput } from "./ToolSampleOutput";

describe("ToolSampleOutput", () => {
	it("renders nothing for unknown tool slug", () => {
		const { container } = render(
			<ToolSampleOutput toolSlug="unknown-tool" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders collapsed by default for known tool", () => {
		render(<ToolSampleOutput toolSlug="news-analyzer" />);
		expect(screen.getByText("Sample Output")).toBeInTheDocument();
		expect(screen.getByText("Preview")).toBeInTheDocument();
		expect(screen.queryByText("Sample Input")).not.toBeInTheDocument();
	});

	it("shows label badge for the tool", () => {
		render(<ToolSampleOutput toolSlug="news-analyzer" />);
		expect(screen.getByText("News Article")).toBeInTheDocument();
	});

	it("expands when Preview is clicked", () => {
		render(<ToolSampleOutput toolSlug="contract-analyzer" />);
		fireEvent.click(screen.getByText("Preview"));
		expect(screen.getByText("Sample Input")).toBeInTheDocument();
		// "Sample Output" appears in both title and section header when expanded
		expect(
			screen.getAllByText("Sample Output").length,
		).toBeGreaterThanOrEqual(1);
	});

	it("collapses when Hide is clicked", () => {
		render(<ToolSampleOutput toolSlug="invoice-processor" />);
		fireEvent.click(screen.getByText("Preview"));
		expect(screen.getByText("Hide")).toBeInTheDocument();
		fireEvent.click(screen.getByText("Hide"));
		expect(screen.getByText("Preview")).toBeInTheDocument();
		expect(screen.queryByText("Sample Input")).not.toBeInTheDocument();
	});

	it("shows sample input text when expanded", () => {
		render(<ToolSampleOutput toolSlug="meeting-summarizer" />);
		fireEvent.click(screen.getByText("Preview"));
		// Input text is rendered in a pre block — check it's in the DOM
		const preElements = document.querySelectorAll("pre");
		const found = Array.from(preElements).some((el) =>
			el.textContent?.includes("Q1 planning call"),
		);
		expect(found).toBe(true);
	});

	it("renders for all known tool slugs", () => {
		const slugs = [
			"news-analyzer",
			"contract-analyzer",
			"invoice-processor",
			"meeting-summarizer",
			"feedback-analyzer",
			"expense-categorizer",
			"speaker-separation",
		];
		for (const slug of slugs) {
			const { unmount } = render(<ToolSampleOutput toolSlug={slug} />);
			expect(screen.getByText("Sample Output")).toBeInTheDocument();
			unmount();
		}
	});
});
