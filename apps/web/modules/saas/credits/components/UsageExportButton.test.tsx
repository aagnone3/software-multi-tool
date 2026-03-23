import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UsageExportButton } from "./UsageExportButton";

// Mock the hook
const mockUseUsageStats = vi.fn();
vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: () => mockUseUsageStats(),
}));

vi.mock("../lib/format-tool-name", () => ({
	formatToolName: (slug: string) =>
		slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
}));

function makeStats(overrides = {}) {
	return {
		byTool: [
			{ toolSlug: "news-analyzer", credits: 50, count: 5 },
			{ toolSlug: "invoice-processor", credits: 30, count: 3 },
		],
		byPeriod: [
			{ date: "2026-03-01", credits: 20 },
			{ date: "2026-03-02", credits: 60 },
		],
		totalUsed: 80,
		totalOverage: 0,
		isLoading: false,
		...overrides,
	};
}

describe("UsageExportButton", () => {
	let createObjectURL: ReturnType<typeof vi.fn>;
	let revokeObjectURL: ReturnType<typeof vi.fn>;
	let clickSpy: ReturnType<typeof vi.fn>;

	beforeEach(() => {
		mockUseUsageStats.mockReturnValue(makeStats());

		createObjectURL = vi.fn().mockReturnValue("blob:test");
		revokeObjectURL = vi.fn();
		URL.createObjectURL = createObjectURL as unknown as typeof URL.createObjectURL;
		URL.revokeObjectURL = revokeObjectURL as unknown as typeof URL.revokeObjectURL;

		clickSpy = vi.fn();
		const originalCreateElement = document.createElement.bind(document);
		vi.spyOn(document, "createElement").mockImplementation(
			(tag: string) => {
				if (tag === "a") {
					const el = {
						href: "",
						download: "",
						click: clickSpy,
					} as unknown as HTMLAnchorElement;
					return el;
				}
				return originalCreateElement(tag);
			},
		);
	});

	it("renders the export button", () => {
		render(<UsageExportButton />);
		expect(
			screen.getByRole("button", { name: /export report/i }),
		).toBeDefined();
	});

	it("is disabled when loading", () => {
		mockUseUsageStats.mockReturnValue(makeStats({ isLoading: true }));
		render(<UsageExportButton />);
		const btn = screen.getByRole("button");
		expect(btn.hasAttribute("disabled")).toBe(true);
	});

	it("is disabled when no data", () => {
		mockUseUsageStats.mockReturnValue(
			makeStats({ byTool: [], byPeriod: [] }),
		);
		render(<UsageExportButton />);
		const btn = screen.getByRole("button");
		expect(btn.hasAttribute("disabled")).toBe(true);
	});

	it("triggers download on click", () => {
		render(<UsageExportButton />);
		fireEvent.click(screen.getByRole("button", { name: /export report/i }));
		expect(clickSpy).toHaveBeenCalled();
		expect(revokeObjectURL).toHaveBeenCalledWith("blob:test");
	});

	it("creates a Blob with CSV content", () => {
		const blobSpy = vi
			.spyOn(global, "Blob")
			.mockImplementation((content) => ({ content }) as unknown as Blob);
		render(<UsageExportButton />);
		fireEvent.click(screen.getByRole("button", { name: /export report/i }));
		expect(blobSpy).toHaveBeenCalled();
		const csv = (blobSpy.mock.calls[0]?.[0] as string[])?.[0] ?? "";
		expect(csv).toContain("News Analyzer");
		expect(csv).toContain("Invoice Processor");
		expect(csv).toContain("2026-03-01");
		blobSpy.mockRestore();
	});
});
