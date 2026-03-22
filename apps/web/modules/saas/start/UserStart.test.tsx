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
vi.mock("./components/CreditsOverview", () => ({
	CreditsOverview: () => <div data-testid="credits-overview" />,
}));
vi.mock("./components/RecentlyUsedTools", () => ({
	RecentlyUsedTools: () => <div data-testid="recently-used-tools" />,
}));
vi.mock("./components/RecentActivityFeed", () => ({
	RecentActivityFeed: () => <div data-testid="recent-activity-feed" />,
}));

describe("UserStart", () => {
	it("renders all dashboard sections", () => {
		render(<UserStart />);
		expect(screen.getByTestId("organizations-grid")).toBeInTheDocument();
		expect(
			screen.getByTestId("getting-started-checklist"),
		).toBeInTheDocument();
		expect(screen.getByTestId("credits-overview")).toBeInTheDocument();
		expect(screen.getByTestId("recently-used-tools")).toBeInTheDocument();
		expect(screen.getByTestId("recent-activity-feed")).toBeInTheDocument();
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
