import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecommendedToolWidget } from "./RecommendedToolWidget";

const useToolsMock = vi.hoisted(() => vi.fn());
const useActiveOrganizationMock = vi.hoisted(() => vi.fn());
const useJobsListMock = vi.hoisted(() => vi.fn());

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: useToolsMock,
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: useActiveOrganizationMock,
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: useJobsListMock,
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => React.createElement("a", { href, ...props }, children),
}));

const mockTools = [
	{
		slug: "invoice-processor",
		name: "Invoice Processor",
		description: "Process invoices automatically",
		icon: "receipt",
		status: "enabled" as const,
		comingSoon: false,
	},
	{
		slug: "news-analyzer",
		name: "News Analyzer",
		description: "Analyze news articles",
		icon: "newspaper",
		status: "enabled" as const,
		comingSoon: false,
	},
];

describe("RecommendedToolWidget", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		useActiveOrganizationMock.mockReturnValue({ activeOrganization: null });
		useJobsListMock.mockReturnValue({ jobs: [] });
	});

	it("renders loading state before client hydration", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		const { container } = render(<RecommendedToolWidget />);
		expect(container).toBeTruthy();
	});

	it("renders no-tools state when enabledTools is empty", () => {
		useToolsMock.mockReturnValue({ enabledTools: [] });
		render(<RecommendedToolWidget />);
		expect(screen.getByText("No tools available yet")).toBeInTheDocument();
	});

	it("renders current tool card when tools are available", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		render(<RecommendedToolWidget />);
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(
			screen.getByText("Process invoices automatically"),
		).toBeInTheDocument();
	});

	it("renders Try it link pointing to tool slug", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		render(<RecommendedToolWidget />);
		const link = screen.getByRole("link", { name: /try it/i });
		expect(link).toHaveAttribute("href", "/app/tools/invoice-processor");
	});

	it("uses org-scoped path when activeOrganization is present", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: { slug: "acme" },
		});
		render(<RecommendedToolWidget />);
		const link = screen.getByRole("link", { name: /try it/i });
		expect(link).toHaveAttribute(
			"href",
			"/app/acme/tools/invoice-processor",
		);
	});

	it("rotates to next tool when refresh button is clicked", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		render(<RecommendedToolWidget />);
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();

		const refreshBtn = screen.getByRole("button", {
			name: /show another tool/i,
		});
		fireEvent.click(refreshBtn);

		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});

	it("persists tool index to localStorage on rotate", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		render(<RecommendedToolWidget />);
		const refreshBtn = screen.getByRole("button", {
			name: /show another tool/i,
		});
		fireEvent.click(refreshBtn);
		expect(localStorage.getItem("recommended-tool-index")).toBe("1");
	});

	it("wraps around to first tool when past end of list", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		render(<RecommendedToolWidget />);
		const refreshBtn = screen.getByRole("button", {
			name: /show another tool/i,
		});
		fireEvent.click(refreshBtn); // -> index 1
		fireEvent.click(refreshBtn); // -> index 0
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
	});

	it("shows untried badge and description for tools with no job history", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		// No jobs for any tool
		useJobsListMock.mockReturnValue({ jobs: [] });
		render(<RecommendedToolWidget />);
		expect(
			screen.getByText("You haven't tried this yet"),
		).toBeInTheDocument();
		expect(screen.getByLabelText("New to you")).toBeInTheDocument();
	});

	it("shows generic description for tools already tried", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		// Both tools have been used
		useJobsListMock.mockReturnValue({
			jobs: [
				{ toolSlug: "invoice-processor", status: "COMPLETED" },
				{ toolSlug: "news-analyzer", status: "COMPLETED" },
			],
		});
		render(<RecommendedToolWidget />);
		expect(screen.getByText("Try something new")).toBeInTheDocument();
	});

	it("prioritizes untried tools first", () => {
		useToolsMock.mockReturnValue({ enabledTools: mockTools });
		// invoice-processor has been used, news-analyzer hasn't
		useJobsListMock.mockReturnValue({
			jobs: [{ toolSlug: "invoice-processor", status: "COMPLETED" }],
		});
		render(<RecommendedToolWidget />);
		// news-analyzer (untried) should appear first
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
	});
});
