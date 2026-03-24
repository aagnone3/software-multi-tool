import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToolBenchmarkWidget } from "./ToolBenchmarkWidget";

vi.mock("@saas/start/hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(),
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

import * as useRecentJobsModule from "@saas/start/hooks/use-recent-jobs";

const mockUseRecentJobs = vi.mocked(useRecentJobsModule.useRecentJobs);

const makeJob = (
	toolSlug: string,
	status: "COMPLETED" | "FAILED" | "PENDING",
	createdAt: string,
	completedAt: string | null = null,
	id = Math.random().toString(),
) => ({ id, toolSlug, status, createdAt, completedAt });

describe("ToolBenchmarkWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading skeleton when loading", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			isLoading: true,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget />);
		expect(screen.getByText("Tool Benchmark")).toBeDefined();
	});

	it("returns null when no jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		const { container } = render(<ToolBenchmarkWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("shows tool name as link to tool page", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob(
					"feedback-analyzer",
					"COMPLETED",
					"2024-01-01T10:00:00Z",
					"2024-01-01T10:00:05Z",
				),
			],
			recentToolSlugs: ["feedback-analyzer"],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget />);
		const link = screen.getByRole("link", { name: "Feedback Analyzer" });
		expect(link.getAttribute("href")).toBe("/app/tools/feedback-analyzer");
	});

	it("shows 100% success rate when all jobs completed", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob(
					"contract-analyzer",
					"COMPLETED",
					"2024-01-01T10:00:00Z",
					"2024-01-01T10:00:05Z",
				),
				makeJob(
					"contract-analyzer",
					"COMPLETED",
					"2024-01-01T11:00:00Z",
					"2024-01-01T11:00:08Z",
				),
			],
			recentToolSlugs: ["contract-analyzer"],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget />);
		expect(screen.getByText("100% success")).toBeDefined();
	});

	it("shows run count", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob(
					"invoice-processor",
					"COMPLETED",
					"2024-01-01T10:00:00Z",
					"2024-01-01T10:00:03Z",
				),
				makeJob("invoice-processor", "FAILED", "2024-01-01T11:00:00Z"),
				makeJob(
					"invoice-processor",
					"COMPLETED",
					"2024-01-01T12:00:00Z",
					"2024-01-01T12:00:04Z",
				),
			],
			recentToolSlugs: ["invoice-processor"],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget />);
		expect(screen.getByText("3 runs")).toBeDefined();
	});

	it("shows average duration for completed jobs", () => {
		// 5000ms and 3000ms average = 4000ms = 4.0s
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				makeJob(
					"news-analyzer",
					"COMPLETED",
					"2024-01-01T10:00:00.000Z",
					"2024-01-01T10:00:05.000Z",
				),
				makeJob(
					"news-analyzer",
					"COMPLETED",
					"2024-01-01T11:00:00.000Z",
					"2024-01-01T11:00:03.000Z",
				),
			],
			recentToolSlugs: ["news-analyzer"],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget />);
		expect(screen.getByText(/avg \d+\.\ds/)).toBeDefined();
	});

	it("limits display to maxTools", () => {
		const jobs = ["tool-a", "tool-b", "tool-c", "tool-d"].map((slug) =>
			makeJob(
				slug,
				"COMPLETED",
				"2024-01-01T10:00:00Z",
				"2024-01-01T10:00:02Z",
			),
		);

		mockUseRecentJobs.mockReturnValue({
			jobs,
			recentToolSlugs: ["tool-a", "tool-b", "tool-c", "tool-d"],
			recentToolsMap: new Map(),
			isLoading: false,
			isError: false,
			error: null,
			refetch: vi.fn(),
		});

		render(<ToolBenchmarkWidget maxTools={2} />);
		// Only 2 links should render
		const links = screen.getAllByRole("link");
		expect(links).toHaveLength(2);
	});
});
