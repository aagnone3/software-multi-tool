import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/config", () => ({
	config: { ui: { saas: { useSidebarLayout: false } } },
}));

vi.mock("@saas/credits/components/CreditRunwayBanner", () => ({
	CreditRunwayBanner: () => null,
}));
vi.mock("@saas/credits/components/FreeCreditsProgressBanner", () => ({
	FreeCreditsProgressBanner: () => null,
}));
vi.mock("@saas/jobs/components/JobCompletionNotifier", () => ({
	JobCompletionNotifier: () => null,
}));
vi.mock("@saas/shared/components/ExitIntentUpgradeModal", () => ({
	ExitIntentUpgradeModal: () => null,
}));
vi.mock("@saas/shared/components/NavBar", () => ({
	NavBar: () => <nav data-testid="navbar" />,
}));

import { AppWrapper } from "./AppWrapper";

describe("AppWrapper", () => {
	it("renders children", () => {
		render(
			<AppWrapper>
				<span>Page content</span>
			</AppWrapper>,
		);
		expect(screen.getByText("Page content")).toBeTruthy();
	});

	it("renders the NavBar", () => {
		render(
			<AppWrapper>
				<span>Content</span>
			</AppWrapper>,
		);
		expect(screen.getByTestId("navbar")).toBeTruthy();
	});

	it("wraps children in a main element", () => {
		const { container } = render(
			<AppWrapper>
				<span>Content</span>
			</AppWrapper>,
		);
		expect(container.querySelector("main")).toBeTruthy();
	});
});
