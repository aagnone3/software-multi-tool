import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@saas/payments/components/PricingTable", () => ({
	PricingTable: ({
		organizationId,
		userId,
		activePlanId,
	}: {
		organizationId?: string;
		userId?: string;
		activePlanId?: string;
	}) => (
		<div
			data-testid="pricing-table"
			data-organization-id={organizationId}
			data-user-id={userId}
			data-active-plan-id={activePlanId}
		/>
	),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		description,
		children,
	}: {
		title: string;
		description?: string;
		children?: React.ReactNode;
	}) => (
		<div>
			<h3>{title}</h3>
			{description && <p>{description}</p>}
			{children}
		</div>
	),
}));

import { ChangePlan } from "./ChangePlan";

describe("ChangePlan", () => {
	it("renders the settings title and description", () => {
		render(<ChangePlan />);
		expect(screen.getByText("Change your plan")).toBeTruthy();
		expect(screen.getByText("Choose a plan to subscribe to.")).toBeTruthy();
	});

	it("renders PricingTable", () => {
		render(<ChangePlan />);
		expect(screen.getByTestId("pricing-table")).toBeTruthy();
	});

	it("passes organizationId to PricingTable", () => {
		render(<ChangePlan organizationId="org_123" />);
		expect(
			screen
				.getByTestId("pricing-table")
				.getAttribute("data-organization-id"),
		).toBe("org_123");
	});

	it("passes userId to PricingTable", () => {
		render(<ChangePlan userId="user_456" />);
		expect(
			screen.getByTestId("pricing-table").getAttribute("data-user-id"),
		).toBe("user_456");
	});

	it("passes activePlanId to PricingTable", () => {
		render(<ChangePlan activePlanId="pro" />);
		expect(
			screen
				.getByTestId("pricing-table")
				.getAttribute("data-active-plan-id"),
		).toBe("pro");
	});

	it("renders without any props", () => {
		expect(() => render(<ChangePlan />)).not.toThrow();
	});
});
