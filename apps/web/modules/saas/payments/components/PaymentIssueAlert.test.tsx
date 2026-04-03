import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { PaymentIssueAlert } from "./PaymentIssueAlert";

const mockTrack = vi.fn();

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
}));

vi.mock("../../settings/components/CustomerPortalButton", () => ({
	CustomerPortalButton: ({ purchaseId }: { purchaseId: string }) => (
		<button
			type="button"
			data-testid="customer-portal-button"
			data-purchase-id={purchaseId}
		>
			Manage billing
		</button>
	),
}));

import { usePurchases } from "@saas/payments/hooks/purchases";

function mockPlan(status: string, withPurchaseId = true) {
	vi.mocked(usePurchases).mockReturnValue({
		activePlan: {
			id: "starter",
			status,
			...(withPurchaseId ? { purchaseId: "purchase-123" } : {}),
		} as ReturnType<typeof usePurchases>["activePlan"],
		purchases: [],
		hasSubscription: vi.fn().mockReturnValue(true),
		hasPurchase: vi.fn().mockReturnValue(true),
	});
}

describe("PaymentIssueAlert", () => {
	it("renders nothing for active status", () => {
		mockPlan("active");
		const { container } = render(<PaymentIssueAlert />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when no active plan", () => {
		vi.mocked(usePurchases).mockReturnValue({
			activePlan: undefined as unknown as ReturnType<
				typeof usePurchases
			>["activePlan"],
			purchases: [],
			hasSubscription: vi.fn().mockReturnValue(false),
			hasPurchase: vi.fn().mockReturnValue(false),
		});
		const { container } = render(<PaymentIssueAlert />);
		expect(container).toBeEmptyDOMElement();
	});

	it("shows past_due alert with urgent styling", () => {
		mockPlan("past_due");
		render(<PaymentIssueAlert />);
		expect(screen.getByTestId("payment-issue-alert")).toBeInTheDocument();
		expect(
			screen.getByText("Your payment is past due"),
		).toBeInTheDocument();
		expect(
			screen.getByTestId("customer-portal-button"),
		).toBeInTheDocument();
	});

	it("shows unpaid alert", () => {
		mockPlan("unpaid");
		render(<PaymentIssueAlert />);
		expect(
			screen.getByText("Payment failed — action required"),
		).toBeInTheDocument();
		expect(screen.getByTestId("payment-issue-alert")).toHaveAttribute(
			"data-status",
			"unpaid",
		);
	});

	it("shows incomplete alert", () => {
		mockPlan("incomplete");
		render(<PaymentIssueAlert />);
		expect(
			screen.getByText("Your subscription is incomplete"),
		).toBeInTheDocument();
	});

	it("shows paused alert", () => {
		mockPlan("paused");
		render(<PaymentIssueAlert />);
		expect(
			screen.getByText("Your subscription is paused"),
		).toBeInTheDocument();
	});

	it("shows billing link fallback when no purchaseId", () => {
		mockPlan("past_due", false);
		render(<PaymentIssueAlert />);
		expect(screen.getByText("Go to billing settings")).toBeInTheDocument();
	});

	it("passes organizationId to usePurchases", () => {
		mockPlan("active");
		render(<PaymentIssueAlert organizationId="org-123" />);
		expect(vi.mocked(usePurchases)).toHaveBeenCalledWith("org-123");
	});
});
