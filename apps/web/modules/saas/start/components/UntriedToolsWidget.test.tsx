import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { UntriedToolsWidget } from "./UntriedToolsWidget";

const mockUseTools = vi.fn();
const mockUseRecentJobs = vi.fn();

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => mockUseTools(),
}));

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: () => mockUseRecentJobs(),
}));

const makeTool = (slug: string, name: string, creditCost = 2) => ({
	slug,
	name,
	creditCost,
	public: true,
	comingSoon: false,
});

describe("UntriedToolsWidget", () => {
	it("renders nothing when all tools have been used", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [makeTool("tool-a", "Tool A")],
		});
		mockUseRecentJobs.mockReturnValue({
			jobs: [{ toolSlug: "tool-a" }],
		});
		const { container } = render(<UntriedToolsWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when no tools configured", () => {
		mockUseTools.mockReturnValue({ enabledTools: [] });
		mockUseRecentJobs.mockReturnValue({ jobs: [] });
		const { container } = render(<UntriedToolsWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("renders untried tools", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [
				makeTool("tool-a", "Tool A"),
				makeTool("tool-b", "Tool B"),
			],
		});
		mockUseRecentJobs.mockReturnValue({
			jobs: [{ toolSlug: "tool-a" }],
		});
		render(<UntriedToolsWidget />);
		expect(screen.getByText("Tool B")).toBeTruthy();
		expect(screen.queryByText("Tool A")).toBeNull();
	});

	it("shows credit cost for each tool", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [makeTool("tool-b", "Tool B", 3)],
		});
		mockUseRecentJobs.mockReturnValue({ jobs: [] });
		render(<UntriedToolsWidget />);
		expect(screen.getByText("3 credits")).toBeTruthy();
	});

	it("links to tool detail page", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [makeTool("my-tool", "My Tool")],
		});
		mockUseRecentJobs.mockReturnValue({ jobs: [] });
		render(<UntriedToolsWidget />);
		const link = screen.getByRole("link", { name: /My Tool/i });
		expect(link.getAttribute("href")).toBe("/app/tools/my-tool");
	});

	it("limits to maxTools items", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [
				makeTool("t1", "Tool 1"),
				makeTool("t2", "Tool 2"),
				makeTool("t3", "Tool 3"),
			],
		});
		mockUseRecentJobs.mockReturnValue({ jobs: [] });
		render(<UntriedToolsWidget maxTools={2} />);
		expect(screen.getByText("Tool 1")).toBeTruthy();
		expect(screen.getByText("Tool 2")).toBeTruthy();
		expect(screen.queryByText("Tool 3")).toBeNull();
	});

	it("shows see all button when more tools exist than maxTools", () => {
		mockUseTools.mockReturnValue({
			enabledTools: [
				makeTool("t1", "Tool 1"),
				makeTool("t2", "Tool 2"),
				makeTool("t3", "Tool 3"),
			],
		});
		mockUseRecentJobs.mockReturnValue({ jobs: [] });
		render(<UntriedToolsWidget maxTools={2} />);
		expect(screen.getByText(/See all untried tools/i)).toBeTruthy();
	});
});
