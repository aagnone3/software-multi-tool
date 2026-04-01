import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

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

vi.mock("@saas/tools/components/NewUserWelcomeBanner", () => ({
	NewUserWelcomeBanner: () => (
		<div data-testid="new-user-welcome-banner">Welcome Banner</div>
	),
}));

vi.mock("@saas/tools/components/ToolsGrid", () => ({
	ToolsGrid: () => <div data-testid="tools-grid">Tools Grid</div>,
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
	BarChart3Icon: () => <span>BarChart3Icon</span>,
	GitCompareArrowsIcon: () => <span>GitCompareArrowsIcon</span>,
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

let ToolsPage: React.ComponentType;

beforeAll(async () => {
	const mod = await import("./page");
	ToolsPage = mod.default as React.ComponentType;
});

describe("ToolsPage", () => {
	it("renders page header", () => {
		render(<ToolsPage />);
		expect(screen.getByText("Tools")).toBeInTheDocument();
	});

	it("renders ToolsGrid", () => {
		render(<ToolsPage />);
		expect(screen.getByTestId("tools-grid")).toBeInTheDocument();
	});

	it("renders NewUserWelcomeBanner", () => {
		render(<ToolsPage />);
		expect(
			screen.getByTestId("new-user-welcome-banner"),
		).toBeInTheDocument();
	});

	it("renders Insights link", () => {
		render(<ToolsPage />);
		expect(screen.getByRole("link", { name: /Insights/i })).toHaveAttribute(
			"href",
			"/app/tools/insights",
		);
	});

	it("renders Compare Tools link", () => {
		render(<ToolsPage />);
		expect(
			screen.getByRole("link", { name: /Compare Tools/i }),
		).toHaveAttribute("href", "/app/tools/compare");
	});
});
