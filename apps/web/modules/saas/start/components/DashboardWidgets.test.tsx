import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js Link
vi.mock("next/link", () => ({
	default: ({ children, href }: { children: ReactNode; href: string }) =>
		React.createElement("a", { href }, children),
}));

// Mock localStorage
const localStorageMock = {
	getItem: vi.fn(),
	setItem: vi.fn(),
	clear: vi.fn(),
};
Object.defineProperty(window, "localStorage", { value: localStorageMock });

// Mock session hook
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(() => ({
		user: { id: "user-1", name: "Test User", email: "test@example.com" },
	})),
}));

// Mock active organization hook
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({
		activeOrganization: { id: "org-1", slug: "test-org", name: "Test Org" },
	})),
}));

// Mock oRPC query utils
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		credits: {
			balance: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "balance"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
			usageStats: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "usageStats"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
			history: {
				queryOptions: vi.fn(() => ({
					queryKey: ["credits", "history"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
		jobs: {
			list: {
				queryOptions: vi.fn(() => ({
					queryKey: ["jobs", "list"],
					queryFn: () => Promise.resolve(undefined),
				})),
			},
		},
	},
}));

// Import components after mocking
import { CreditsOverview } from "./CreditsOverview";
import { GettingStartedChecklist } from "./GettingStartedChecklist";
import { RecentActivityFeed } from "./RecentActivityFeed";
import { RecentlyUsedTools } from "./RecentlyUsedTools";

describe("Dashboard Widgets", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorageMock.getItem.mockReturnValue(null);
	});

	const createWrapper = (initialData: Record<string, unknown> = {}) => {
		const queryClient = new QueryClient({
			defaultOptions: {
				queries: {
					retry: false,
				},
			},
		});

		// Set initial data for queries
		if (initialData.balance) {
			queryClient.setQueryData(
				["credits", "balance"],
				initialData.balance,
			);
		}
		if (initialData.usageStats) {
			queryClient.setQueryData(
				["credits", "usageStats"],
				initialData.usageStats,
			);
		}
		if (initialData.history) {
			queryClient.setQueryData(
				["credits", "history"],
				initialData.history,
			);
		}
		if (initialData.jobs) {
			queryClient.setQueryData(["jobs", "list"], initialData.jobs);
		}

		return ({ children }: { children: ReactNode }) =>
			React.createElement(
				QueryClientProvider,
				{ client: queryClient },
				children,
			);
	};

	describe("GettingStartedChecklist", () => {
		it("renders checklist when not dismissed", () => {
			localStorageMock.getItem.mockReturnValue(null);

			render(React.createElement(GettingStartedChecklist), {
				wrapper: createWrapper({
					usageStats: {
						totalUsed: 0,
						totalOverage: 0,
						byTool: [],
						byPeriod: [],
					},
				}),
			});

			expect(screen.getByText("Getting Started")).toBeInTheDocument();
		});

		it("does not render when dismissed", () => {
			localStorageMock.getItem.mockReturnValue("true");

			render(React.createElement(GettingStartedChecklist), {
				wrapper: createWrapper({
					usageStats: {
						totalUsed: 0,
						totalOverage: 0,
						byTool: [],
						byPeriod: [],
					},
				}),
			});

			expect(
				screen.queryByText("Getting Started"),
			).not.toBeInTheDocument();
		});

		it("shows complete profile step as complete when user has name", () => {
			render(React.createElement(GettingStartedChecklist), {
				wrapper: createWrapper({
					usageStats: {
						totalUsed: 0,
						totalOverage: 0,
						byTool: [],
						byPeriod: [],
					},
				}),
			});

			expect(
				screen.getByText("Complete your profile"),
			).toBeInTheDocument();
		});
	});

	describe("CreditsOverview", () => {
		it("renders credit balance when loaded", () => {
			const mockBalance = {
				included: 100,
				used: 25,
				remaining: 75,
				overage: 0,
				purchasedCredits: 0,
				totalAvailable: 75,
				periodStart: "2025-01-01T00:00:00.000Z",
				periodEnd: "2025-02-01T00:00:00.000Z",
				plan: { id: "pro", name: "Pro" },
			};

			render(React.createElement(CreditsOverview), {
				wrapper: createWrapper({
					balance: mockBalance,
					usageStats: {
						totalUsed: 25,
						totalOverage: 0,
						byTool: [],
						byPeriod: [],
					},
				}),
			});

			expect(screen.getByText("Credits")).toBeInTheDocument();
			expect(screen.getByText("75")).toBeInTheDocument(); // totalAvailable
			expect(screen.getByText("Pro plan")).toBeInTheDocument();
		});

		it("shows low balance warning when credits are low", () => {
			const mockBalance = {
				included: 100,
				used: 90,
				remaining: 10,
				overage: 0,
				purchasedCredits: 0,
				totalAvailable: 10,
				periodStart: "2025-01-01T00:00:00.000Z",
				periodEnd: "2025-02-01T00:00:00.000Z",
				plan: { id: "pro", name: "Pro" },
			};

			render(React.createElement(CreditsOverview), {
				wrapper: createWrapper({
					balance: mockBalance,
					usageStats: {
						totalUsed: 90,
						totalOverage: 0,
						byTool: [],
						byPeriod: [],
					},
				}),
			});

			expect(screen.getByText("Low balance")).toBeInTheDocument();
		});
	});

	describe("RecentlyUsedTools", () => {
		it("shows empty state when no jobs", () => {
			render(React.createElement(RecentlyUsedTools), {
				wrapper: createWrapper({ jobs: { jobs: [] } }),
			});

			expect(screen.getByText("Recently Used")).toBeInTheDocument();
			expect(screen.getByText("No tools used yet")).toBeInTheDocument();
		});

		it("renders recent tools when jobs exist", () => {
			const mockJobs = {
				jobs: [
					{
						id: "1",
						toolSlug: "news-analyzer",
						status: "COMPLETED",
						createdAt: new Date().toISOString(),
						completedAt: new Date().toISOString(),
					},
				],
			};

			render(React.createElement(RecentlyUsedTools), {
				wrapper: createWrapper({ jobs: mockJobs }),
			});

			expect(screen.getByText("Recently Used")).toBeInTheDocument();
			expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		});
	});

	describe("RecentActivityFeed", () => {
		it("shows empty state when no transactions", () => {
			render(React.createElement(RecentActivityFeed), {
				wrapper: createWrapper({
					history: {
						transactions: [],
						pagination: {
							total: 0,
							limit: 5,
							offset: 0,
							hasMore: false,
						},
					},
				}),
			});

			expect(screen.getByText("Recent Activity")).toBeInTheDocument();
			expect(screen.getByText("No activity yet")).toBeInTheDocument();
		});

		it("renders transactions when they exist", () => {
			const mockHistory = {
				transactions: [
					{
						id: "1",
						amount: 5,
						type: "USAGE",
						toolSlug: "bg-remover",
						jobId: "job-1",
						description: null,
						createdAt: new Date().toISOString(),
					},
				],
				pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
			};

			render(React.createElement(RecentActivityFeed), {
				wrapper: createWrapper({ history: mockHistory }),
			});

			expect(screen.getByText("Recent Activity")).toBeInTheDocument();
			expect(
				screen.getByText("Used Background Remover"),
			).toBeInTheDocument();
		});

		it("shows positive amounts for grants and purchases", () => {
			const mockHistory = {
				transactions: [
					{
						id: "1",
						amount: 100,
						type: "GRANT",
						toolSlug: null,
						jobId: null,
						description: null,
						createdAt: new Date().toISOString(),
					},
				],
				pagination: { total: 1, limit: 5, offset: 0, hasMore: false },
			};

			render(React.createElement(RecentActivityFeed), {
				wrapper: createWrapper({ history: mockHistory }),
			});

			expect(screen.getByText("+100")).toBeInTheDocument();
		});
	});
});
