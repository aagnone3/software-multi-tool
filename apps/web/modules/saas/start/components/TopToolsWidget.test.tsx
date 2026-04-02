"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockJobs = [
	{
		id: "1",
		toolSlug: "document-analyzer",
		status: "COMPLETED",
		createdAt: new Date(),
	},
	{
		id: "2",
		toolSlug: "document-analyzer",
		status: "COMPLETED",
		createdAt: new Date(),
	},
	{
		id: "3",
		toolSlug: "meeting-summarizer",
		status: "COMPLETED",
		createdAt: new Date(),
	},
];

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => ({
		jobs: mockJobs,
		isLoading: false,
	}),
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => ({
		enabledTools: [
			{
				slug: "document-analyzer",
				name: "Document Analyzer",
				creditCost: 5,
				public: true,
				comingSoon: false,
			},
			{
				slug: "meeting-summarizer",
				name: "Meeting Summarizer",
				creditCost: 8,
				public: true,
				comingSoon: false,
			},
		],
	}),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

import { TopToolsWidget } from "./TopToolsWidget";

describe("TopToolsWidget", () => {
	it("renders top tools widget heading", () => {
		render(<TopToolsWidget />);
		expect(screen.getByText("Top Tools")).toBeInTheDocument();
	});

	it("shows tool names from jobs", () => {
		render(<TopToolsWidget />);
		expect(screen.getByText("Document Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
	});

	it("shows run counts", () => {
		render(<TopToolsWidget />);
		expect(screen.getByText("2 runs")).toBeInTheDocument();
		expect(screen.getByText("1 run")).toBeInTheDocument();
	});

	it("shows browse tools link when no jobs", () => {
		vi.doMock("../hooks/use-recent-jobs", () => ({
			useRecentJobs: () => ({ jobs: [], isLoading: false }),
		}));
	});

	it("respects maxTools prop", () => {
		render(<TopToolsWidget maxTools={1} />);
		// Only document-analyzer (highest count) should show
		expect(screen.getByText("Document Analyzer")).toBeInTheDocument();
		expect(
			screen.queryByText("Meeting Summarizer"),
		).not.toBeInTheDocument();
	});

	it("shows view all jobs link", () => {
		render(<TopToolsWidget />);
		const link = screen.getByRole("link", { name: /view all jobs/i });
		expect(link).toHaveAttribute("href", "/app/jobs");
	});

	describe("analytics", () => {
		beforeEach(() => {
			mockTrack.mockClear();
		});

		it("tracks tool click with slug, name, and rank", async () => {
			const user = userEvent.setup();
			render(<TopToolsWidget />);
			const toolLink = screen.getAllByRole("link", {
				name: /Document Analyzer/i,
			})[0];
			await user.click(toolLink);
			expect(mockTrack).toHaveBeenCalledWith({
				name: "dashboard_top_tool_clicked",
				props: {
					tool_slug: "document-analyzer",
					tool_name: "Document Analyzer",
					rank: 1,
				},
			});
		});
	});
});
