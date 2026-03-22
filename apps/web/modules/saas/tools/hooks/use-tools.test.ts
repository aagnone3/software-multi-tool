import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// Mock the tool-flags module so tests don't depend on env setup
const mockTools = [
	{ slug: "expense-categorizer", isComingSoon: false },
	{ slug: "news-analyzer", isComingSoon: true },
];
const mockEnabledTools = [{ slug: "expense-categorizer", isComingSoon: false }];
const mockVisibleTools = mockTools;
const mockIsToolEnabled = vi.fn(
	(slug: string) => slug === "expense-categorizer",
);

vi.mock("../lib/tool-flags", () => ({
	getToolsWithStatus: vi.fn(() => mockTools),
	getEnabledTools: vi.fn(() => mockEnabledTools),
	getVisibleTools: vi.fn(() => mockVisibleTools),
	isToolEnabled: (slug: string) => mockIsToolEnabled(slug),
}));

import { useTools } from "./use-tools";

describe("useTools", () => {
	it("returns all tools", () => {
		const { result } = renderHook(() => useTools());
		expect(result.current.tools).toEqual(mockTools);
	});

	it("returns only enabled tools", () => {
		const { result } = renderHook(() => useTools());
		expect(result.current.enabledTools).toEqual(mockEnabledTools);
	});

	it("returns visible tools (enabled + coming soon)", () => {
		const { result } = renderHook(() => useTools());
		expect(result.current.visibleTools).toEqual(mockVisibleTools);
	});

	it("isToolEnabled returns true for enabled tool", () => {
		const { result } = renderHook(() => useTools());
		expect(result.current.isToolEnabled("expense-categorizer")).toBe(true);
	});

	it("isToolEnabled returns false for coming-soon tool", () => {
		mockIsToolEnabled.mockReturnValueOnce(false);
		const { result } = renderHook(() => useTools());
		expect(result.current.isToolEnabled("news-analyzer")).toBe(false);
	});
});
