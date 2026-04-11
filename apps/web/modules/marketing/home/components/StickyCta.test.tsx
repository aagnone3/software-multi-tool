import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickyCta } from "./StickyCta";

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));

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
	isFreePlan: boolean;
	isStarterPlan: boolean;
	isLoading: boolean;
	isError: boolean;
	balance: { plan: { id: string; name: string } } | undefined;
};

const mockUseCreditsBalance = vi.fn<() => CreditsBalanceMock>();

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

/** Helpers to reduce repetition */
function scrollPast400() {
	act(() => {
		Object.defineProperty(window, "scrollY", {
			value: 500,
			writable: true,
		});
		window.dispatchEvent(new Event("scroll"));
	});
}

describe("StickyCta", () => {
	beforeEach(() => {
		Object.defineProperty(window, "scrollY", { value: 0, writable: true });
		// Default: anonymous visitor — no balance, not loading
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: undefined,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("is not visible initially (scrollY = 0)", () => {
		render(<StickyCta />);
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
	});

	it("becomes visible for anonymous user (no balance) when scrollY > 400", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: undefined,
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/Get 10 free credits/i)).toBeTruthy();
	});

	it("becomes visible for free-plan user when scrollY > 400", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "free", name: "Free" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/Get 10 free credits/i)).toBeTruthy();
	});

	it("shows Starter→Pro upsell CTA for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: true,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "starter", name: "Starter" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/unlock scheduler/i)).toBeTruthy();
		const link = screen.getByRole("link", { name: /upgrade to pro/i });
		expect(link).toBeTruthy();
		expect((link as HTMLAnchorElement).href).toContain(
			"/app/settings/billing?upgrade=pro",
		);
	});

	it("does NOT show 'start free' copy for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: true,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "starter", name: "Starter" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
	});

	it("is hidden for Pro (paid) user even when scrollY > 400", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "pro", name: "Pro" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
		expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
	});

	it("is suppressed while plan is still loading", () => {
		// While loading we hide the CTA to avoid misleading messaging
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: true,
			isError: false,
			balance: undefined,
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
	});

	it("contains a signup link for anonymous/free users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "free", name: "Free" } },
		});
		render(<StickyCta />);
		scrollPast400();
		const link = screen.getByRole("link", { name: /get started/i });
		expect(link).toBeTruthy();
		expect((link as HTMLAnchorElement).href).toContain("/auth/signup");
	});

	it("hides when dismissed", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isStarterPlan: false,
			isLoading: false,
			isError: false,
			balance: { plan: { id: "free", name: "Free" } },
		});
		render(<StickyCta />);
		scrollPast400();
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		fireEvent.click(dismissBtn);
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
	});

	it("hides when credits balance fetch fails", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isStarterPlan: false,
			isLoading: false,
			isError: true,
			balance: undefined,
		});
		render(<StickyCta />);
		// Should not show CTA at all, regardless of scroll
		scrollPast400();
		expect(screen.queryByText(/Get 10 free credits/i)).toBeNull();
		expect(screen.queryByText(/upgrade to pro/i)).toBeNull();
	});
});
