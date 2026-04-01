import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@saas/jobs/components/JobsHistoryPage", () => ({
	JobsHistoryPage: () => (
		<div data-testid="jobs-history-page">Jobs History</div>
	),
}));

let JobsPage: React.ComponentType;
let generateMetadata: () => Promise<{ title: string }>;

beforeAll(async () => {
	const mod = await import("./page");
	JobsPage = mod.default as React.ComponentType;
	generateMetadata = mod.generateMetadata as () => Promise<{ title: string }>;
});

describe("JobsPage", () => {
	it("renders JobsHistoryPage", () => {
		render(<JobsPage />);
		expect(screen.getByTestId("jobs-history-page")).toBeInTheDocument();
	});

	it("generateMetadata returns correct title", async () => {
		const meta = await generateMetadata();
		expect(meta.title).toBe("Job History");
	});
});
