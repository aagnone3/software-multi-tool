// @ts-nocheck
import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { JobResultsUpgradeNudge } from "./JobResultsUpgradeNudge";

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
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

import { usePurchases } from "@saas/payments/hooks/purchases";

const mockUsePurchases = vi.mocked(usePurchases);

describe("JobResultsUpgradeNudge", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nudge for free plan user", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge />);

		expect(screen.getByText("Liked these results?")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /upgrade/i }),
		).toBeInTheDocument();
	});

	it("renders Starter→Pro nudge for starter plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge />);

		expect(screen.getByText("Ready for more?")).toBeInTheDocument();
		expect(
			screen.getByText(/scheduled runs, bulk actions, and templates/i),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /upgrade to pro/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /compare plans/i }),
		).toBeInTheDocument();
	});

	it("Starter compare plans link deep-links to pricing-plan-pro", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge />);

		const compareLink = screen.getByRole("link", {
			name: /compare plans/i,
		});
		expect(compareLink).toHaveAttribute("href", "#pricing-plan-pro");
	});

	it("does not render for pro plan users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro" },
		} as ReturnType<typeof usePurchases>);

		const { container } = render(<JobResultsUpgradeNudge />);
		expect(container.firstChild).toBeNull();
	});

	it("does not render when activePlan is null", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: null,
		} as ReturnType<typeof usePurchases>);

		const { container } = render(<JobResultsUpgradeNudge />);
		expect(container.firstChild).toBeNull();
	});

	it("links to personal billing page by default (free plan)", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge />);

		const link = screen.getByRole("link", { name: /upgrade/i });
		expect(link).toHaveAttribute("href", "/app/settings/billing#pricing");
	});

	it("links to org billing page when organizationId is provided (free plan)", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge organizationId="org-123" />);

		const link = screen.getByRole("link", { name: /upgrade/i });
		expect(link).toHaveAttribute(
			"href",
			"/app/orgs/org-123/settings/billing#pricing",
		);
	});

	it("links to org billing page when organizationId is provided (starter plan)", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge organizationId="org-123" />);

		const upgradeLink = screen.getByRole("link", {
			name: /upgrade to pro/i,
		});
		expect(upgradeLink).toHaveAttribute(
			"href",
			"/app/orgs/org-123/settings/billing#pricing",
		);
	});

	it("passes organizationId to usePurchases hook", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge organizationId="org-abc" />);

		expect(mockUsePurchases).toHaveBeenCalledWith("org-abc");
	});

	it("applies custom className when provided", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		const { container } = render(
			<JobResultsUpgradeNudge className="my-custom-class" />,
		);

		const outerDiv = container.firstChild as HTMLElement;
		expect(outerDiv.className).toContain("my-custom-class");
	});

	it("shows motivating copy about limited free plan", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		} as ReturnType<typeof usePurchases>);

		render(<JobResultsUpgradeNudge />);

		expect(
			screen.getByText(/free plan runs are limited/i),
		).toBeInTheDocument();
	});
});
