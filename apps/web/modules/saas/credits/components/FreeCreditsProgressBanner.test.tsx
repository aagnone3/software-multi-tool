import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockBalance = {
	included: 10,
	used: 3,
	remaining: 7,
	overage: 0,
	purchasedCredits: 0,
	totalAvailable: 7,
	periodStart: "2026-01-01",
	periodEnd: "2026-02-01",
	plan: { id: "free", name: "Free" },
	purchases: [],
};

const mockUseCreditsBalance = vi.fn();
const mockUseActiveOrganization = vi.fn();

vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

import { FreeCreditsProgressBanner } from "./FreeCreditsProgressBanner";

describe("FreeCreditsProgressBanner", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	it("renders nothing when loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: true,
			balance: null,
			isFreePlan: false,
		});
		const { container } = render(<FreeCreditsProgressBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when not on free plan", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockBalance, plan: { id: "pro", name: "Pro" } },
			isFreePlan: false,
		});
		const { container } = render(<FreeCreditsProgressBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when 0 credits used", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockBalance, used: 0 },
			isFreePlan: true,
		});
		const { container } = render(<FreeCreditsProgressBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("shows credit usage message for free plan user", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockBalance,
			isFreePlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByText(/3 of 10 free credits used/i),
		).toBeInTheDocument();
	});

	it("shows high urgency message when >80% used", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockBalance, used: 9, remaining: 1 },
			isFreePlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByText(/Only 1 free credit left/i),
		).toBeInTheDocument();
	});

	it("shows zero credits message when all used", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockBalance, used: 10, remaining: 0 },
			isFreePlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByText(/You've used all your free credits/i),
		).toBeInTheDocument();
	});

	it("shows upgrade link", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockBalance,
			isFreePlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		const link = screen.getByRole("link", { name: /upgrade for more/i });
		expect(link).toHaveAttribute("href", "/app/settings/billing");
	});

	it("uses org-scoped billing path when org is active", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockBalance,
			isFreePlan: true,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "acme" },
		});
		render(<FreeCreditsProgressBanner />);
		const link = screen.getByRole("link", { name: /upgrade for more/i });
		expect(link).toHaveAttribute("href", "/app/acme/settings/billing");
	});

	it("can be dismissed on low urgency", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockBalance,
			isFreePlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		await userEvent.click(dismissBtn);
		expect(
			screen.queryByText(/3 of 10 free credits used/i),
		).not.toBeInTheDocument();
		expect(localStorage.getItem("free-credits-banner-dismissed")).toBe(
			"true",
		);
	});
});

const mockStarterBalance = {
	included: 100,
	used: 55,
	remaining: 45,
	overage: 0,
	purchasedCredits: 0,
	totalAvailable: 45,
	periodStart: "2026-01-01",
	periodEnd: "2026-02-01",
	plan: { id: "starter", name: "Starter" },
	purchases: [],
};

describe("FreeCreditsProgressBanner — Starter plan", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	it("renders nothing for Starter user below 50% usage", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockStarterBalance, used: 40, remaining: 60 },
			isFreePlan: false,
			isStarterPlan: true,
		});
		const { container } = render(<FreeCreditsProgressBanner />);
		expect(container.firstChild).toBeNull();
	});

	it("shows Starter banner when ≥50% credits used", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockStarterBalance,
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByTestId("starter-credits-banner"),
		).toBeInTheDocument();
	});

	it("shows Pro upgrade CTA in Starter banner", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockStarterBalance,
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		const link = screen.getByRole("link", { name: /upgrade to pro/i });
		expect(link).toHaveAttribute("href", "/app/settings/billing");
	});

	it("shows high urgency message when Starter user at >80% usage", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockStarterBalance, used: 85, remaining: 15 },
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByText(/Only 15 Starter credits left/i),
		).toBeInTheDocument();
	});

	it("shows out-of-credits message when Starter user exhausted", () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: { ...mockStarterBalance, used: 100, remaining: 0 },
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		expect(
			screen.getByText(/You've used all your Starter credits/i),
		).toBeInTheDocument();
	});

	it("can be dismissed (24h snooze) in Starter banner", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isLoading: false,
			balance: mockStarterBalance,
			isFreePlan: false,
			isStarterPlan: true,
		});
		render(<FreeCreditsProgressBanner />);
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		await userEvent.click(dismissBtn);
		expect(
			screen.queryByTestId("starter-credits-banner"),
		).not.toBeInTheDocument();
		const stored = Number(
			localStorage.getItem("starter-credits-banner-dismissed-until"),
		);
		expect(stored).toBeGreaterThan(Date.now());
	});
});
