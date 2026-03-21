import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ActivePlan } from "./ActivePlan";
import { ActivePlanBadge } from "./ActivePlanBadge";

const mockPlanData = {
	free: {
		title: "Free",
		features: ["5 jobs/month", "Basic support"],
		description: "Free tier",
	},
	pro: {
		title: "Pro",
		features: ["Unlimited jobs", "Priority support"],
		description: "Pro tier",
	},
};

const mockUsePlanData = vi.hoisted(() => vi.fn());
const mockUsePurchases = vi.hoisted(() => vi.fn());

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
		expect(screen.getByText(/month/)).toBeInTheDocument();
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
});
