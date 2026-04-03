import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const mockUseCreditsHistory = vi.fn();
vi.mock("../../credits/hooks/use-credits-history", () => ({
	useCreditsHistory: () => mockUseCreditsHistory(),
}));

vi.mock("../../credits/lib/format-tool-name", () => ({
	formatToolName: (slug: string | null) => (slug ? slug.toUpperCase() : "—"),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

import { RecentActivityFeed } from "./RecentActivityFeed";

function makeTransaction(overrides = {}) {
	return {
		id: "tx-1",
		amount: -10,
		type: "USAGE" as const,
		toolSlug: "summarizer",
		jobId: "job-1",
		description: null,
		createdAt: new Date(Date.now() - 60000).toISOString(), // 1 min ago
		...overrides,
	};
}

describe("RecentActivityFeed", () => {
	it("renders loading skeletons when loading", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: true,
			transactions: [],
			pagination: null,
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Recent Activity")).toBeInTheDocument();
	});

	it("renders empty state when no transactions", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [],
			pagination: { total: 0, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("No activity yet")).toBeInTheDocument();
	});

	it("renders transactions with USAGE type", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction()],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Used SUMMARIZER")).toBeInTheDocument();
	});

	it("renders GRANT transaction label", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction({ type: "GRANT", amount: 100 })],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Credits granted")).toBeInTheDocument();
	});

	it("renders REFUND transaction label", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction({ type: "REFUND", amount: 5 })],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Credits refunded")).toBeInTheDocument();
	});

	it("renders PURCHASE transaction label", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction({ type: "PURCHASE", amount: 50 })],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Credits purchased")).toBeInTheDocument();
	});

	it("shows view all link", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction()],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		expect(
			screen.getByRole("link", { name: /view all activity/i }),
		).toBeInTheDocument();
	});

	it("tracks activity_feed_view_all_clicked when view all is clicked", async () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction()],
			pagination: { total: 1, limit: 10, offset: 0, hasMore: false },
		});
		render(<RecentActivityFeed />);
		const viewAll = screen.getByRole("link", {
			name: /view all activity/i,
		});
		await userEvent.click(viewAll);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "activity_feed_view_all_clicked",
			props: {},
		});
	});

	it("respects maxItems limit", () => {
		const txs = Array.from({ length: 5 }, (_, i) =>
			makeTransaction({ id: `tx-${i}`, toolSlug: `tool-${i}` }),
		);
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: txs.slice(0, 2),
			pagination: { total: 5, limit: 2, offset: 0, hasMore: true },
		});
		render(<RecentActivityFeed maxItems={2} />);
		expect(screen.getByText("Used TOOL-0")).toBeInTheDocument();
		expect(screen.getByText("Used TOOL-1")).toBeInTheDocument();
	});
});

describe("RecentActivityFeed error state", () => {
	it("shows error state when query fails", () => {
		mockUseCreditsHistory.mockReturnValue({
			transactions: [],
			isLoading: false,
			isError: true,
		});
		render(<RecentActivityFeed />);
		expect(screen.getByText("Failed to load activity")).toBeDefined();
	});
});
