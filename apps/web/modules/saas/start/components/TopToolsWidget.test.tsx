"use client";

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: vi.fn(),
}));
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
		<a href={href as string} {...props}>
			{children}
		</a>
	),
}));

import { useTools } from "@saas/tools/hooks/use-tools";
import { useRecentJobs } from "../hooks/use-recent-jobs";
import { TopToolsWidget } from "./TopToolsWidget";

const mockUseTools = vi.mocked(useTools);
const mockUseRecentJobs = vi.mocked(useRecentJobs);

const enabledTools = [
	{ slug: "news-analyzer", name: "News Analyzer", enabled: true },
	{ slug: "invoice-processor", name: "Invoice Processor", enabled: true },
];

beforeEach(() => {
	mockUseTools.mockReturnValue({
		enabledTools,
		tools: enabledTools,
		visibleTools: enabledTools,
		isLoading: false,
		isToolEnabled: () => true,
	} as unknown as ReturnType<typeof useTools>);
});

describe("TopToolsWidget", () => {
	it("shows loading state", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: true,
		} as unknown as ReturnType<typeof useRecentJobs>);
		render(<TopToolsWidget />);
		expect(screen.getByText("Top Tools")).toBeTruthy();
		expect(screen.getByText("Loading...")).toBeTruthy();
	});

	it("shows empty state when no jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [],
			isLoading: false,
		} as unknown as ReturnType<typeof useRecentJobs>);
		render(<TopToolsWidget />);
		expect(screen.getByText("No usage yet")).toBeTruthy();
		expect(
			screen.getByRole("link", { name: /browse tools/i }),
		).toBeTruthy();
	});

	it("shows top tools sorted by usage", () => {
		const jobs = [
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "news-analyzer" },
			{ toolSlug: "invoice-processor" },
		] as ReturnType<typeof useRecentJobs>["jobs"];
		mockUseRecentJobs.mockReturnValue({
			jobs,
			isLoading: false,
		} as unknown as ReturnType<typeof useRecentJobs>);
		render(<TopToolsWidget />);
		const links = screen.getAllByRole("link");
		const toolLinks = links.filter((l) =>
			l.getAttribute("href")?.startsWith("/app/tools/"),
		);
		// news-analyzer should be first (3 runs)
		expect(toolLinks[0].getAttribute("href")).toBe(
			"/app/tools/news-analyzer",
		);
		expect(screen.getByText("3 runs")).toBeTruthy();
		expect(screen.getByText("1 run")).toBeTruthy();
	});

	it("respects maxTools prop", () => {
		const jobs = Array.from({ length: 10 }, (_, i) => ({
			toolSlug: `tool-${i}`,
		})) as ReturnType<typeof useRecentJobs>["jobs"];
		mockUseRecentJobs.mockReturnValue({
			jobs,
			isLoading: false,
		} as unknown as ReturnType<typeof useRecentJobs>);
		render(<TopToolsWidget maxTools={2} />);
		const toolLinks = screen
			.getAllByRole("link")
			.filter((l) =>
				l.getAttribute("href")?.startsWith("/app/tools/tool-"),
			);
		expect(toolLinks.length).toBe(2);
	});

	it("shows View all jobs link", () => {
		const jobs = [{ toolSlug: "news-analyzer" }] as ReturnType<
			typeof useRecentJobs
		>["jobs"];
		mockUseRecentJobs.mockReturnValue({
			jobs,
			isLoading: false,
		} as unknown as ReturnType<typeof useRecentJobs>);
		render(<TopToolsWidget />);
		expect(
			screen.getByRole("link", { name: /view all jobs/i }),
		).toBeTruthy();
	});
});
