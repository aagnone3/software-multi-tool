import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@saas/payments/components/PostUpgradeWelcome", () => ({
	PostUpgradeWelcome: () => (
		<div data-testid="post-upgrade-welcome">Welcome to Pro</div>
	),
}));

import WelcomePage from "./page";

describe("PostUpgradeWelcomePage", () => {
	it("renders PostUpgradeWelcome component", () => {
		render(React.createElement(WelcomePage));
		expect(screen.getByTestId("post-upgrade-welcome")).toBeInTheDocument();
	});
});
