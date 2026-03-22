import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobsHistoryPage } from "./JobsHistoryPage";

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					public: true,
					creditCost: 5,
				},
				{
					slug: "speaker-separation",
					name: "Speaker Separation",
					public: true,
					creditCost: 10,
				},
			],
		},
	},
}));

// Mock use-job-polling
const mockRefetch = vi.fn();
const mockJobsList = vi.fn();

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: () => mockJobsList(),
}));

// Mock next/link
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

describe("JobsHistoryPage", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			refetch: mockRefetch,
		});
	});

	it("shows loading skeleton while loading", () => {
		mockJobsList.mockReturnValue({
			jobs: [],
			isLoading: true,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("shows empty state with Browse Tools CTA when no jobs", () => {
		render(<JobsHistoryPage />);
		expect(screen.getByText("No jobs yet")).toBeInTheDocument();
		expect(
			screen.getByText(/Your tool runs will appear here/),
		).toBeInTheDocument();
		const link = screen.getByRole("link", { name: "Browse Tools" });
		expect(link).toHaveAttribute("href", "/app/tools");
	});

	it("shows filtered empty state when filters active but no results", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		// Search for something that doesn't match
		const searchInput = screen.getByPlaceholderText(
			"Search by tool name...",
		);
		fireEvent.change(searchInput, { target: { value: "zzznomatch" } });
		expect(
			screen.getByText("No jobs match your filters"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Try adjusting your search or filter criteria."),
		).toBeInTheDocument();
	});

	it("renders job rows when jobs exist", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
				{
					id: "job-2",
					toolSlug: "speaker-separation",
					status: "PENDING",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Speaker Separation")).toBeInTheDocument();
		expect(screen.getByText("Completed")).toBeInTheDocument();
		expect(screen.getByText("Pending")).toBeInTheDocument();
	});

	it("shows job count in header", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		expect(screen.getByText("1 job")).toBeInTheDocument();
	});

	it("shows View link for completed job with detail route", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "job-abc",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		const viewLink = screen.getByRole("link", { name: /View/ });
		expect(viewLink).toHaveAttribute(
			"href",
			"/app/tools/news-analyzer/job-abc",
		);
	});

	it("shows Open Tool link for job without dedicated detail page", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				// A tool without a detail route (e.g. invoice-processor)
				{
					id: "job-xyz",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		const openLink = screen.getByRole("link", { name: "Open Tool" });
		expect(openLink).toHaveAttribute(
			"href",
			"/app/tools/invoice-processor",
		);
	});

	it("calls refetch when Refresh button is clicked", () => {
		render(<JobsHistoryPage />);
		const refreshBtn = screen.getByRole("button", { name: /Refresh/ });
		fireEvent.click(refreshBtn);
		expect(mockRefetch).toHaveBeenCalledOnce();
	});

	it("shows Clear filters button when filters are active", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		const searchInput = screen.getByPlaceholderText(
			"Search by tool name...",
		);
		fireEvent.change(searchInput, { target: { value: "test" } });
		expect(
			screen.getByRole("button", { name: "Clear filters" }),
		).toBeInTheDocument();
	});

	it("clears filters when Clear filters is clicked", () => {
		mockJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
				},
			],
			isLoading: false,
			refetch: mockRefetch,
		});
		render(<JobsHistoryPage />);
		const searchInput = screen.getByPlaceholderText(
			"Search by tool name...",
		);
		fireEvent.change(searchInput, { target: { value: "test" } });
		const clearBtn = screen.getByRole("button", { name: "Clear filters" });
		fireEvent.click(clearBtn);
		expect(
			screen.queryByRole("button", { name: "Clear filters" }),
		).not.toBeInTheDocument();
	});
});
