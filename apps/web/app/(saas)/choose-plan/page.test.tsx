import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockSession = { user: { id: "user-1" } };
const mockPurchases: { planId: string }[] = [];

vi.mock("@saas/auth/lib/server", () => ({
	getSession: vi.fn(() => Promise.resolve(mockSession)),
	getOrganizationList: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@saas/payments/lib/server", () => ({
	getPurchases: vi.fn(() => Promise.resolve(mockPurchases)),
}));

vi.mock("@repo/payments/lib/helper", () => ({
	createPurchasesHelper: vi.fn(() => ({ activePlan: null })),
}));

vi.mock("@repo/config", () => ({
	config: {
		organizations: { enable: false, enableBilling: false },
		appName: "TestApp",
	},
}));

const mockRedirect = vi.fn();
vi.mock("next/navigation", () => ({
	redirect: (url: string) => {
		mockRedirect(url);
		throw new Error(`redirect:${url}`);
	},
}));

vi.mock("@saas/payments/components/PricingTable", () => ({
	PricingTable: ({ userId }: { userId?: string }) => (
		<div data-testid="pricing-table" data-user={userId}>
			Pricing Table
		</div>
	),
}));

vi.mock("@saas/payments/components/BillingTrustSection", () => ({
	BillingTrustSection: ({ className }: { className?: string }) => (
		<div data-testid="billing-trust-section" className={className}>
			Trust Section
		</div>
	),
}));

vi.mock("@saas/shared/components/AuthWrapper", () => ({
	AuthWrapper: ({ children }: { children: React.ReactNode }) => (
		<div data-testid="auth-wrapper">{children}</div>
	),
}));

import ChoosePlanPage, { generateMetadata } from "./page";

describe("ChoosePlanPage", () => {
	it("renders heading and pricing table when no active plan", async () => {
		const Page = await ChoosePlanPage();
		render(Page);

		expect(screen.getByText("Choose your plan")).toBeInTheDocument();
		expect(screen.getByTestId("pricing-table")).toBeInTheDocument();
	});

	it("renders BillingTrustSection to reinforce conversion confidence", async () => {
		const Page = await ChoosePlanPage();
		render(Page);

		expect(screen.getByTestId("billing-trust-section")).toBeInTheDocument();
	});

	it("passes userId to PricingTable when orgs disabled", async () => {
		const Page = await ChoosePlanPage();
		render(Page);

		expect(screen.getByTestId("pricing-table")).toHaveAttribute(
			"data-user",
			"user-1",
		);
	});

	it("redirects to /app when user already has an active plan", async () => {
		const { createPurchasesHelper } = await import(
			"@repo/payments/lib/helper"
		);
		vi.mocked(createPurchasesHelper).mockReturnValueOnce({
			activePlan: { id: "pro" },
			hasSubscription: () => true,
			hasPurchase: () => true,
		} as never);

		await expect(ChoosePlanPage()).rejects.toThrow("redirect:/app");
	});

	it("redirects to /auth/login when session is null", async () => {
		const { getSession } = await import("@saas/auth/lib/server");
		vi.mocked(getSession).mockResolvedValueOnce(null);

		await expect(ChoosePlanPage()).rejects.toThrow("redirect:/auth/login");
	});

	it("generates correct metadata", async () => {
		const meta = await generateMetadata();
		expect(meta.title).toBe("Choose your plan");
	});
});
