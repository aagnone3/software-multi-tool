import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@saas/jobs/components/JobDetailPage", () => ({
	JobDetailPage: ({ jobId }: { jobId: string }) => (
		<div data-testid="job-detail-page" data-jobid={jobId}>
			Job Detail
		</div>
	),
}));

let JobDetailRoute: (props: {
	params: Promise<{ jobId: string }>;
}) => Promise<React.ReactElement>;
let generateMetadata: () => Promise<{ title: string }>;

beforeAll(async () => {
	const mod = await import("./page");
	JobDetailRoute = mod.default as typeof JobDetailRoute;
	generateMetadata = mod.generateMetadata as () => Promise<{ title: string }>;
});

describe("JobDetailRoute", () => {
	it("renders JobDetailPage with correct jobId", async () => {
		const params = Promise.resolve({ jobId: "job-abc-123" });
		render(await JobDetailRoute({ params }));
		const el = screen.getByTestId("job-detail-page");
		expect(el).toBeInTheDocument();
		expect(el).toHaveAttribute("data-jobid", "job-abc-123");
	});

	it("generateMetadata returns correct title", async () => {
		const meta = await generateMetadata();
		expect(meta.title).toBe("Job Details");
	});
});
