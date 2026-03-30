import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StickyCta } from "./StickyCta";

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
	isLoading: boolean;
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
			isLoading: false,
			balance: undefined,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("is not visible initially (scrollY = 0)", () => {
		render(<StickyCta />);
		expect(screen.queryByText(/start free/i)).toBeNull();
	});

	it("becomes visible for anonymous user (no balance) when scrollY > 400", () => {
		// anonymous: balance=undefined → not a paid user
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
			balance: undefined,
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/start free/i)).toBeTruthy();
	});

	it("becomes visible for free-plan user when scrollY > 400", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			balance: { plan: { id: "free", name: "Free" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/start free/i)).toBeTruthy();
	});

	it("is hidden for Pro (paid) user even when scrollY > 400", () => {
		// Pro: balance exists, isFreePlan=false, not loading
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
			balance: { plan: { id: "pro", name: "Pro" } },
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.queryByText(/start free/i)).toBeNull();
	});

	it("is not suppressed while plan is still loading", () => {
		// While loading we can't confirm Pro status — show the CTA
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: true,
			balance: undefined,
		});
		render(<StickyCta />);
		scrollPast400();
		expect(screen.getByText(/start free/i)).toBeTruthy();
	});

	it("contains a signup link", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
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
			isLoading: false,
			balance: { plan: { id: "free", name: "Free" } },
		});
		render(<StickyCta />);
		scrollPast400();
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		fireEvent.click(dismissBtn);
		expect(screen.queryByText(/start free/i)).toBeNull();
	});
});
