import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it } from "vitest";
import { ToolUsageGuide } from "./ToolUsageGuide";

describe("ToolUsageGuide", () => {
	it("renders the toggle button for a known tool slug", () => {
		render(<ToolUsageGuide toolSlug="news-analyzer" />);
		expect(
			screen.getByRole("button", { name: /how to use this tool/i }),
		).toBeInTheDocument();
	});

	it("renders nothing for an unknown tool slug", () => {
		const { container } = render(
			<ToolUsageGuide toolSlug="unknown-tool" />,
		);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows tips after clicking the toggle button", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolUsageGuide toolSlug="contract-analyzer" />);

		const button = screen.getByRole("button", {
			name: /how to use this tool/i,
		});
		await user.click(button);

		expect(
			screen.getByText(/paste contract text or upload a file/i),
		).toBeInTheDocument();
		expect(
			screen.getByText(/identify key clauses, risks/i),
		).toBeInTheDocument();
	});

	it("hides tips after clicking the toggle button twice", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolUsageGuide toolSlug="contract-analyzer" />);

		const button = screen.getByRole("button", {
			name: /how to use this tool/i,
		});
		await user.click(button);
		await user.click(button);

		expect(
			screen.queryByText(/paste contract text or upload a file/i),
		).not.toBeInTheDocument();
	});

	it("renders all 8 known tool slugs without crashing", () => {
		const slugs = [
			"news-analyzer",
			"invoice-processor",
			"contract-analyzer",
			"feedback-analyzer",
			"expense-categorizer",
			"meeting-summarizer",
			"speaker-separation",
			"diagram-editor",
		];
		for (const slug of slugs) {
			const { unmount } = render(<ToolUsageGuide toolSlug={slug} />);
			expect(
				screen.getByRole("button", { name: /how to use this tool/i }),
			).toBeInTheDocument();
			unmount();
		}
	});

	it("shows numbered steps when expanded", async () => {
		const user = userEvent.setup({ delay: null });
		render(<ToolUsageGuide toolSlug="meeting-summarizer" />);

		await user.click(
			screen.getByRole("button", { name: /how to use this tool/i }),
		);

		// 3 numbered steps
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("3")).toBeInTheDocument();
	});
});
