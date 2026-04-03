import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobShareNudge } from "./PostJobShareNudge";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, val: string) => {
			store[key] = val;
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("PostJobShareNudge", () => {
	beforeEach(() => {
		localStorageMock.clear();
		mockTrack.mockClear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not render immediately (delayed)", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		expect(screen.queryByLabelText("Share prompt")).not.toBeInTheDocument();
	});

	it("renders after delay", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		expect(screen.getByLabelText("Share prompt")).toBeInTheDocument();
		expect(
			screen.getByText("Know someone who'd find this useful?"),
		).toBeInTheDocument();
	});

	it("dismisses and saves to localStorage", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		act(() => {
			screen.getByLabelText("Dismiss").click();
		});
		expect(screen.queryByLabelText("Share prompt")).not.toBeInTheDocument();
		expect(
			localStorageMock.getItem("share-nudge-dismissed-contract-analyzer"),
		).toBe("true");
	});

	it("does not show if already dismissed", () => {
		localStorageMock.setItem(
			"share-nudge-dismissed-contract-analyzer",
			"true",
		);
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		expect(screen.queryByLabelText("Share prompt")).not.toBeInTheDocument();
	});

	it("shows copy link button", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		expect(screen.getByText("Copy link")).toBeInTheDocument();
	});

	it("tracks share_nudge_shown when banner appears", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		expect(mockTrack).toHaveBeenCalledWith({
			name: "share_nudge_shown",
			props: { tool_slug: "contract-analyzer" },
		});
	});

	it("tracks share_nudge_dismissed when dismissed", () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		act(() => {
			vi.advanceTimersByTime(1500);
		});
		act(() => {
			screen.getByLabelText("Dismiss").click();
		});
		expect(mockTrack).toHaveBeenCalledWith({
			name: "share_nudge_dismissed",
			props: { tool_slug: "contract-analyzer" },
		});
	});
});
