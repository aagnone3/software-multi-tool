import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@saas/payments/components/UpgradeGate", () => ({
	UpgradeGate: ({
		children,
		featureName,
		description,
	}: {
		children: React.ReactNode;
		featureName?: string;
		description?: string;
	}) => (
		<div
			data-testid="upgrade-gate"
			data-feature={featureName}
			data-desc={description}
		>
			{children}
		</div>
	),
}));

vi.mock("@saas/tools/components/ToolCompareView", () => ({
	ToolCompareView: () => (
		<div data-testid="tool-compare-view">CompareView</div>
	),
}));

import ToolComparePage from "./page";

describe("ToolComparePage", () => {
	it("wraps ToolCompareView in UpgradeGate", () => {
		render(<ToolComparePage />);
		const gate = screen.getByTestId("upgrade-gate");
		expect(gate).toBeDefined();
		expect(gate.getAttribute("data-feature")).toBe("Tool Compare");
		expect(screen.getByTestId("tool-compare-view")).toBeInTheDocument();
	});
});
