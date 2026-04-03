import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ActivePlan } from "./ActivePlan";
import { ActivePlanBadge } from "./ActivePlanBadge";

vi.mock("@repo/config", () => ({
	config: {
		payments: {
			plans: {
				free: { isFree: true },
				starter: {
					prices: [
						{
							type: "recurring",
							interval: "month",
							intervalCount: 1,
							amount: 999,
							currency: "usd",
							hidden: false,
						},
						{
							type: "recurring",
							interval: "year",
							amount: 9999,
							currency: "usd",
							hidden: false,
						},
					],
				},
				pro: {
					prices: [
						{
							type: "recurring",
							interval: "month",
							intervalCount: 1,
							amount: 2900,
							currency: "usd",
							hidden: false,
						},
						{
							type: "recurring",
							interval: "year",
							amount: 27840,
							currency: "usd",
							hidden: false,
						},
					],
				},
			},
		},
	},
}));

const mockPlanData = {
	free: {
		title: "Free",
		features: ["5 jobs/month", "Basic support"],
		description: "Free tier",
	},
	starter: {
		title: "Starter",
		features: ["100 credits/month", "Rollover credits"],
		description: "Starter tier",
	},
	pro: {
		title: "Pro",
		features: ["Unlimited jobs", "Priority support"],
		description: "Pro tier",
	},
};

const mockUsePlanData = vi.hoisted(() => vi.fn());
const mockUsePurchases = vi.hoisted(() => vi.fn());
const mockTrack = vi.hoisted(() => vi.fn());

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/payments/hooks/plan-data", () => ({
	usePlanData: mockUsePlanData,
}));

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: mockUsePurchases,
}));

vi.mock("../../settings/components/CustomerPortalButton", () => ({
	CustomerPortalButton: ({ purchaseId }: { purchaseId: string }) => (
		<button type="button">Manage {purchaseId}</button>
	),
}));

vi.mock("../../settings/components/SubscriptionStatusBadge", () => ({
	SubscriptionStatusBadge: ({ status }: { status: string }) => (
		<span data-testid="status-badge">{status}</span>
	),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

describe("ActivePlanBadge", () => {
	it("renders nothing when no active plan", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({ activePlan: null });

		const { container } = render(<ActivePlanBadge />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when active plan not in planData", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "enterprise" },
		});

		const { container } = render(<ActivePlanBadge />);
		expect(container.firstChild).toBeNull();
	});

	it("renders plan title badge when active plan exists", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro" },
		});

		render(<ActivePlanBadge />);
		expect(screen.getByText("Pro")).toBeInTheDocument();
	});

	it("passes organizationId to usePurchases", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({ activePlan: null });

		render(<ActivePlanBadge organizationId="org-123" />);
		expect(mockUsePurchases).toHaveBeenCalledWith("org-123");
	});
});

