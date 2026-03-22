"use client";

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DiagramPreview } from "./diagram-preview";

vi.mock("next-themes", () => ({
	useTheme: () => ({ resolvedTheme: "light" }),
}));

vi.mock("mermaid", () => ({
	default: {
		initialize: vi.fn(),
		render: vi.fn().mockResolvedValue({ svg: "<svg>mock</svg>" }),
	},
}));

describe("DiagramPreview", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders empty state when code is empty", () => {
		render(<DiagramPreview code="" />);
		expect(
			screen.getByText(
				/Enter Mermaid syntax in the editor to see a preview/,
			),
		).toBeInTheDocument();
	});

	it("renders empty state when code is whitespace only", () => {
		render(<DiagramPreview code="   " />);
		expect(
			screen.getByText(
				/Enter Mermaid syntax in the editor to see a preview/,
			),
		).toBeInTheDocument();
	});

	it("renders diagram container when code is provided", () => {
		const { container } = render(<DiagramPreview code="graph TD; A-->B" />);
		// Should render the container div (not the empty state)
		expect(
			screen.queryByText(/Enter Mermaid syntax in the editor/),
		).not.toBeInTheDocument();
		expect(container.querySelector(".rounded-lg")).toBeInTheDocument();
	});

	it("applies custom className", () => {
		const { container } = render(
			<DiagramPreview
				code="graph TD; A-->B"
				className="my-custom-class"
			/>,
		);
		expect(container.querySelector(".my-custom-class")).toBeInTheDocument();
	});
});
