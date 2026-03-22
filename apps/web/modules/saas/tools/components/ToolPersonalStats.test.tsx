import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolPersonalStats } from "./ToolPersonalStats";

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));

import { useJobsList } from "@tools/hooks/use-job-polling";

const mockUseJobsList = vi.mocked(useJobsList);

describe("ToolPersonalStats", () => {
	it("renders null when no jobs exist", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(
			<ToolPersonalStats toolSlug="news-analyzer" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders loading skeletons while loading", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: true,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(
			<ToolPersonalStats toolSlug="news-analyzer" />,
		);
		// Card should be rendered with skeleton elements
		expect(container.firstChild).toBeTruthy();
	});

	it("shows total run count", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-01T00:00:00Z",
				},
				{
					id: "2",
					status: "FAILED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-02T00:00:00Z",
				},
				{
					id: "3",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-03T00:00:00Z",
				},
			] as never[],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolPersonalStats toolSlug="news-analyzer" />);
		expect(screen.getByText("3")).toBeDefined();
		expect(screen.getByText("Runs")).toBeDefined();
	});

	it("shows success rate", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-01T00:00:00Z",
				},
				{
					id: "2",
					status: "FAILED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-02T00:00:00Z",
				},
			] as never[],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolPersonalStats toolSlug="news-analyzer" />);
		expect(screen.getByText("50%")).toBeDefined();
		expect(screen.getByText("Success")).toBeDefined();
	});

	it("shows singular 'Run' label for single job", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-01T00:00:00Z",
				},
			] as never[],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolPersonalStats toolSlug="news-analyzer" />);
		expect(screen.getByText("Run")).toBeDefined();
	});

	it("shows Your Usage heading", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-01T00:00:00Z",
				},
			] as never[],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		render(<ToolPersonalStats toolSlug="news-analyzer" />);
		expect(screen.getByText("Your Usage")).toBeDefined();
	});

	it("accepts className prop", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{
					id: "1",
					status: "COMPLETED",
					toolSlug: "news-analyzer",
					createdAt: "2026-01-01T00:00:00Z",
				},
			] as never[],
			isLoading: false,
			error: null,
			refetch: vi.fn(),
		});
		const { container } = render(
			<ToolPersonalStats toolSlug="news-analyzer" className="mt-4" />,
		);
		expect(container.firstChild).toBeTruthy();
	});
});
