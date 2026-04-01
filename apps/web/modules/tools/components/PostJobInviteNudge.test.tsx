import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobInviteNudge } from "./PostJobInviteNudge";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: { slug: "my-org" } }),
}));

const mockUseJobsList = vi.fn();
vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: (...args: unknown[]) => mockUseJobsList(...args),
}));

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

describe("PostJobInviteNudge", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not show when completed job count is below threshold", () => {
		mockUseJobsList.mockReturnValue({
			jobs: [{ status: "COMPLETED" }, { status: "COMPLETED" }],
		});
		render(<PostJobInviteNudge />);
		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(
			screen.queryByLabelText("Invite teammates prompt"),
		).not.toBeInTheDocument();
	});

	it("shows after threshold is met and delay passes", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 5 }, () => ({ status: "COMPLETED" })),
		});
		render(<PostJobInviteNudge />);
		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(
			screen.getByLabelText("Invite teammates prompt"),
		).toBeInTheDocument();
		expect(
			screen.getByText("Bring your team on board"),
		).toBeInTheDocument();
	});

	it("does not show if previously dismissed", () => {
		localStorageMock.setItem("invite-nudge-dismissed", "true");
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 5 }, () => ({ status: "COMPLETED" })),
		});
		render(<PostJobInviteNudge />);
		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(
			screen.queryByLabelText("Invite teammates prompt"),
		).not.toBeInTheDocument();
	});

	it("dismisses and saves flag", () => {
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 5 }, () => ({ status: "COMPLETED" })),
		});
		render(<PostJobInviteNudge />);
		act(() => {
			vi.advanceTimersByTime(3000);
		});
		act(() => {
			screen.getByLabelText("Dismiss").click();
		});
		expect(
			screen.queryByLabelText("Invite teammates prompt"),
		).not.toBeInTheDocument();
		expect(localStorageMock.getItem("invite-nudge-dismissed")).toBe("true");
	});

	it("renders invite link to org members page", async () => {
		mockUseJobsList.mockReturnValue({
			jobs: Array.from({ length: 5 }, () => ({ status: "COMPLETED" })),
		});
		render(<PostJobInviteNudge />);
		act(() => {
			vi.advanceTimersByTime(3000);
		});
		expect(screen.getByText("Invite teammates")).toBeInTheDocument();
	});
});
