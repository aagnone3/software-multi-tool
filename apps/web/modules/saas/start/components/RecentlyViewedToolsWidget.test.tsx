import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { RecentlyViewedToolsWidget } from "./RecentlyViewedToolsWidget";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/tools/hooks/use-recently-viewed-tools", () => ({
	useRecentlyViewedTools: vi.fn(),
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: vi.fn(),
}));

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					enabled: true,
				},
				{
					slug: "invoice-processor",
					name: "Invoice Processor",
					enabled: true,
				},
			],
		},
	},
}));

import { useRecentlyViewedTools } from "@saas/tools/hooks/use-recently-viewed-tools";
import { useTools } from "@saas/tools/hooks/use-tools";

const mockUseRecentlyViewedTools = vi.mocked(useRecentlyViewedTools);
const mockUseTools = vi.mocked(useTools);

function defaultToolsHook() {
	mockUseTools.mockReturnValue({
		enabledTools: [
			{
				slug: "news-analyzer",
				name: "News Analyzer",
				creditCost: 5,
				public: true,
				enabled: true,
				description: "",
				comingSoon: false,
			},
			{
				slug: "invoice-processor",
				name: "Invoice Processor",
				creditCost: 3,
				public: true,
				enabled: true,
				description: "",
				comingSoon: false,
			},
		],
		isLoading: false,
	} as unknown as ReturnType<typeof useTools>);
}

describe("RecentlyViewedToolsWidget", () => {
	it("renders nothing when no recently viewed tools", () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		const { container } = render(<RecentlyViewedToolsWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders recently viewed tool names", () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [
				{ slug: "news-analyzer", viewedAt: "2026-03-22T20:00:00Z" },
			],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		render(<RecentlyViewedToolsWidget />);
		expect(screen.getByText("News Analyzer")).toBeTruthy();
	});

	it("shows relative time for each entry", () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [
				{
					slug: "invoice-processor",
					viewedAt: new Date(Date.now() - 90_000).toISOString(),
				},
			],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		render(<RecentlyViewedToolsWidget />);
		expect(screen.getByText("Invoice Processor")).toBeTruthy();
		// 90s = 1m ago
		expect(screen.getByText("1m ago")).toBeTruthy();
	});

	it("shows Browse all tools link", () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [
				{ slug: "news-analyzer", viewedAt: "2026-03-22T20:00:00Z" },
			],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		render(<RecentlyViewedToolsWidget />);
		expect(
			screen.getByRole("link", { name: /browse all tools/i }),
		).toBeTruthy();
	});

	it("tracks analytics when a tool link is clicked", async () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [
				{ slug: "news-analyzer", viewedAt: "2026-03-22T20:00:00Z" },
			],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		render(<RecentlyViewedToolsWidget />);
		await userEvent.click(screen.getByText("News Analyzer"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "dashboard_recently_viewed_tool_clicked",
			props: { tool_slug: "news-analyzer", tool_name: "News Analyzer" },
		});
	});

	it("skips unknown slugs (not in registry or enabled tools)", () => {
		mockUseRecentlyViewedTools.mockReturnValue({
			recentTools: [
				{ slug: "unknown-tool", viewedAt: "2026-03-22T20:00:00Z" },
			],
			recordView: vi.fn(),
		});
		defaultToolsHook();
		const { container } = render(<RecentlyViewedToolsWidget />);
		expect(container.firstChild).toBeNull();
	});
});
