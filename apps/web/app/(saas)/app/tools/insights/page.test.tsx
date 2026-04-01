import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@saas/payments/components/UpgradeGate", () => ({
	UpgradeGate: ({
		children,
		featureName,
	}: {
		children: React.ReactNode;
		featureName?: string;
	}) => (
		<div data-testid="upgrade-gate" data-feature={featureName}>
			{children}
		</div>
	),
}));

vi.mock("@saas/shared/components/PageHeader", () => ({
	PageHeader: ({
		title,
		subtitle,
		actions,
	}: {
		title: string;
		subtitle?: string;
		actions?: React.ReactNode;
	}) => (
		<div>
			<h1>{title}</h1>
			{subtitle && <p>{subtitle}</p>}
			{actions}
		</div>
	),
}));

vi.mock("@saas/tools/components/ToolInsightsDashboard", () => ({
	ToolInsightsDashboard: () => (
		<div data-testid="tool-insights-dashboard">Insights Dashboard</div>
	),
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		asChild,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
	}) => <div data-asChild={asChild}>{children}</div>,
}));

vi.mock("lucide-react", () => ({
	WrenchIcon: () => <span>WrenchIcon</span>,
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

let ToolInsightsPage: React.ComponentType;

beforeAll(async () => {
	const mod = await import("./page");
	ToolInsightsPage = mod.default as React.ComponentType;
});

describe("ToolInsightsPage", () => {
	it("renders page header", () => {
		render(<ToolInsightsPage />);
		expect(screen.getByText("Tool Insights")).toBeInTheDocument();
	});

	it("wraps insights in UpgradeGate", () => {
		render(<ToolInsightsPage />);
		expect(screen.getByTestId("upgrade-gate")).toBeInTheDocument();
		expect(screen.getByTestId("upgrade-gate")).toHaveAttribute(
			"data-feature",
			"Tool Insights",
		);
	});

	it("renders ToolInsightsDashboard inside gate", () => {
		render(<ToolInsightsPage />);
		expect(
			screen.getByTestId("tool-insights-dashboard"),
		).toBeInTheDocument();
	});

	it("renders link back to all tools", () => {
		render(<ToolInsightsPage />);
		expect(
			screen.getByRole("link", { name: /All Tools/i }),
		).toHaveAttribute("href", "/app/tools");
	});
});
