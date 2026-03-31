import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobUpgradeNudge } from "./PostJobUpgradeNudge";

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

type CreditsBalanceMock = {
	balance: { totalAvailable: number } | undefined;
	isLoading: boolean;
	isFreePlan: boolean;
	isStarterPlan: boolean;
	isLowCredits: boolean;
};

type ActiveOrgMock = {
	activeOrganization: { slug: string } | null;
};

const mockUseCreditsBalance = vi.fn<() => CreditsBalanceMock>();
const mockUseActiveOrganization = vi.fn<() => ActiveOrgMock>();

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

/** Advances fake timers so the 600ms delay elapses */
async function advancePast600ms() {
	await act(async () => {
		vi.advanceTimersByTime(700);
	});
}

describe("PostJobUpgradeNudge", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	afterEach(() => {
		vi.useRealTimers();
		vi.restoreAllMocks();
	});

	it("renders nothing before the 600ms delay elapses", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 2 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("renders nothing while loading", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: undefined,
			isLoading: true,
			isFreePlan: false,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("renders nothing for Pro users with sufficient credits", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 100 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("shows upgrade prompt for free-plan users after delay", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 8 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(
			screen.getByRole("complementary", { name: /upgrade prompt/i }),
		).toBeTruthy();
		expect(screen.getByText(/you're on the free plan/i)).toBeTruthy();
	});

	it("shows urgent message when free-plan user has ≤3 credits", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 2 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(screen.getByText(/only 2 credits left/i)).toBeTruthy();
	});

	it("shows generic message when free-plan user has >3 credits", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 7 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(
			screen.getByText(/upgrade to pro for 500 credits/i),
		).toBeTruthy();
	});

	it("shows low-credits prompt for paid users with low credits", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 5 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: false,
			isLowCredits: true,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(
			screen.getByRole("complementary", { name: /low credits prompt/i }),
		).toBeTruthy();
		expect(screen.getByText(/running low on credits/i)).toBeTruthy();
	});

	it("uses org-scoped billing path when activeOrganization is set", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 8 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "acme" },
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		const upgradeLink = screen.getAllByRole("link")[0] as HTMLAnchorElement;
		expect(upgradeLink.href).toContain("/app/acme/settings/billing");
	});

	it("uses default billing path when no activeOrganization", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 8 },
			isLoading: false,
			isFreePlan: true,
			isStarterPlan: false,
			isLowCredits: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: null,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		const upgradeLink = screen.getAllByRole("link")[0] as HTMLAnchorElement;
		expect(upgradeLink.href).toContain("/app/settings/billing");
	});

	it("shows Starter upgrade prompt for starter-plan users after delay", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 50 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: true,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(
			screen.getByRole("complementary", {
				name: /starter upgrade prompt/i,
			}),
		).toBeTruthy();
		expect(screen.getByText(/you're on the starter plan/i)).toBeTruthy();
	});

	it("shows Starter→Pro value copy with Pro features", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 50 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: true,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(screen.getByText(/scheduled runs, bulk actions/i)).toBeTruthy();
	});

	it("shows Compare plans CTA for Starter users", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 50 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: true,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(
			screen.getByRole("link", { name: /compare plans/i }),
		).toBeTruthy();
	});

	it("hides nudge for Starter users with sufficient credits and not low", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { totalAvailable: 200 },
			isLoading: false,
			isFreePlan: false,
			isStarterPlan: false,
			isLowCredits: false,
		});
		render(<PostJobUpgradeNudge />);
		await advancePast600ms();
		expect(screen.queryByRole("complementary")).toBeNull();
	});
});
