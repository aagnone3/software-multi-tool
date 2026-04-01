import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProTrialOfferCard } from "./ProTrialOfferCard";

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(),
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
import { useActiveOrganization } from "@saas/organizations/hooks/use-active-organization";

const mockUseCreditsBalance = useCreditsBalance as ReturnType<typeof vi.fn>;
const mockUseActiveOrganization = useActiveOrganization as ReturnType<
	typeof vi.fn
>;

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ProTrialOfferCard", () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	it("renders for free plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		render(<ProTrialOfferCard />);
		expect(screen.getByTestId("pro-trial-offer-card")).toBeInTheDocument();
		expect(screen.getByText("Try Pro free for 7 days")).toBeInTheDocument();
	});

	it("does not render for paid plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});

		render(<ProTrialOfferCard />);
		expect(
			screen.queryByTestId("pro-trial-offer-card"),
		).not.toBeInTheDocument();
	});

	it("does not render while loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: true,
		});

		render(<ProTrialOfferCard />);
		expect(
			screen.queryByTestId("pro-trial-offer-card"),
		).not.toBeInTheDocument();
	});

	it("dismisses when X is clicked and persists to localStorage", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		render(<ProTrialOfferCard />);
		expect(screen.getByTestId("pro-trial-offer-card")).toBeInTheDocument();

		fireEvent.click(screen.getByTestId("dismiss-button"));
		expect(
			screen.queryByTestId("pro-trial-offer-card"),
		).not.toBeInTheDocument();
		expect(localStorageMock.getItem("pro-trial-offer-dismissed")).toBe(
			"true",
		);
	});

	it("does not render if previously dismissed", () => {
		localStorageMock.setItem("pro-trial-offer-dismissed", "true");
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		render(<ProTrialOfferCard />);
		expect(
			screen.queryByTestId("pro-trial-offer-card"),
		).not.toBeInTheDocument();
	});

	it("shows all trial features", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		render(<ProTrialOfferCard />);
		expect(
			screen.getByText("500 credits included — no card required"),
		).toBeInTheDocument();
		expect(screen.getByText("Priority job processing")).toBeInTheDocument();
		expect(
			screen.getByText("Unlimited tool access for 7 days"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Cancel anytime, no commitment"),
		).toBeInTheDocument();
	});

	it("links to org billing path when active org exists", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-team" },
		});

		render(<ProTrialOfferCard />);
		const startLink = screen.getByText("Start free trial").closest("a");
		expect(startLink).toHaveAttribute(
			"href",
			"/app/my-team/settings/billing",
		);
	});

	it("links to personal billing when no org", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });

		render(<ProTrialOfferCard />);
		const startLink = screen.getByText("Start free trial").closest("a");
		expect(startLink).toHaveAttribute("href", "/app/settings/billing");
	});

	it("shows Starter→Pro upgrade card when on starter plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: true,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });

		render(<ProTrialOfferCard />);
		expect(screen.getByTestId("pro-trial-offer-card")).toBeInTheDocument();
		expect(
			screen.getByText("Upgrade to Pro — unlock the full toolkit"),
		).toBeInTheDocument();
		expect(
			screen.getByText("500 credits/month — 5× more than Starter"),
		).toBeInTheDocument();
	});

	it("shows 'Upgrade to Pro' CTA and 'Compare plans' link for starter users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: true,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });

		render(<ProTrialOfferCard />);
		const upgradeLink = screen.getByText("Upgrade to Pro").closest("a");
		expect(upgradeLink).toHaveAttribute("href", "/app/settings/billing");
		const compareLink = screen.getByText("Compare plans").closest("a");
		expect(compareLink).toHaveAttribute(
			"href",
			"/pricing#pricing-plan-pro",
		);
	});

	it("hides card for non-free non-starter users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });

		render(<ProTrialOfferCard />);
		expect(screen.queryByTestId("pro-trial-offer-card")).toBeNull();
	});
});
