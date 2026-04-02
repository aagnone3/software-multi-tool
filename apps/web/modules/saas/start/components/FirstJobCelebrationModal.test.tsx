import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: vi.fn(),
}));

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { useJobsList } from "@tools/hooks/use-job-polling";
import { FirstJobCelebrationModal } from "./FirstJobCelebrationModal";

const mockUseJobsList = vi.mocked(useJobsList);
const mockUseCreditsBalance = vi.mocked(useCreditsBalance);

describe("FirstJobCelebrationModal", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		localStorage.clear();
		mockUseCreditsBalance.mockReturnValue({
			balance: { remaining: 9 },
		} as any);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not open when there are no completed jobs", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		});
		render(<FirstJobCelebrationModal />);
		act(() => vi.runAllTimers());
		expect(screen.queryByText(/You just saved real time/)).toBeNull();
	});

	it("opens after 1.5s when there is exactly 1 completed job", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		expect(screen.getByText(/You just saved real time/)).toBeTruthy();
	});

	it("does not open again if already shown (localStorage)", async () => {
		localStorage.setItem("first-job-celebration-shown", "true");
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.runAllTimers());
		expect(screen.queryByText(/You just saved real time/)).toBeNull();
	});

	it("does not open when there are 2+ completed jobs", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [
				{ id: "job1", status: "COMPLETED" },
				{ id: "job2", status: "COMPLETED" },
			],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.runAllTimers());
		expect(screen.queryByText(/You just saved real time/)).toBeNull();
	});

	it("shows upgrade CTA and explore button with real credit count", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		mockUseCreditsBalance.mockReturnValue({
			balance: { remaining: 7 },
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		expect(screen.getAllByText(/Upgrade to Pro/).length).toBeGreaterThan(0);
		expect(screen.getByText(/7 credits left/)).toBeTruthy();
	});

	it("shows fallback text when credit balance is unavailable", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		mockUseCreditsBalance.mockReturnValue({ balance: null } as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		expect(screen.getByText(/Keep exploring for now/)).toBeTruthy();
	});

	it("shows singular 'credit' when exactly 1 credit remains", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		mockUseCreditsBalance.mockReturnValue({
			balance: { remaining: 1 },
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		expect(screen.getByText(/1 credit left/)).toBeTruthy();
	});

	it("closes and saves to localStorage on dismiss", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		const closeBtn = screen.getByText(/Keep exploring/);
		act(() => {
			closeBtn.click();
		});
		expect(localStorage.getItem("first-job-celebration-shown")).toBe(
			"true",
		);
	});

	it("links to default billing path when no org", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ id: "job1", status: "COMPLETED" }],
			isLoading: false,
			error: null,
			refetch: vi.fn() as any,
		} as any);
		render(<FirstJobCelebrationModal />);
		act(() => vi.advanceTimersByTime(1500));
		const upgradeLink = screen.getByRole("link", {
			name: /Upgrade to Pro/i,
		});
		expect(upgradeLink.getAttribute("href")).toBe("/app/settings/billing");
	});
});
