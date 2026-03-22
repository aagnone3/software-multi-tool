import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RecentlyUsedTools } from "./RecentlyUsedTools";

// Mock hooks
const useRecentJobsMock = vi.hoisted(() => vi.fn());
const useToolsMock = vi.hoisted(() => vi.fn());

vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: useRecentJobsMock,
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: useToolsMock,
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

const mockEnabledTools = [
	{
		slug: "news-analyzer",
		name: "News Analyzer",
		icon: "newspaper",
		description: "Analyze news",
		href: "/app/tools/news-analyzer",
		isComingSoon: false,
	},
	{
		slug: "invoice-processor",
		name: "Invoice Processor",
		icon: "receipt",
		description: "Process invoices",
		href: "/app/tools/invoice-processor",
		isComingSoon: false,
	},
];

function createWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}

describe("RecentlyUsedTools", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useToolsMock.mockReturnValue({ enabledTools: mockEnabledTools });
	});

	it("renders loading skeleton when isLoading=true", () => {
		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			isLoading: true,
		});

		render(<RecentlyUsedTools />, { wrapper: createWrapper() });

		expect(screen.getByText("Recently Used")).toBeInTheDocument();
		expect(screen.getByText("Loading...")).toBeInTheDocument();
	});

	it("renders empty state when no recent jobs", () => {
		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: [],
			recentToolsMap: new Map(),
			isLoading: false,
		});

		render(<RecentlyUsedTools />, { wrapper: createWrapper() });

		expect(screen.getByText("No tools used yet")).toBeInTheDocument();
		expect(screen.getByText("Explore tools")).toBeInTheDocument();
	});

	it("renders recent tools when jobs exist", () => {
		const recentToolsMap = new Map([
			[
				"news-analyzer",
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
					completedAt: null,
				},
			],
			[
				"invoice-processor",
				{
					id: "job-2",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 86400000).toISOString(),
					completedAt: null,
				},
			],
		]);

		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: ["news-analyzer", "invoice-processor"],
			recentToolsMap,
			isLoading: false,
		});

		render(<RecentlyUsedTools />, { wrapper: createWrapper() });

		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("View all tools")).toBeInTheDocument();
	});

	it("respects maxTools limit", () => {
		const recentToolsMap = new Map([
			[
				"news-analyzer",
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 60000).toISOString(),
					completedAt: null,
				},
			],
			[
				"invoice-processor",
				{
					id: "job-2",
					toolSlug: "invoice-processor",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 60000).toISOString(),
					completedAt: null,
				},
			],
		]);

		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: ["news-analyzer", "invoice-processor"],
			recentToolsMap,
			isLoading: false,
		});

		render(<RecentlyUsedTools maxTools={1} />, {
			wrapper: createWrapper(),
		});

		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.queryByText("Invoice Processor")).not.toBeInTheDocument();
	});

	it("skips tools not in enabledTools list", () => {
		useToolsMock.mockReturnValue({ enabledTools: [] });

		const recentToolsMap = new Map([
			[
				"news-analyzer",
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date().toISOString(),
					completedAt: null,
				},
			],
		]);

		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: ["news-analyzer"],
			recentToolsMap,
			isLoading: false,
		});

		render(<RecentlyUsedTools />, { wrapper: createWrapper() });

		// Should show empty state since tool not in enabledTools
		expect(screen.getByText("No tools used yet")).toBeInTheDocument();
	});

	it("shows relative time for recent jobs", () => {
		const recentToolsMap = new Map([
			[
				"news-analyzer",
				{
					id: "job-1",
					toolSlug: "news-analyzer",
					status: "COMPLETED",
					createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
					completedAt: null,
				},
			],
		]);

		useRecentJobsMock.mockReturnValue({
			recentToolSlugs: ["news-analyzer"],
			recentToolsMap,
			isLoading: false,
		});

		render(<RecentlyUsedTools />, { wrapper: createWrapper() });

		expect(screen.getByText("30m ago")).toBeInTheDocument();
	});
});
