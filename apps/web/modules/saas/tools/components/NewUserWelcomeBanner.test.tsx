import {
	act,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewUserWelcomeBanner } from "./NewUserWelcomeBanner";

const mockUseRecentJobs = vi.fn();
const { mockTrack } = vi.hoisted(() => ({ mockTrack: vi.fn() }));

vi.mock("@saas/start/hooks/use-recent-jobs", () => ({
	useRecentJobs: (...args: unknown[]) => mockUseRecentJobs(...args),
}));
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("NewUserWelcomeBanner", () => {
	beforeEach(() => {
		localStorage.clear();
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: false });
	});

	it("renders for new users with no jobs", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => {
			expect(
				screen.getByText("Welcome! Here's how to get started"),
			).toBeInTheDocument();
		});
	});

	it("shows the 3 steps", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => {
			expect(screen.getByText("Pick a tool")).toBeInTheDocument();
			expect(screen.getByText("Upload or type")).toBeInTheDocument();
			expect(
				screen.getByText("Get results instantly"),
			).toBeInTheDocument();
		});
	});

	it("shows Try Meeting Summarizer CTA", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => {
			expect(
				screen.getByText("Try Meeting Summarizer"),
			).toBeInTheDocument();
		});
	});

	it("does not render when user already has jobs", () => {
		mockUseRecentJobs.mockReturnValue({
			jobs: [
				{
					id: "j1",
					toolSlug: "meeting-summarizer",
					status: "COMPLETED",
				},
			],
			isLoading: false,
		});
		render(<NewUserWelcomeBanner />);
		expect(
			screen.queryByText("Welcome! Here's how to get started"),
		).not.toBeInTheDocument();
	});

	it("does not render while loading", () => {
		mockUseRecentJobs.mockReturnValue({ jobs: [], isLoading: true });
		render(<NewUserWelcomeBanner />);
		expect(
			screen.queryByText("Welcome! Here's how to get started"),
		).not.toBeInTheDocument();
	});

	it("dismisses when X is clicked", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => {
			expect(
				screen.getByText("Welcome! Here's how to get started"),
			).toBeInTheDocument();
		});
		fireEvent.click(screen.getByLabelText("Dismiss welcome banner"));
		expect(
			screen.queryByText("Welcome! Here's how to get started"),
		).not.toBeInTheDocument();
		expect(localStorage.getItem("new-user-welcome-banner-dismissed")).toBe(
			"true",
		);
	});

	it("tracks shown event when rendered", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "new_user_welcome_banner_shown",
				props: {},
			});
		});
	});

	it("tracks dismiss event when X is clicked", async () => {
		render(<NewUserWelcomeBanner />);
		await waitFor(() => screen.getByLabelText("Dismiss welcome banner"));
		fireEvent.click(screen.getByLabelText("Dismiss welcome banner"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "new_user_welcome_banner_dismissed",
			props: {},
		});
	});

	it("does not render if previously dismissed", async () => {
		localStorage.setItem("new-user-welcome-banner-dismissed", "true");
		render(<NewUserWelcomeBanner />);
		await act(async () => {});
		expect(
			screen.queryByText("Welcome! Here's how to get started"),
		).not.toBeInTheDocument();
	});
});
