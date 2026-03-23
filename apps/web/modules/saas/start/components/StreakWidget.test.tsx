import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StreakWidget } from "./StreakWidget";

const mockUseRecentJobs = vi.fn();

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => mockUseRecentJobs(),
}));

function makeJob(daysAgo: number): {
	completedAt: string | null;
	toolSlug: string;
	id: string;
	status: "COMPLETED";
	createdAt: string;
} {
	const d = new Date(Date.now() - daysAgo * 86_400_000).toISOString();
	return {
		id: `job-${daysAgo}`,
		toolSlug: "news-analyzer",
		status: "COMPLETED",
		createdAt: d,
		completedAt: d,
	};
}

describe("StreakWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing while loading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true });
		const { container } = render(<StreakWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("shows 0 streak and prompt when no completed jobs", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<StreakWidget />);
		expect(screen.getByText("0")).toBeInTheDocument();
		expect(screen.getByText(/complete a job today/i)).toBeInTheDocument();
	});

	it("shows streak of 1 for a job completed today", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob(0)],
			isLoading: false,
		});
		render(<StreakWidget />);
		expect(screen.getByText("1")).toBeInTheDocument();
		expect(screen.getByText("day in a row")).toBeInTheDocument();
	});

	it("shows streak of 2 for jobs on consecutive days", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob(0), makeJob(1)],
			isLoading: false,
		});
		render(<StreakWidget />);
		expect(screen.getByText("2")).toBeInTheDocument();
		expect(screen.getByText("days in a row")).toBeInTheDocument();
	});

	it("breaks streak when a day is skipped", () => {
		// Today and 2 days ago — skipped yesterday so streak is 1
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob(0), makeJob(2)],
			isLoading: false,
		});
		render(<StreakWidget />);
		expect(screen.getByText("1")).toBeInTheDocument();
	});

	it("shows best streak from historical data", () => {
		// 3-day streak from 5 days ago: days 5, 4, 3 ago → best=3; current=1 (today)
		mockUseRecentJobs.mockReturnValue({
			jobs: [makeJob(0), makeJob(3), makeJob(4), makeJob(5)],
			isLoading: false,
		});
		render(<StreakWidget />);
		expect(screen.getByText(/Best:/i)).toBeInTheDocument();
	});

	it("renders Activity Streak heading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<StreakWidget />);
		expect(screen.getByText("Activity Streak")).toBeInTheDocument();
	});
});
