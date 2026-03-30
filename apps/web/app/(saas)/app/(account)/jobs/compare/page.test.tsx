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

vi.mock("@saas/jobs/components/JobOutputCompare", () => ({
	JobOutputCompare: () => <div data-testid="job-output-compare">Compare</div>,
}));

import JobsComparePage from "./page";

describe("JobsComparePage", () => {
	it("wraps JobOutputCompare in UpgradeGate", () => {
		render(<JobsComparePage />);

		const gate = screen.getByTestId("upgrade-gate");
		expect(gate).toBeInTheDocument();
		expect(gate).toHaveAttribute("data-feature", "Job Output Compare");
		expect(gate).toHaveAttribute(
			"data-desc",
			"Compare outputs from two different job runs side by side. Available on Pro and above.",
		);
		expect(screen.getByTestId("job-output-compare")).toBeInTheDocument();
	});
});
