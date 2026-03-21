import type { ToolConfig } from "@repo/config/types";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolCard } from "./ToolCard";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@repo/config", () => ({
	config: {
		payments: { enabled: false },
	},
}));

const baseTool: ToolConfig = {
	slug: "test-tool",
	name: "Test Tool",
	description: "A test tool",
	icon: "file-text",
	public: false,
	enabled: true,
	creditCost: 1,
};

describe("ToolCard", () => {
	it("renders tool name and description", () => {
		render(<ToolCard tool={baseTool} />);
		expect(screen.getByText("Test Tool")).toBeInTheDocument();
		expect(screen.getByText("A test tool")).toBeInTheDocument();
	});

	it("renders Open Tool button with correct link", () => {
		render(<ToolCard tool={baseTool} />);
		const link = screen.getByRole("link", { name: /open tool/i });
		expect(link).toHaveAttribute("href", "/app/tools/test-tool");
		// slug-based path: /app/tools/{slug}
	});

	it("renders coming soon state when isComingSoon=true", () => {
		render(<ToolCard tool={baseTool} isComingSoon />);
		expect(screen.getAllByText("Coming Soon").length).toBeGreaterThan(0);
		const btn = screen.getByRole("button", { name: /coming soon/i });
		expect(btn).toBeDisabled();
	});

	it("renders unknown icon as fallback (WrenchIcon)", () => {
		const tool = { ...baseTool, icon: "unknown-icon" };
		render(<ToolCard tool={tool} />);
		// Just renders without error
		expect(screen.getByText("Test Tool")).toBeInTheDocument();
	});

	it("renders known icons for each supported icon name", () => {
		const icons = [
			"image-minus",
			"users",
			"newspaper",
			"receipt",
			"file-text",
			"message-square-text",
			"wallet",
			"clipboard-list",
		];
		for (const icon of icons) {
			const { unmount } = render(
				<ToolCard tool={{ ...baseTool, icon }} />,
			);
			expect(screen.getByText("Test Tool")).toBeInTheDocument();
			unmount();
		}
	});
});
