import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@saas/payments/hooks/plan-data", () => ({
	usePlanData: vi.fn(),
}));
vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
}));
vi.mock("@ui/components/badge", () => ({
	Badge: ({
		children,
		status,
		className,
	}: {
		children: React.ReactNode;
		status?: string;
		className?: string;
	}) => (
		<span className={className} data-status={status} data-testid="badge">
			{children}
		</span>
	),
}));

import { usePlanData } from "@saas/payments/hooks/plan-data";
import { usePurchases } from "@saas/payments/hooks/purchases";
import { ActivePlanBadge } from "./ActivePlanBadge";

const mockUsePlanData = vi.mocked(usePlanData);
const mockUsePurchases = vi.mocked(usePurchases);

const planData = {
	free: { title: "Free", features: [], description: "" },
	starter: { title: "Starter", features: [], description: "" },
	pro: { title: "Pro", features: [], description: "" },
};

describe("ActivePlanBadge", () => {
	it("renders nothing when no active plan", () => {
		mockUsePlanData.mockReturnValue({ planData } as any);
		mockUsePurchases.mockReturnValue({ activePlan: null } as any);
		const { container } = render(<ActivePlanBadge />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders nothing when activePlan id not found in planData", () => {
		mockUsePlanData.mockReturnValue({ planData } as any);
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "unknown" },
		} as any);
		const { container } = render(<ActivePlanBadge />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders badge with plan title when active plan exists", () => {
		mockUsePlanData.mockReturnValue({ planData } as any);
		mockUsePurchases.mockReturnValue({ activePlan: { id: "pro" } } as any);
		render(<ActivePlanBadge />);
		expect(screen.getByTestId("badge")).toHaveTextContent("Pro");
	});

	it("passes organizationId to usePurchases", () => {
		mockUsePlanData.mockReturnValue({ planData } as any);
		mockUsePurchases.mockReturnValue({ activePlan: null } as any);
		render(<ActivePlanBadge organizationId="org-123" />);
		expect(mockUsePurchases).toHaveBeenCalledWith("org-123");
	});
});
