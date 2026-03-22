import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { NewsAnalyzerWithHistory } from "./news-analyzer-with-history";

vi.mock("./news-analyzer", () => ({
	NewsAnalyzer: () => <div>NewsAnalyzer</div>,
}));

vi.mock("./news-analyzer-history", () => ({
	NewsAnalyzerHistory: () => <div>NewsAnalyzerHistory</div>,
}));

vi.mock("nuqs", () => ({
	parseAsString: {
		withDefault: (val: string) => ({ defaultValue: val }),
	},
	useQueryState: vi.fn((_key: string, opts: { defaultValue: string }) => [
		opts.defaultValue,
		vi.fn(),
	]),
}));

describe("NewsAnalyzerWithHistory", () => {
	it("renders the tabs with Analyze Article and History", () => {
		render(<NewsAnalyzerWithHistory />);
		expect(
			screen.getByRole("tab", { name: "Analyze Article" }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("tab", { name: "History" }),
		).toBeInTheDocument();
	});

	it("shows NewsAnalyzer by default (analyze tab active)", () => {
		render(<NewsAnalyzerWithHistory />);
		expect(screen.getByText("NewsAnalyzer")).toBeInTheDocument();
	});

	it("switches to history tab when clicked", async () => {
		const setActiveTab = vi.fn();
		const { useQueryState } = await import("nuqs");
		vi.mocked(useQueryState).mockReturnValue(["analyze", setActiveTab]);

		const user = userEvent.setup({ delay: null });
		render(<NewsAnalyzerWithHistory />);
		await user.click(screen.getByRole("tab", { name: "History" }));
		expect(setActiveTab).toHaveBeenCalledWith("history");
	});
});
