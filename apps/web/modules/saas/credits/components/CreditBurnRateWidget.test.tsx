import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditBurnRateWidget } from "./CreditBurnRateWidget";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObj = Record<string, any>;

const mockUseCreditsBalance = vi.fn();
const mockUseJobsList = vi.fn();

vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));
vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: (_toolSlug?: string, _limit?: number) => mockUseJobsList(),
}));
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

function makeJob(
	status: string,
	daysAgo: number,
): { status: string; createdAt: string } {
	const d = new Date();
	d.setDate(d.getDate() - daysAgo);
	return { status, createdAt: d.toISOString() };
}

describe("CreditBurnRateWidget", () => {
	it("shows loading skeletons while data is loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: undefined,
			isLoading: true,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as AnyObj);

		const { container } = render(<CreditBurnRateWidget />);
		expect(
			container.querySelector(".animate-pulse, [class*='skeleton']"),
		).toBeTruthy();
	});

	it("returns null when no jobs this week", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 500,
			isLoading: false,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as AnyObj);

		const { container } = render(<CreditBurnRateWidget />);
		expect(container.firstChild).toBeNull();
	});

	it("shows daily burn rate with recent jobs", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 500,
			isLoading: false,
		} as AnyObj);
		// 7 completed jobs this week = 70 credits / 7 days = 10/day
		mockUseJobsList.mockReturnValue({
			jobs: [
				makeJob("COMPLETED", 0),
				makeJob("COMPLETED", 1),
				makeJob("COMPLETED", 2),
				makeJob("COMPLETED", 3),
				makeJob("COMPLETED", 4),
				makeJob("COMPLETED", 5),
				makeJob("COMPLETED", 6),
			],
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		expect(screen.getByText("credits/day")).toBeInTheDocument();
		expect(screen.getByText("Burn Rate")).toBeInTheDocument();
	});

	it("shows low balance warning when fewer than 7 days of credits remain", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 30,
			isLoading: false,
		} as AnyObj);
		// 7 jobs/week = 70 credits/week = 10/day; 30 credits / 10/day = 3 days remaining
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 7 }, (_, i) => makeJob("COMPLETED", i)),
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		expect(screen.getByText("Low balance")).toBeInTheDocument();
	});

	it("shows days remaining estimate", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 700,
			isLoading: false,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 7 }, (_, i) => makeJob("COMPLETED", i)),
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		expect(screen.getByText(/will last approximately/)).toBeInTheDocument();
	});

	it("shows buy credits link for Pro users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 500,
			isLoading: false,
			isStarterPlan: false,
			isFreePlan: false,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob("COMPLETED", 0)],
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		const link = screen.getByRole("link", { name: /buy more credits/i });
		expect(link).toHaveAttribute("href", "/app/settings/billing");
	});

	it("shows Upgrade to Pro CTA for Starter users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 100,
			isLoading: false,
			isStarterPlan: true,
			isFreePlan: false,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob("COMPLETED", 0)],
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		const upgradeLink = screen.getByRole("link", {
			name: /upgrade to pro/i,
		});
		expect(upgradeLink).toHaveAttribute(
			"href",
			"/app/settings/billing?upgrade=pro",
		);
		const compareLink = screen.getByRole("link", {
			name: /compare plans/i,
		});
		expect(compareLink).toHaveAttribute(
			"href",
			"/pricing#pricing-plan-pro",
		);
	});

	it("shows upgrade for more credits CTA for Free users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 10,
			isLoading: false,
			isStarterPlan: false,
			isFreePlan: true,
		} as AnyObj);
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob("COMPLETED", 0)],
			isLoading: false,
		} as AnyObj);

		render(<CreditBurnRateWidget />);
		const link = screen.getByRole("link", {
			name: /upgrade for more credits/i,
		});
		expect(link).toHaveAttribute("href", "/app/settings/billing");
	});

	it("ignores non-COMPLETED jobs for burn rate calculation", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 500,
			isLoading: false,
		} as AnyObj);
		// Only FAILED/PENDING — these should not count toward burn rate
		mockUseJobsList.mockReturnValue({
			jobs: [
				makeJob("FAILED", 0),
				makeJob("PENDING", 1),
				makeJob("PROCESSING", 2),
			],
			isLoading: false,
		} as AnyObj);

		const { container } = render(<CreditBurnRateWidget />);
		expect(container.firstChild).toBeNull();
	});
});
