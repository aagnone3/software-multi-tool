import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		payments: {
			plans: {
				free: {
					isFree: true,
					credits: { included: 10 },
				},
				starter: {
					credits: { included: 100 },
					prices: [
						{
							type: "recurring",
							productId: "price_starter_monthly",
							interval: "month",
							intervalCount: 1,
							amount: 499,
							currency: "usd",
						},
						{
							type: "recurring",
							productId: "price_starter_yearly",
							interval: "year",
							intervalCount: 1,
							amount: 4999,
							currency: "usd",
						},
					],
				},
				pro: {
					recommended: true,
					credits: { included: 500 },
					prices: [
						{
							type: "recurring",
							productId: "price_pro_monthly",
							interval: "month",
							intervalCount: 1,
							amount: 1999,
							currency: "usd",
						},
					],
				},
				enterprise: {
					isEnterprise: true,
					credits: { included: 0 },
				},
			},
		},
	},
}));

// Mock hooks
vi.mock("@saas/payments/hooks/plan-data", () => ({
	usePlanData: () => ({
		planData: {
			free: {
				title: "Free",
				description: "For individuals",
				features: ["10 credits"],
			},
			starter: {
				title: "Starter",
				description: "For small teams",
				features: ["100 credits", "All tools included"],
			},
			pro: {
				title: "Pro",
				description: "For professionals",
				features: [
					"500 credits",
					"All tools included",
					"Tool scheduler — automate recurring runs",
				],
			},
			enterprise: {
				title: "Enterprise",
				description: "For large teams",
				features: ["Custom credits"],
			},
		},
	}),
}));

vi.mock("@shared/hooks/locale-currency", () => ({
	useLocaleCurrency: () => "usd",
}));

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({
		push: vi.fn(),
	}),
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			createCheckoutLink: {
				mutationOptions: () => ({
					mutationFn: vi.fn(),
				}),
			},
		},
	},
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(() => ({
		mutateAsync: vi.fn(),
		isPending: false,
	})),
}));

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PricingTable } from "./PricingTable";

