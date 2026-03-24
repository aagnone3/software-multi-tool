import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { JobSearchWidget } from "./JobSearchWidget";

const mockJobs = [
	{
		id: "job-1",
		toolSlug: "news-analyzer",
		status: "COMPLETED" as const,
		createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
		completedAt: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
	},
	{
		id: "job-2",
		toolSlug: "invoice-processor",
		status: "FAILED" as const,
		createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
		completedAt: null,
	},
	{
		id: "job-3",
		toolSlug: "meeting-summarizer",
		status: "PROCESSING" as const,
		createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
		completedAt: null,
	},
];

vi.mock("../../start/hooks/use-recent-jobs", () => ({
	useRecentJobs: () => ({
		jobs: mockJobs,
		isLoading: false,
		isError: false,
		error: null,
		refetch: vi.fn(),
		recentToolSlugs: [
			"news-analyzer",
			"invoice-processor",
			"meeting-summarizer",
		],
		recentToolsMap: new Map(mockJobs.map((j) => [j.toolSlug, j])),
	}),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		className,
	}: {
		href: string;
		children: React.ReactNode;
		className?: string;
	}) => (
		<a href={href} className={className}>
			{children}
		</a>
	),
}));

describe("JobSearchWidget", () => {
	it("renders the search input", () => {
		render(<JobSearchWidget />);
		expect(
			screen.getByPlaceholderText("Search by tool, status, or job ID…"),
		).toBeInTheDocument();
	});

	it("shows all jobs when no query", () => {
		render(<JobSearchWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("Meeting Summarizer")).toBeInTheDocument();
	});

	it("filters jobs by tool name", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobSearchWidget />);
		await user.type(
			screen.getByPlaceholderText("Search by tool, status, or job ID…"),
			"news",
		);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.queryByText("Invoice Processor")).not.toBeInTheDocument();
	});

	it("filters jobs by status", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobSearchWidget />);
		await user.type(
			screen.getByPlaceholderText("Search by tool, status, or job ID…"),
			"failed",
		);
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.queryByText("News Analyzer")).not.toBeInTheDocument();
	});

	it("shows empty state when no results match", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobSearchWidget />);
		await user.type(
			screen.getByPlaceholderText("Search by tool, status, or job ID…"),
			"zzznomatch",
		);
		expect(
			screen.getByText("No jobs match your search."),
		).toBeInTheDocument();
	});

	it("clears search when X button clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<JobSearchWidget />);
		const input = screen.getByPlaceholderText(
			"Search by tool, status, or job ID…",
		);
		await user.type(input, "news");
		await user.click(screen.getByLabelText("Clear search"));
		expect(input).toHaveValue("");
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
	});

	it("shows View all jobs link", () => {
		render(<JobSearchWidget />);
		expect(screen.getByText("View all jobs →")).toBeInTheDocument();
	});

	it("links to job detail page", () => {
		render(<JobSearchWidget />);
		const links = screen.getAllByRole("link");
		const jobLink = links.find((l) =>
			l.getAttribute("href")?.startsWith("/app/jobs/job-"),
		);
		expect(jobLink).toBeTruthy();
	});
});