describe("ActivePlan", () => {
	it("renders nothing when no active plan", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({ activePlan: null });

		const { container } = render(<ActivePlan />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when active plan not in planData", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "enterprise" },
		});

		const { container } = render(<ActivePlan />);
		expect(container.firstChild).toBeNull();
	});

	it("renders plan title", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		});

		render(<ActivePlan />);
		expect(screen.getByText("Free")).toBeInTheDocument();
	});

	it("renders plan features", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		});

		render(<ActivePlan />);
		expect(screen.getByText("5 jobs/month")).toBeInTheDocument();
		expect(screen.getByText("Basic support")).toBeInTheDocument();
	});

	it("renders subscription status when present", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro", status: "active" },
		});

		render(<ActivePlan />);
		expect(screen.getByTestId("status-badge")).toHaveTextContent("active");
	});

	it("renders price when present", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: { amount: 29, currency: "USD" },
			},
		});

		render(<ActivePlan />);
		expect(screen.getByText(/29/)).toBeInTheDocument();
	});

	it("renders monthly price interval", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: {
					amount: 29,
					currency: "USD",
					interval: "month",
					intervalCount: 1,
				},
			},
		});

		render(<ActivePlan />);
		expect(screen.getAllByText(/month/).length).toBeGreaterThan(0);
	});

	it("renders customer portal button when purchaseId present", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				purchaseId: "purchase-456",
			},
		});

		render(<ActivePlan />);
		expect(screen.getByText("Manage purchase-456")).toBeInTheDocument();
	});

	it("passes organizationId to usePurchases", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({ activePlan: null });

		render(<ActivePlan organizationId="org-123" />);
		expect(mockUsePurchases).toHaveBeenCalledWith("org-123");
	});

	it("shows Pro upgrade nudge for Starter plan users", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="starter-pro-upgrade-nudge"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('[data-test="starter-upgrade-to-pro-cta"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('[data-test="starter-compare-plans-cta"]'),
		).toBeInTheDocument();
		expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
		expect(screen.getByText("Compare plans")).toBeInTheDocument();
	});

	it("shows Pro-exclusive feature copy in Starter upgrade nudge", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		});

		render(<ActivePlan />);
		expect(screen.getByText(/500 credits\/month/)).toBeInTheDocument();
		expect(screen.getByText(/Tool scheduler/)).toBeInTheDocument();
	});

	it("does not show Pro upgrade nudge for Pro plan users", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro" },
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="starter-pro-upgrade-nudge"]'),
		).not.toBeInTheDocument();
	});

	it("does not show Pro upgrade nudge for Free plan users", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free" },
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="starter-pro-upgrade-nudge"]'),
		).not.toBeInTheDocument();
	});

	it("shows annual billing upsell for Pro monthly subscribers", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: {
					amount: 2900,
					currency: "USD",
					interval: "month",
					intervalCount: 1,
				},
			},
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="annual-billing-upsell"]'),
		).toBeInTheDocument();
		expect(
			container.querySelector('[data-test="annual-billing-upsell-cta"]'),
		).toBeInTheDocument();
		// heading mentions savings
		expect(
			screen.getByText(/save \d+% with annual billing/i),
		).toBeInTheDocument();
		expect(screen.getAllByText(/Switch to annual/i).length).toBeGreaterThan(
			0,
		);
	});

	it("does not show annual billing upsell for Pro annual subscribers", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: {
					amount: 27840,
					currency: "USD",
					interval: "year",
					intervalCount: 1,
				},
			},
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="annual-billing-upsell"]'),
		).not.toBeInTheDocument();
	});

	it("shows annual billing upsell for Starter monthly subscribers", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "starter",
				price: {
					amount: 999,
					currency: "usd",
					interval: "month",
					intervalCount: 1,
				},
			},
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="annual-billing-upsell"]'),
		).toBeInTheDocument();
		expect(
			screen.getByText(/save \d+% with annual billing/i),
		).toBeInTheDocument();
		// copy should reference "Starter" features, not "Pro"
		expect(screen.getByText(/Starter features/)).toBeInTheDocument();
	});

	it("does not show annual billing upsell for Starter annual subscribers", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "starter",
				price: {
					amount: 9999,
					currency: "usd",
					interval: "year",
					intervalCount: 1,
				},
			},
		});

		const { container } = render(<ActivePlan />);
		expect(
			container.querySelector('[data-test="annual-billing-upsell"]'),
		).not.toBeInTheDocument();
	});

	it("annual billing upsell links to billing page", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: {
					amount: 2900,
					currency: "USD",
					interval: "month",
					intervalCount: 1,
				},
			},
		});

		const { container } = render(<ActivePlan />);
		const cta = container.querySelector(
			'[data-test="annual-billing-upsell-cta"]',
		);
		expect(cta).toHaveAttribute("href", "/app/billing");
	});

	it("tracks analytics when Starter upgrade CTA is clicked", async () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		});
		mockTrack.mockClear();

		const { container } = render(<ActivePlan />);
		const cta = container.querySelector(
			'[data-test="starter-upgrade-to-pro-cta"]',
		) as HTMLElement;
		await userEvent.click(cta);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "billing_settings_starter_upgrade_clicked",
			props: { plan_id: "starter" },
		});
	});

	it("tracks analytics when Starter compare plans CTA is clicked", async () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter" },
		});
		mockTrack.mockClear();

		const { container } = render(<ActivePlan />);
		const cta = container.querySelector(
			'[data-test="starter-compare-plans-cta"]',
		) as HTMLElement;
		await userEvent.click(cta);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "billing_settings_compare_plans_clicked",
			props: { plan_id: "starter" },
		});
	});

	it("tracks analytics when annual billing upsell CTA is clicked", async () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: {
				id: "pro",
				price: {
					amount: 2900,
					currency: "USD",
					interval: "month",
					intervalCount: 1,
				},
			},
		});
		mockTrack.mockClear();

		const { container } = render(<ActivePlan />);
		const cta = container.querySelector(
			'[data-test="annual-billing-upsell-cta"]',
		) as HTMLElement;
		await userEvent.click(cta);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "billing_settings_annual_upsell_clicked",
			props: { plan_id: "pro", savings_pct: expect.any(Number) },
		});
	});

	it("shows win-back nudge for canceled subscription", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro", status: "canceled", purchaseId: "pur_123" },
		});

		const { container } = render(<ActivePlan />);
		const nudge = container.querySelector('[data-test="winback-nudge"]');
		expect(nudge).not.toBeNull();
		expect(nudge?.textContent).toContain("canceled");
	});

	it("shows win-back nudge for expired subscription", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter", status: "expired" },
		});

		const { container } = render(<ActivePlan />);
		const nudge = container.querySelector('[data-test="winback-nudge"]');
		expect(nudge).not.toBeNull();
		expect(nudge?.textContent).toContain("expired");
	});

	it("does not show win-back nudge for active subscription", () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro", status: "active" },
		});

		const { container } = render(<ActivePlan />);
		const nudge = container.querySelector('[data-test="winback-nudge"]');
		expect(nudge).toBeNull();
	});

	it("tracks analytics when win-back CTA is clicked (no purchaseId)", async () => {
		mockUsePlanData.mockReturnValue({ planData: mockPlanData });
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro", status: "canceled" },
		});
		mockTrack.mockClear();

		const { container } = render(<ActivePlan />);
		const cta = container.querySelector(
			'[data-test="winback-reactivate-cta"]',
		) as HTMLElement;
		expect(cta).not.toBeNull();
		await userEvent.click(cta);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "billing_settings_winback_cta_clicked",
			props: { plan_id: "pro", status: "canceled" },
		});
	});
});
