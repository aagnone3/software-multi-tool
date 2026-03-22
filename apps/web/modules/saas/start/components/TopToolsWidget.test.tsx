import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TopToolsWidget } from "./TopToolsWidget";

const mockUseRecentJobs = vi.fn();
const mockUseTools = vi.fn();

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => mockUseRecentJobs(),
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => mockUseTools(),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

const enabledTools = [
	{ slug: "news-analyzer", name: "News Analyzer" },
	{ slug: "invoice-processor", name: "Invoice Processor" },
	{ slug: "meeting-summarizer", name: "Meeting Summarizer" },
];

describe("TopToolsWidget", () => {
	beforeEach(() => {
		mockUseTools.mockReturnValue({ enabledTools });
	});

	it("renders loading skeleton when loading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true });
		render(<TopToolsWidget />);
		expect(screen.getByText("Top Tools")).toBeInTheDocument();
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders empty state when no jobs", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<TopToolsWidget />);
		expect(screen.getByText("No usage yet")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Browse tools/i }),
		).toHaveAttribute("href", "/app/tools");
	});

	it("renders top tools with counts and percentages", () => {
		const jobs = [
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "invoice-processor" },
		];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<TopToolsWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("2 runs")).toBeInTheDocument();
		expect(screen.getByText("1 run")).toBeInTheDocument();
	});

	it("respects maxTools limit", () => {
		const jobs = [
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "invoice-processor" },
			{ toolSlug: "meeting-summarizer" },
		];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<TopToolsWidget maxTools={2} />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(
			screen.queryByText("Meeting Summarizer"),
		).not.toBeInTheDocument();
	});

	it("falls back to slug as name for unknown tools", () => {
		const jobs = [{ toolSlug: "unknown-tool" }];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<TopToolsWidget />);
		expect(screen.getByText("unknown-tool")).toBeInTheDocument();
	});

	it("renders View all jobs link", () => {
		const jobs = [{ toolSlug: "news-analyzer" }];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<TopToolsWidget />);
		expect(
			screen.getByRole("link", { name: /View all jobs/i }),
		).toHaveAttribute("href", "/app/jobs");
	});
});
