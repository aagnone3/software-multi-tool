import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreditForecastWidget } from "./CreditForecastWidget";

const mockUseRecentJobs = vi.fn();
const mockUseTools = vi.fn();
const mockUseCreditsBalance = vi.fn();
const mockUseActiveOrganization = vi.fn();
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: (limit: number) => mockUseRecentJobs(limit),
}));
vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => mockUseTools(),
}));
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

function wrapper({ children }: { children: React.ReactNode }) {
	const qc = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

const now = new Date();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

const baseJob = {
	id: "j1",
	toolSlug: "invoice-processor",
	status: "COMPLETED" as const,
	createdAt: twoDaysAgo.toISOString(),
	completedAt: twoDaysAgo.toISOString(),
};

const defaultTools = [{ slug: "invoice-processor", creditCost: 5 }];

const defaultBalance = {
	balance: { included: 10, totalAvailable: 10, used: 0 },
	isFreePlan: false,
	isStarterPlan: false,
};

describe("CreditForecastWidget", () => {
	beforeEach(() => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
		mockUseTools.mockReturnValue({ enabledTools: defaultTools });
		mockUseCreditsBalance.mockReturnValue(defaultBalance);
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	it("renders nothing when no jobs", () => {
		const { container } = render(<CreditForecastWidget />, { wrapper });
		expect(container.firstChild).toBeNull();
	});

	it("shows loading skeleton", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true });
		const { container } = render(<CreditForecastWidget />, { wrapper });
		expect(container.firstChild).not.toBeNull();
	});

	it("shows daily rate from recent jobs", () => {
		// 7 jobs in last 7 days, each tool costs 10 = 10/day average
		const jobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `j${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		mockUseTools.mockReturnValue({
			enabledTools: [{ slug: "invoice-processor", creditCost: 10 }],
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(screen.getByText("Credit Forecast")).toBeInTheDocument();
		expect(screen.getByText("credits/day average")).toBeInTheDocument();
		expect(screen.getByText("10")).toBeInTheDocument();
	});

	it("shows 7-day and 30-day forecast", () => {
		const jobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `j${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		render(<CreditForecastWidget />, { wrapper });
		expect(screen.getByText("Next 7 days")).toBeInTheDocument();
		expect(screen.getByText("Next 30 days")).toBeInTheDocument();
	});

	it("shows trend badge when previous week has data", () => {
		const recentJobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `r${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		const prevJobs = Array.from({ length: 3 }, (_, i) => ({
			...baseJob,
			id: `p${i}`,
			completedAt: tenDaysAgo.toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({
			jobs: [...recentJobs, ...prevJobs],
			isLoading: false,
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(screen.getByText(/vs last week/)).toBeInTheDocument();
	});

	it("renders nothing when only non-COMPLETED jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [{ ...baseJob, status: "FAILED" }],
			isLoading: false,
		});
		const { container } = render(<CreditForecastWidget />, { wrapper });
		expect(container.firstChild).toBeNull();
	});

	it("shows upgrade nudge for free plan user on track to exceed credits", () => {
		// 7 jobs in 7 days at 5 credits each = 5/day = 150/30 days, but only 10 credits remaining
		const jobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `j${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		mockUseCreditsBalance.mockReturnValue({
			balance: { included: 10, totalAvailable: 10, used: 0 },
			isFreePlan: true,
			isStarterPlan: false,
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(screen.getByTestId("credit-forecast-nudge")).toBeInTheDocument();
		expect(
			screen.getByTestId("credit-forecast-nudge-cta"),
		).toHaveTextContent("Get more credits");
	});

	it("shows upgrade nudge for starter plan user on track to exceed credits", () => {
		const jobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `j${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		mockUseCreditsBalance.mockReturnValue({
			balance: { included: 100, totalAvailable: 50, used: 50 },
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(screen.getByTestId("credit-forecast-nudge")).toBeInTheDocument();
		expect(
			screen.getByTestId("credit-forecast-nudge-cta"),
		).toHaveTextContent("Upgrade to Pro");
	});

	it("does not show upgrade nudge when forecast is within remaining credits", () => {
		// Only 1 job in 7 days = ~0.14/day = ~4/30 days, well within 100 remaining
		mockUseRecentJobs.mockReturnValue({
			jobs: [baseJob],
			isLoading: false,
		});
		mockUseCreditsBalance.mockReturnValue({
			balance: { included: 100, totalAvailable: 100, used: 0 },
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(
			screen.queryByTestId("credit-forecast-nudge"),
		).not.toBeInTheDocument();
	});

	it("does not show upgrade nudge for Pro users even if forecast exceeds credits", () => {
		const jobs = Array.from({ length: 7 }, (_, i) => ({
			...baseJob,
			id: `j${i}`,
			completedAt: new Date(
				now.getTime() - i * 24 * 60 * 60 * 1000,
			).toISOString(),
		}));
		mockUseRecentJobs.mockReturnValue({ jobs, isLoading: false });
		mockUseCreditsBalance.mockReturnValue({
			balance: { included: 500, totalAvailable: 10, used: 490 },
			isFreePlan: false,
			isStarterPlan: false, // Pro user
		});
		render(<CreditForecastWidget />, { wrapper });
		expect(
			screen.queryByTestId("credit-forecast-nudge"),
		).not.toBeInTheDocument();
	});
});