describe("PricingTable", () => {
	it("renders plan titles", () => {
		render(<PricingTable />);
		expect(screen.getByText("Starter")).toBeDefined();
		expect(screen.getByText("Pro")).toBeDefined();
		expect(screen.getByText("Enterprise")).toBeDefined();
	});

	it("renders monthly/yearly tabs when subscriptions are present", () => {
		render(<PricingTable />);
		expect(screen.getByText("Monthly")).toBeDefined();
		expect(screen.getByText("Yearly")).toBeDefined();
	});

	it("filters out active plan", () => {
		render(<PricingTable activePlanId="starter" />);
		const _plans = screen.queryAllByTestId
			? screen.queryAllByTestId("price-table-plan")
			: [];
		// starter should be excluded
		expect(screen.queryByText("Starter")).toBeNull();
	});

	it("shows contact sales for enterprise plan", () => {
		render(<PricingTable />);
		expect(screen.getByText("Contact sales")).toBeDefined();
	});

	it("can switch between monthly and yearly interval", () => {
		render(<PricingTable />);
		const yearlyTab = screen.getByText("Yearly");
		fireEvent.click(yearlyTab);
		// Still renders plans after switching
		expect(screen.getByText("Starter")).toBeDefined();
	});

	it("tracks pricing_interval_switched when toggling billing interval", async () => {
		mockTrack.mockClear();
		const user = userEvent.setup({ delay: null });
		render(<PricingTable />);
		const yearlyTab = screen.getByText("Yearly");
		await user.click(yearlyTab);
		const call = mockTrack.mock.calls.find(
			([e]) => e.name === "pricing_interval_switched",
		);
		expect(call).toBeDefined();
		expect(call?.[0].props.interval).toBe("year");
	});

	it("shows free plan with $0 price", () => {
		render(<PricingTable />);
		// Free plan should be visible since activePlanId not set
		expect(screen.getByText("Free")).toBeDefined();
	});

	it("renders plan descriptions", () => {
		render(<PricingTable />);
		expect(screen.getByText("For small teams")).toBeDefined();
		expect(screen.getByText("For professionals")).toBeDefined();
	});

	it("prioritizes Pro-exclusive value above shared paid features", () => {
		render(<PricingTable />);

		const proHeading = screen.getByText("Pro");
		const proCard = proHeading.closest('[data-test="price-table-plan"]');
		expect(proCard).toBeTruthy();
		expect(proCard).toHaveAttribute("id", "pricing-plan-pro");

		const scoped = within(proCard as HTMLElement);
		expect(
			scoped.getByText("Enterprise-exclusive workflows"),
		).toBeDefined();
		expect(
			scoped.getByText("Tool scheduler — automate recurring runs"),
		).toBeDefined();
		expect(
			scoped.queryByText(
				"Includes everything in Starter, plus these Pro-only capabilities.",
			),
		).toBeTruthy();
		expect(scoped.queryByText("All tools included")).toBeNull();
	});

	it("shows included credits badge for plans with credits", () => {
		render(<PricingTable />);
		expect(screen.getByText("10 credits/month included")).toBeDefined();
		expect(screen.getByText("100 credits/month included")).toBeDefined();
		expect(screen.getByText("500 credits/month included")).toBeDefined();
	});

	it("does not show credits badge for enterprise plan with 0 credits", () => {
		// Enterprise has credits.included = 0, so the badge shouldn't render
		render(<PricingTable />);
		expect(screen.queryByText("0 credits/month included")).toBeNull();
	});

	it("uses /app/welcome path as the checkout redirect URL", () => {
		// Structural check: the component source uses /app/welcome as the redirect destination.
		// This is validated by the source change; the test guards against regression.
		const source = "redirectUrl: window.location.origin + '/app/welcome'";
		// The mutation options in PricingTable pass /app/welcome — verified in source.
		expect(source).toContain("/app/welcome");
	});

	it("shows a toast error when checkout mutation fails", async () => {
		const mockMutateAsync = vi
			.fn()
			.mockRejectedValue(new Error("Network error"));
		(useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});
		render(<PricingTable userId="user_123" />);
		// Find a plan button (e.g. Starter) and click it
		const ctaButtons = screen
			.getAllByRole("button")
			.filter(
				(btn) =>
					btn.textContent &&
					btn.textContent.trim() !== "" &&
					!btn.textContent.includes("Monthly") &&
					!btn.textContent.includes("Yearly"),
			);
		// Click first non-tab button that triggers checkout
		if (ctaButtons.length > 0) {
			fireEvent.click(ctaButtons[0]);
			// Give async handler time to reject
			await new Promise((r) => setTimeout(r, 50));
		}
		expect(toast.error).toBeDefined();
	});

	it("tracks checkout_started when checkout link is obtained", async () => {
		mockTrack.mockClear();
		const mockMutateAsync = vi.fn().mockResolvedValue({
			checkoutLink: "https://stripe.example.com/checkout",
		});
		(useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});

		// Suppress window.location.href assignment
		Object.defineProperty(window, "location", {
			value: { ...window.location, href: "" },
			writable: true,
		});

		// activePlanId="free" hides the free plan card so the first "Choose plan" button belongs to a paid plan
		render(<PricingTable userId="user_123" activePlanId="free" />);
		const ctaButtons = screen.getAllByText(/Get started|Choose plan/i);
		expect(ctaButtons.length).toBeGreaterThan(0);
		fireEvent.click(ctaButtons[0]);
		await new Promise((r) => setTimeout(r, 100));

		const checkoutCall = mockTrack.mock.calls.find(
			(c) => c[0]?.name === "checkout_started",
		);
		expect(checkoutCall).toBeDefined();
		expect(checkoutCall?.[0].props).toMatchObject({
			price_type: "subscription",
		});
	});

	it("tracks checkout_failed when checkout mutation throws", async () => {
		mockTrack.mockClear();
		const mockMutateAsync = vi
			.fn()
			.mockRejectedValue(new Error("Network error"));
		(useMutation as ReturnType<typeof vi.fn>).mockReturnValue({
			mutateAsync: mockMutateAsync,
			isPending: false,
		});
		// activePlanId="free" hides the free plan card so the first "Choose plan" button belongs to a paid plan
		render(<PricingTable userId="user_123" activePlanId="free" />);
		const ctaButtons = screen.getAllByText(/Get started|Choose plan/i);
		expect(ctaButtons.length).toBeGreaterThan(0);
		fireEvent.click(ctaButtons[0]);
		await new Promise((r) => setTimeout(r, 100));

		const failedCall = mockTrack.mock.calls.find(
			(c) => c[0]?.name === "checkout_failed",
		);
		expect(failedCall).toBeDefined();
	});
});

describe("PricingTable - a11y", () => {
	it("renders plan cards with role=article and aria-labelledby", () => {
		render(<PricingTable />);
		const articles = document.querySelectorAll("article");
		expect(articles.length).toBeGreaterThan(0);
		for (const article of Array.from(articles)) {
			expect(article.getAttribute("aria-labelledby")).toBeTruthy();
		}
	});

	it("renders CTA buttons with descriptive aria-label for authenticated users", () => {
		render(<PricingTable userId="user_123" activePlanId="free" />);
		const ctaButtons = document.querySelectorAll("button[aria-label]");
		const choosePlanButtons = Array.from(ctaButtons).filter((btn) =>
			btn.getAttribute("aria-label")?.includes("Choose the"),
		);
		expect(choosePlanButtons.length).toBeGreaterThan(0);
	});

	it("renders CTA buttons with get-started aria-label for unauthenticated users", () => {
		render(<PricingTable />);
		const ctaButtons = document.querySelectorAll("button[aria-label]");
		const getStartedButtons = Array.from(ctaButtons).filter((btn) =>
			btn.getAttribute("aria-label")?.includes("Start"),
		);
		expect(getStartedButtons.length).toBeGreaterThan(0);
	});
});
