import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseRecentJobs = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: mockUseRecentJobs,
}));

// Stub next/link
vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

import { WeeklyActivityHeatmap } from "./WeeklyActivityHeatmap";

describe("WeeklyActivityHeatmap", () => {
	it("shows loading skeleton when isLoading is true", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true });
		const { container } = render(<WeeklyActivityHeatmap />);
		expect(container.querySelector(".animate-pulse")).not.toBeNull();
	});

	it("shows zero-job description when no completed jobs", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText("No completed jobs yet")).toBeInTheDocument();
	});

	it("shows job count in description when there are completed jobs", () => {
		const jobs = [
			{
				id: "1",
				toolSlug: "tool-a",
				status: "COMPLETED",
				createdAt: new Date().toISOString(),
				completedAt: new Date().toISOString(),
			},
			{
				id: "2",
				toolSlug: "tool-b",
				status: "COMPLETED",
				createdAt: new Date().toISOString(),
				completedAt: new Date().toISOString(),
			},
		];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText(/2 completed jobs/)).toBeInTheDocument();
	});

	it("ignores non-completed jobs in the count", () => {
		const jobs = [
			{
				id: "1",
				toolSlug: "tool-a",
				status: "FAILED",
				createdAt: new Date().toISOString(),
				completedAt: null,
			},
			{
				id: "2",
				toolSlug: "tool-b",
				status: "PENDING",
				createdAt: new Date().toISOString(),
				completedAt: null,
			},
		];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText("No completed jobs yet")).toBeInTheDocument();
	});

	it("renders the legend with Less and More labels", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText("Less")).toBeInTheDocument();
		expect(screen.getByText("More")).toBeInTheDocument();
	});

	it("renders day labels (Mon, Wed, Fri)", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText("Mon")).toBeInTheDocument();
		expect(screen.getByText("Wed")).toBeInTheDocument();
		expect(screen.getByText("Fri")).toBeInTheDocument();
	});

	it("singular 'job' for count of 1", () => {
		const jobs = [
			{
				id: "1",
				toolSlug: "tool-a",
				status: "COMPLETED",
				createdAt: new Date().toISOString(),
				completedAt: new Date().toISOString(),
			},
		];
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<WeeklyActivityHeatmap />);
		expect(screen.getByText(/1 completed job in/)).toBeInTheDocument();
	});
});
