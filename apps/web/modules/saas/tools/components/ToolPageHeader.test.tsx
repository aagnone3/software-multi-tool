import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolPageHeader } from "./ToolPageHeader";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("./ToolFeedbackButton", () => ({
	ToolFeedbackButton: () => null,
}));

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
	beforeEach(() => {
		Object.defineProperty(window, "location", {
			value: { href: "http://localhost/app/tools/news-analyzer" },
			writable: true,
		});
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn().mockResolvedValue(undefined) },
			writable: true,
			configurable: true,
		});
	});

	it("renders tool name and description", () => {
		render(<ToolPageHeader tool={baseTool} />);
		expect(
			screen.getByRole("heading", { name: "News Analyzer" }),
		).toBeInTheDocument();
		expect(
			screen.getByText("Analyze news articles for bias and sentiment."),
		).toBeInTheDocument();
	});

	it("renders breadcrumb with Dashboard, Tools, and tool name", () => {
		render(<ToolPageHeader tool={baseTool} />);
		const nav = screen.getByRole("navigation", { name: /breadcrumb/i });
		expect(nav).toBeInTheDocument();
		expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
			"href",
			"/app",
		);
		expect(screen.getByRole("link", { name: "Tools" })).toHaveAttribute(
			"href",
			"/app/tools",
		);
		expect(
			screen.getByText("News Analyzer", { selector: "span" }),
		).toBeInTheDocument();
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

	it("renders share button", () => {
		render(<ToolPageHeader tool={baseTool} />);
		expect(
			screen.getByRole("button", { name: /copy link to this tool/i }),
		).toBeInTheDocument();
	});

	it("copies url on share button click", async () => {
		render(<ToolPageHeader tool={baseTool} />);
		const btn = screen.getByRole("button", {
			name: /copy link to this tool/i,
		});
		await userEvent.click(btn);
		expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
			"http://localhost/app/tools/news-analyzer",
		);
	});

	it("tracks tool_page_share_clicked on share", async () => {
		render(<ToolPageHeader tool={baseTool} />);
		const btn = screen.getByRole("button", { name: /copy link/i });
		await userEvent.click(btn);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_page_share_clicked",
			props: { tool_slug: "news-analyzer" },
		});
	});
});
