import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import UserStart from "./UserStart";

vi.mock("@repo/config", () => ({
	config: { organizations: { enable: true } },
}));
vi.mock("@saas/organizations/components/OrganizationsGrid", () => ({
	OrganizationsGrid: () => <div data-testid="organizations-grid" />,
}));
vi.mock("./components/GettingStartedChecklist", () => ({
	GettingStartedChecklist: () => (
		<div data-testid="getting-started-checklist" />
	),
}));
vi.mock("./components/QuickActions", () => ({
	QuickActions: () => <div data-testid="quick-actions" />,
}));
vi.mock("./components/CreditsOverview", () => ({
	CreditsOverview: () => <div data-testid="credits-overview" />,
}));
vi.mock("./components/RecentlyUsedTools", () => ({
	RecentlyUsedTools: () => <div data-testid="recently-used-tools" />,
}));
vi.mock("./components/NotificationsWidget", () => ({
	NotificationsWidget: () => <div data-testid="notifications-widget" />,
}));
vi.mock("./components/UsageTrendChart", () => ({
	UsageTrendChart: () => <div data-testid="usage-trend-chart" />,
}));
vi.mock("./components/RecentActivityFeed", () => ({
	RecentActivityFeed: () => <div data-testid="recent-activity-feed" />,
}));
vi.mock("./components/TopToolsWidget", () => ({
	TopToolsWidget: () => <div data-testid="top-tools-widget" />,
}));
vi.mock("./components/RecommendedToolWidget", () => ({
	RecommendedToolWidget: () => <div data-testid="recommended-tool-widget" />,
}));
vi.mock("./components/FavoriteToolsWidget", () => ({
	FavoriteToolsWidget: () => <div data-testid="favorite-tools-widget" />,
}));
vi.mock("./components/ActiveJobsWidget", () => ({
	ActiveJobsWidget: () => <div data-testid="active-jobs-widget" />,
}));
vi.mock("./components/RecentlyViewedToolsWidget", () => ({
	RecentlyViewedToolsWidget: () => (
		<div data-testid="recently-viewed-tools-widget" />
	),
}));
vi.mock("./components/UntriedToolsWidget", () => ({
	UntriedToolsWidget: () => <div data-testid="untried-tools-widget" />,
}));
vi.mock("./components/DailyGoalWidget", () => ({
	DailyGoalWidget: () => <div data-testid="daily-goal-widget" />,
}));
vi.mock("@saas/credits/components/CreditBurnRateWidget", () => ({
	CreditBurnRateWidget: () => <div data-testid="credit-burn-rate-widget" />,
}));
vi.mock("./components/CreditsByToolChart", () => ({
	CreditsByToolChart: () => <div>CreditsByToolChart</div>,
}));
vi.mock("./components/WeeklyActivityHeatmap", () => ({
	WeeklyActivityHeatmap: () => <div>WeeklyActivityHeatmap</div>,
}));

vi.mock("./components/WelcomeModal", () => ({
	WelcomeModal: () => null,
}));

vi.mock("./components/StreakWidget", () => ({
	StreakWidget: () => <div data-testid="streak-widget" />,
}));

describe("UserStart", () => {
	it("renders all dashboard sections", () => {
		render(<UserStart />);
		expect(screen.getByTestId("organizations-grid")).toBeInTheDocument();
		expect(
			screen.getByTestId("getting-started-checklist"),
		).toBeInTheDocument();
		expect(screen.getByTestId("quick-actions")).toBeInTheDocument();
		expect(screen.getByTestId("credits-overview")).toBeInTheDocument();
		expect(screen.getByTestId("recently-used-tools")).toBeInTheDocument();
		expect(screen.getByTestId("notifications-widget")).toBeInTheDocument();
		expect(screen.getByTestId("usage-trend-chart")).toBeInTheDocument();
		expect(screen.getByTestId("recent-activity-feed")).toBeInTheDocument();
		expect(screen.getByTestId("top-tools-widget")).toBeInTheDocument();
		expect(
			screen.getByTestId("recommended-tool-widget"),
		).toBeInTheDocument();
	});

	it("hides organizations grid when organizations disabled", async () => {
		const { config } = await import("@repo/config");
		(config.organizations as any).enable = false;

		render(<UserStart />);
		expect(
			screen.queryByTestId("organizations-grid"),
		).not.toBeInTheDocument();

		(config.organizations as any).enable = true;
	});
});
