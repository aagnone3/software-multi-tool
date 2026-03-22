import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import OrganizationStart from "./OrganizationStart";

vi.mock("@saas/start/components/GettingStartedChecklist", () => ({
	GettingStartedChecklist: () => (
		<div data-testid="getting-started-checklist" />
	),
}));
vi.mock("@saas/start/components/CreditsOverview", () => ({
	CreditsOverview: () => <div data-testid="credits-overview" />,
}));
vi.mock("@saas/start/components/RecentlyUsedTools", () => ({
	RecentlyUsedTools: () => <div data-testid="recently-used-tools" />,
}));
vi.mock("@saas/start/components/RecentActivityFeed", () => ({
	RecentActivityFeed: () => <div data-testid="recent-activity-feed" />,
}));

describe("OrganizationStart", () => {
	it("renders all dashboard sections", () => {
		render(<OrganizationStart />);
		expect(
			screen.getByTestId("getting-started-checklist"),
		).toBeInTheDocument();
		expect(screen.getByTestId("credits-overview")).toBeInTheDocument();
		expect(screen.getByTestId("recently-used-tools")).toBeInTheDocument();
		expect(screen.getByTestId("recent-activity-feed")).toBeInTheDocument();
	});
});
