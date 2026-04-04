import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
const mockUseCreditsBalance = vi.fn();
const mockUseJobsList = vi.fn();
const mockUseActiveOrganization = vi.fn();
const mockTrack = vi.fn();

vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: () => mockUseJobsList(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: React.MouseEventHandler;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

import { CreditRunwayBanner } from "./CreditRunwayBanner";

function makeJob(daysAgo: number) {
	const d = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
	return { status: "COMPLETED", createdAt: d.toISOString() };
}

describe("CreditRunwayBanner", () => {
	beforeEach(() => {
		localStorage.clear();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});
	afterEach(() => {
		cleanup();
		vi.restoreAllMocks();
	});

	it("renders nothing when loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: null,
			isLoading: true,
		});
		mockUseJobsList.mockReturnValue({ jobs: [], isLoading: true });
		render(<CreditRunwayBanner />);
		expect(screen.queryByRole("link")).toBeNull();
	});

	it("renders nothing when burn rate is zero (no jobs)", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 100,
			isLoading: false,
		});
		mockUseJobsList.mockReturnValue({ jobs: [], isLoading: false });
		render(<CreditRunwayBanner />);
		expect(screen.queryByText(/Buy Credits/i)).toBeNull();
	});

	it("renders nothing when days remaining >= 3", () => {
		// 70 credits, 10 per job, 1 job/week => dailyBurnRate = 10/7 ~1.43, daysRemaining = 70/1.43 = ~49
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 70,
			isLoading: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [makeJob(1)],
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		expect(screen.queryByText(/Buy Credits/i)).toBeNull();
	});

	it("renders banner when days remaining < 3", () => {
		// 15 credits, 10 per job, 7 jobs this week => dailyBurnRate = 70/7 = 10, daysRemaining = 15/10 = 1.5
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 15,
			isLoading: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		expect(screen.getByText(/your credits will run out in/i)).toBeDefined();
		expect(
			screen.getByRole("link", { name: /Buy Credits/i }),
		).toBeDefined();
	});

	it("shows correct billing href with active org", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-org" },
		});
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		const link = screen.getByRole("link", { name: /Buy Credits/i });
		expect((link as HTMLAnchorElement).href).toContain(
			"/app/my-org/settings/billing",
		);
	});

	it("dismisses banner when X is clicked", async () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		const user = userEvent.setup({ delay: null });
		render(<CreditRunwayBanner />);
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		await user.click(dismissBtn);
		expect(screen.queryByText(/your credits will run out in/i)).toBeNull();
	});

	it("shows Upgrade to Pro CTA for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		expect(
			screen.getByRole("link", { name: /Upgrade to Pro/i }),
		).toBeDefined();
		expect(
			screen.getByRole("link", { name: /Compare plans/i }),
		).toBeDefined();
		expect(screen.queryByRole("link", { name: /Buy Credits/i })).toBeNull();
	});

	it("shows 5× credits hint for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		expect(screen.getByText(/5× more credits/i)).toBeDefined();
	});

	it("shows Buy Credits CTA for free plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		expect(
			screen.getByRole("link", { name: /Buy Credits/i }),
		).toBeDefined();
		expect(
			screen.queryByRole("link", { name: /Upgrade to Pro/i }),
		).toBeNull();
	});

	it("Upgrade to Pro links to billing settings for Starter with org", () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-org" },
		});
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		render(<CreditRunwayBanner />);
		const link = screen.getByRole("link", { name: /Upgrade to Pro/i });
		expect((link as HTMLAnchorElement).href).toContain(
			"/app/my-org/settings/billing",
		);
	});

	it("tracks upgrade click for Starter plan", async () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		const user = userEvent.setup({ delay: null });
		render(<CreditRunwayBanner />);
		await user.click(screen.getByRole("link", { name: /Upgrade to Pro/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_runway_banner_upgrade_clicked",
			props: { plan: "starter" },
		});
	});

	it("tracks compare plans click for Starter plan", async () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		const user = userEvent.setup({ delay: null });
		render(<CreditRunwayBanner />);
		await user.click(screen.getByRole("link", { name: /Compare plans/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_runway_banner_compare_plans_clicked",
			props: {},
		});
	});

	it("tracks buy credits click for free plan", async () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		const user = userEvent.setup({ delay: null });
		render(<CreditRunwayBanner />);
		await user.click(screen.getByRole("link", { name: /Buy Credits/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_runway_banner_buy_credits_clicked",
			props: {},
		});
	});

	it("tracks dismiss click", async () => {
		mockUseCreditsBalance.mockReturnValue({
			totalCredits: 5,
			isLoading: false,
			isStarterPlan: false,
		});
		mockUseJobsList.mockReturnValue({
			jobs: [0, 1, 2, 3, 4, 5, 6].map((d) => makeJob(d)),
			isLoading: false,
		});
		const user = userEvent.setup({ delay: null });
		render(<CreditRunwayBanner />);
		await user.click(screen.getByRole("button", { name: /dismiss/i }));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "credit_runway_banner_dismissed",
			props: {},
		});
	});
});
