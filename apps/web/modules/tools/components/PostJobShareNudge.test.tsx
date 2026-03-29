import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobShareNudge } from "./PostJobShareNudge";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

describe("PostJobShareNudge", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not render immediately", () => {
		render(<PostJobShareNudge toolSlug="meeting-summarizer" />);
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("renders after delay when not dismissed", async () => {
		render(<PostJobShareNudge toolSlug="meeting-summarizer" />);
		await act(async () => {
			vi.advanceTimersByTime(1300);
		});
		expect(
			screen.getByRole("complementary", { name: /share prompt/i }),
		).toBeTruthy();
	});

	it("does not render when already dismissed", () => {
		localStorage.setItem(
			"share-nudge-dismissed-meeting-summarizer",
			"true",
		);
		render(<PostJobShareNudge toolSlug="meeting-summarizer" />);
		vi.advanceTimersByTime(2000);
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("dismisses on X click", async () => {
		render(<PostJobShareNudge toolSlug="expense-categorizer" />);
		await act(async () => {
			vi.advanceTimersByTime(1300);
		});
		screen.getByRole("complementary", { name: /share prompt/i });
		fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
		expect(
			screen.queryByRole("complementary", { name: /share prompt/i }),
		).toBeNull();
		expect(
			localStorage.getItem("share-nudge-dismissed-expense-categorizer"),
		).toBe("true");
	});

	it("shows copy link button", async () => {
		render(<PostJobShareNudge toolSlug="contract-analyzer" />);
		await act(async () => {
			vi.advanceTimersByTime(1300);
		});
		screen.getByRole("complementary", { name: /share prompt/i });
		expect(screen.getByRole("button", { name: /copy link/i })).toBeTruthy();
	});
});
