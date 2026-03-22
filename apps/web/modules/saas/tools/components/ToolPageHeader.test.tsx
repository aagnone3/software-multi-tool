import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolPageHeader } from "./ToolPageHeader";

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

const baseTool = {
	slug: "news-analyzer",
	name: "News Analyzer",
	description: "Analyze news articles for bias and sentiment.",
	icon: "newspaper",
	public: false,
	enabled: true,
	creditCost: 2,
};

describe("ToolPageHeader", () => {
	it("renders tool name and description", () => {
		render(<ToolPageHeader tool={baseTool} />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(
			screen.getByText("Analyze news articles for bias and sentiment."),
		).toBeInTheDocument();
	});

	it("renders back link to /app/tools", () => {
		render(<ToolPageHeader tool={baseTool} />);
		const link = screen.getByRole("link", { name: /all tools/i });
		expect(link).toHaveAttribute("href", "/app/tools");
	});

	it("shows credit cost badge when creditCost > 0", () => {
		render(<ToolPageHeader tool={baseTool} />);
		expect(screen.getByText(/2 credits \/ use/)).toBeInTheDocument();
	});

	it("shows singular 'credit' when creditCost is 1", () => {
		render(<ToolPageHeader tool={{ ...baseTool, creditCost: 1 }} />);
		expect(screen.getByText(/1 credit \/ use/)).toBeInTheDocument();
	});

	it("hides credit badge when creditCost is 0", () => {
		render(<ToolPageHeader tool={{ ...baseTool, creditCost: 0 }} />);
		expect(screen.queryByText(/credit/)).not.toBeInTheDocument();
	});
});
