import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: any) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));
vi.mock("@ui/lib", () => ({
	cn: (...args: any[]) => args.filter(Boolean).join(" "),
}));

import { useRecentJobs } from "../hooks/use-recent-jobs";
import { DailyGoalWidget } from "./DailyGoalWidget";

const mockUseRecentJobs = vi.mocked(useRecentJobs);

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

const TODAY = new Date().toISOString();

describe("DailyGoalWidget", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it("returns null when loading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true } as any);
		const { container } = render(<DailyGoalWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders progress with 0 completed today", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		expect(screen.getByText("Daily Goal")).toBeDefined();
		expect(screen.getByText("/ 3 runs")).toBeDefined();
	});

	it("counts only today's COMPLETED jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{ id: "1", status: "COMPLETED", createdAt: TODAY },
				{ id: "2", status: "COMPLETED", createdAt: TODAY },
				{
					id: "3",
					status: "COMPLETED",
					createdAt: "2020-01-01T00:00:00Z",
				}, // old
				{ id: "4", status: "FAILED", createdAt: TODAY }, // not completed
			],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		// 2 of 3 completed today
		expect(screen.getByText("2")).toBeDefined();
	});

	it("shows success state when goal is met", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{ id: "1", status: "COMPLETED", createdAt: TODAY },
				{ id: "2", status: "COMPLETED", createdAt: TODAY },
				{ id: "3", status: "COMPLETED", createdAt: TODAY },
			],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		expect(
			screen.getByText("Goal reached! Great work today 🎉"),
		).toBeDefined();
	});

	it("opens edit mode when pencil button clicked", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		const editButton = screen.getByRole("button", { name: "Edit goal" });
		fireEvent.click(editButton);
		expect(screen.getByRole("spinbutton")).toBeDefined();
	});

	it("saves new goal to localStorage on save", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		fireEvent.click(screen.getByRole("button", { name: "Edit goal" }));
		const input = screen.getByRole("spinbutton");
		fireEvent.change(input, { target: { value: "5" } });
		fireEvent.click(screen.getByRole("button", { name: "Save" }));
		expect(localStorageMock.getItem("daily-tool-goal")).toBe("5");
		expect(screen.getByText("/ 5 runs")).toBeDefined();
	});

	it("cancels edit without saving", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<DailyGoalWidget />);
		fireEvent.click(screen.getByRole("button", { name: "Edit goal" }));
		fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
		expect(screen.getByText("/ 3 runs")).toBeDefined();
	});
});
