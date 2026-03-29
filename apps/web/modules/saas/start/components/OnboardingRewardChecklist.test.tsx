import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingRewardChecklist } from "./OnboardingRewardChecklist";

const mockUser = { name: "Alex", id: "user-1", email: "a@b.com" };
const mockOrg = { name: "TestOrg", slug: "test-org" };

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(() => ({ user: mockUser })),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({ activeOrganization: mockOrg })),
}));
vi.mock("../hooks/use-recent-jobs", () => ({
	useRecentJobs: vi.fn(() => ({ jobs: [], isLoading: false })),
}));

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((k: string) => store[k] ?? null),
		setItem: vi.fn((k: string, v: string) => {
			store[k] = v;
		}),
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("OnboardingRewardChecklist", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it("renders with total credits headline", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<OnboardingRewardChecklist />);
		expect(screen.getByText(/Earn 25 Bonus Credits/i)).toBeInTheDocument();
	});

	it("shows step labels", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<OnboardingRewardChecklist />);
		expect(screen.getByText(/Add your name/i)).toBeInTheDocument();
		expect(screen.getByText(/Run your first tool/i)).toBeInTheDocument();
		expect(screen.getByText(/Set up your workspace/i)).toBeInTheDocument();
		expect(screen.getByText(/Complete 3 jobs/i)).toBeInTheDocument();
	});

	it("shows credit rewards on each step", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<OnboardingRewardChecklist />);
		// 5+10+5+5 = 25 credits total, visible as +N credits labels
		expect(screen.getByText("+10 credits")).toBeInTheDocument();
	});

	it("dismisses and hides on X click", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [],
			isLoading: false,
		} as any);
		render(<OnboardingRewardChecklist />);
		const dismissBtn = screen.getByRole("button", { name: /dismiss/i });
		fireEvent.click(dismissBtn);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(
			"onboarding-reward-checklist-dismissed",
			"true",
		);
	});

	it("returns null when loading", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [],
			isLoading: true,
		} as any);
		const { container } = render(<OnboardingRewardChecklist />);
		expect(container.firstChild).toBeNull();
	});

	it("marks first-tool step complete when user has a completed job", async () => {
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [{ id: "j1", status: "COMPLETED" }],
			isLoading: false,
		} as any);
		render(<OnboardingRewardChecklist />);
		// Should show earned credits note
		expect(screen.getByText(/credits earned/i)).toBeInTheDocument();
	});

	it("returns null when all steps complete", async () => {
		const { useSession } = await import("@saas/auth/hooks/use-session");
		vi.mocked(useSession).mockReturnValue({
			user: { name: "Alex", id: "u1", email: "a@b.com" },
		} as any);
		const { useRecentJobs } = await import("../hooks/use-recent-jobs");
		vi.mocked(useRecentJobs).mockReturnValue({
			jobs: [
				{ id: "j1", status: "COMPLETED" },
				{ id: "j2", status: "COMPLETED" },
				{ id: "j3", status: "COMPLETED" },
			],
			isLoading: false,
		} as any);
		const { container } = render(<OnboardingRewardChecklist />);
		// All steps: profile done (name set), org done, 3 jobs done, 1 job done
		expect(container.firstChild).toBeNull();
	});
});
