import { render } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
	},
}));

import { useJobsList } from "@tools/hooks/use-job-polling";
import { toast } from "sonner";
import { MilestoneNotifier } from "./MilestoneNotifier";

const mockUseJobsList = useJobsList as ReturnType<typeof vi.fn>;

describe("MilestoneNotifier", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	it("renders nothing", () => {
		mockUseJobsList.mockReturnValue({
			isLoading: false,
			jobs: [],
		});
		const { container } = render(<MilestoneNotifier />);
		expect(container.firstChild).toBeNull();
	});

	it("does not toast when no completed jobs", () => {
		mockUseJobsList.mockReturnValue({
			isLoading: false,
			jobs: [{ status: "FAILED" }],
		});
		render(<MilestoneNotifier />);
		expect(toast.success).not.toHaveBeenCalled();
	});

	it("fires first-job toast when 1 completed job and not notified", () => {
		mockUseJobsList.mockReturnValue({
			isLoading: false,
			jobs: [{ status: "COMPLETED" }],
		});
		render(<MilestoneNotifier />);
		expect(toast.success).toHaveBeenCalledWith(
			"First job complete! 🎉",
			expect.any(Object),
		);
	});

	it("does not re-fire milestone already notified", () => {
		localStorage.setItem("smt:milestone-notified", JSON.stringify([1]));
		mockUseJobsList.mockReturnValue({
			isLoading: false,
			jobs: [{ status: "COMPLETED" }],
		});
		render(<MilestoneNotifier />);
		expect(toast.success).not.toHaveBeenCalled();
	});

	it("fires 10-job milestone toast when 10 completed and first milestone already seen", () => {
		localStorage.setItem("smt:milestone-notified", JSON.stringify([1]));
		mockUseJobsList.mockReturnValue({
			isLoading: false,
			jobs: Array.from({ length: 10 }, () => ({
				status: "COMPLETED",
			})),
		});
		render(<MilestoneNotifier />);
		expect(toast.success).toHaveBeenCalledWith(
			"10 jobs done!",
			expect.any(Object),
		);
	});

	it("does not toast while loading", () => {
		mockUseJobsList.mockReturnValue({ isLoading: true, jobs: [] });
		render(<MilestoneNotifier />);
		expect(toast.success).not.toHaveBeenCalled();
	});
});
