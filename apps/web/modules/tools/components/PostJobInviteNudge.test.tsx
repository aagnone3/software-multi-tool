import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PostJobInviteNudge } from "./PostJobInviteNudge";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));
vi.mock("@tools/hooks/use-job-polling", () => ({
	useJobsList: () => ({
		jobs: [
			{ status: "COMPLETED" },
			{ status: "COMPLETED" },
			{ status: "COMPLETED" },
		],
	}),
}));

describe("PostJobInviteNudge", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.useFakeTimers();
	});
	afterEach(() => {
		vi.useRealTimers();
	});

	it("does not render immediately (timer pending)", () => {
		render(<PostJobInviteNudge />);
		expect(screen.queryByRole("complementary")).toBeNull();
	});

	it("renders after delay when not dismissed and threshold met", async () => {
		render(<PostJobInviteNudge />);
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});
		expect(
			screen.getByRole("complementary", {
				name: /invite teammates prompt/i,
			}),
		).toBeTruthy();
	});

	it("does not render when already dismissed", async () => {
		localStorage.setItem("invite-nudge-dismissed", "true");
		render(<PostJobInviteNudge />);
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});
		expect(
			screen.queryByRole("complementary", {
				name: /invite teammates prompt/i,
			}),
		).toBeNull();
	});

	it("dismisses on X click", async () => {
		render(<PostJobInviteNudge />);
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});
		screen.getByRole("complementary", { name: /invite teammates prompt/i });
		fireEvent.click(screen.getByRole("button", { name: /dismiss/i }));
		expect(
			screen.queryByRole("complementary", {
				name: /invite teammates prompt/i,
			}),
		).toBeNull();
		expect(localStorage.getItem("invite-nudge-dismissed")).toBe("true");
	});

	it("shows invite teammates button", async () => {
		render(<PostJobInviteNudge />);
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});
		expect(
			screen.getByRole("link", { name: /invite teammates/i }),
		).toBeTruthy();
	});

	it("falls back to /app/settings when no activeOrganization", async () => {
		render(<PostJobInviteNudge />);
		await act(async () => {
			vi.advanceTimersByTime(2100);
		});
		const link = screen.getByRole("link", { name: /invite teammates/i });
		expect(link.getAttribute("href")).toBe("/app/settings");
	});
});
