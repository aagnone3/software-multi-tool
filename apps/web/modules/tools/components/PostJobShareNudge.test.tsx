import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobShareNudge } from "./PostJobShareNudge";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
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
});
