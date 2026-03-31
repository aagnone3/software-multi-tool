import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { UpgradeGate } from "./UpgradeGate";

// ---- module mocks ----
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({ activeOrganization: null })),
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

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";

const mockUseCreditsBalance = useCreditsBalance as ReturnType<typeof vi.fn>;

describe("UpgradeGate", () => {
	it("renders children directly when user is on a paid plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
		});

		render(
			<UpgradeGate featureName="Bulk Export">
				<button type="button">Export All</button>
			</UpgradeGate>,
		);

		expect(
			screen.getByRole("button", { name: "Export All" }),
		).toBeVisible();
		expect(screen.queryByText(/Upgrade to unlock/)).not.toBeInTheDocument();
	});

	it("shows blurred overlay with upgrade prompt when user is on free plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
		});

		render(
			<UpgradeGate featureName="Bulk Export">
				<button type="button">Export All</button>
			</UpgradeGate>,
		);

		expect(
			screen.getByText("Upgrade to unlock Bulk Export"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Upgrade to Pro/ }),
		).toHaveAttribute("href", "/app/settings/billing");
		expect(
			screen.getByRole("link", { name: "View plans" }),
		).toHaveAttribute("href", "/pricing");
	});

	it("shows description text when provided", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
		});

		render(
			<UpgradeGate
				featureName="Bulk Export"
				description="Export all your jobs at once"
			>
				<div>content</div>
			</UpgradeGate>,
		);

		expect(
			screen.getByText("Export all your jobs at once"),
		).toBeInTheDocument();
	});

	it("renders children when hasAccess=true regardless of plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
		});

		render(
			<UpgradeGate featureName="Bulk Export" hasAccess={true}>
				<button type="button">Export All</button>
			</UpgradeGate>,
		);

		expect(screen.queryByText(/Upgrade to unlock/)).not.toBeInTheDocument();
	});

	it("shows lock when hasAccess=false regardless of plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,

			isLoading: false,
		});

		render(
			<UpgradeGate featureName="Advanced Analytics" hasAccess={false}>
				<div>chart</div>
			</UpgradeGate>,
		);

		expect(
			screen.getByText("Upgrade to unlock Advanced Analytics"),
		).toBeInTheDocument();
	});

	it("shows Starter-specific copy when Starter user is locked via hasAccess=false", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: true,

			isLoading: false,
		});

		render(
			<UpgradeGate featureName="Advanced Analytics" hasAccess={false}>
				<div>chart</div>
			</UpgradeGate>,
		);

		expect(
			screen.getByText("Upgrade to Pro to unlock Advanced Analytics"),
		).toBeInTheDocument();
		expect(
			screen.getByText("This feature is exclusive to the Pro plan."),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Compare plans" }),
		).toHaveAttribute("href", "/pricing#pricing-plan-pro");
	});

	it("does not show overlay while loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: true,
		});

		render(
			<UpgradeGate featureName="Bulk Export">
				<button type="button">Export All</button>
			</UpgradeGate>,
		);

		expect(screen.queryByText(/Upgrade to unlock/)).not.toBeInTheDocument();
	});
});
