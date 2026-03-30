import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import {
	cleanup,
	fireEvent,
	render,
	screen,
	waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExitIntentUpgradeModal } from "./ExitIntentUpgradeModal";

vi.mock("@saas/credits/hooks/use-credits-balance");

const mockUseCreditsBalance = vi.mocked(useCreditsBalance);

// Helper to simulate mouse leaving the top of the viewport
function triggerExitIntent() {
	fireEvent(
		document,
		new MouseEvent("mouseleave", {
			bubbles: true,
			clientY: 0,
		}),
	);
}

describe("ExitIntentUpgradeModal", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders nothing for paid users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
			credits: 1000,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		const { container } = render(<ExitIntentUpgradeModal />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing while loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: true,
			credits: 0,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		const { container } = render(<ExitIntentUpgradeModal />);
		expect(container.firstChild).toBeNull();
	});

	it("does not show modal until exit intent fires", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		expect(
			screen.queryByText("Unlock the full power"),
		).not.toBeInTheDocument();
	});

	it("shows modal when mouse leaves top of viewport for free user", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});
	});

	it("does not trigger when mouse leaves from below top 50px", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);

		fireEvent(
			document,
			new MouseEvent("mouseleave", {
				bubbles: true,
				clientY: 200,
			}),
		);

		expect(
			screen.queryByText("Unlock the full power"),
		).not.toBeInTheDocument();
	});

	it("does not show again within cooldown period", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		// Mark as recently shown (1 day ago)
		const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;
		localStorage.setItem("exit-intent-upgrade-shown", String(oneDayAgo));

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		expect(
			screen.queryByText("Unlock the full power"),
		).not.toBeInTheDocument();
	});

	it("shows again after cooldown period expires", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		// Mark as shown 4 days ago (past 3-day cooldown)
		const fourDaysAgo = Date.now() - 1000 * 60 * 60 * 24 * 4;
		localStorage.setItem("exit-intent-upgrade-shown", String(fourDaysAgo));

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});
	});

	it("closes modal when X button clicked", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});

		const closeBtn = screen.getByLabelText("Close");
		fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(
				screen.queryByText("Unlock the full power"),
			).not.toBeInTheDocument();
		});
	});

	it("closes modal when 'No thanks' is clicked", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});

		const noThanksBtn = screen.getByText("No thanks, I'll stay on free");
		fireEvent.click(noThanksBtn);

		await waitFor(() => {
			expect(
				screen.queryByText("Unlock the full power"),
			).not.toBeInTheDocument();
		});
	});

	it("shows upgrade benefits list", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlimited tool access — no credit limits"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Priority job processing (10× faster)"),
			).toBeInTheDocument();
			expect(
				screen.getByText("Advanced export formats"),
			).toBeInTheDocument();
			expect(
				screen.getByText("API access for automation"),
			).toBeInTheDocument();
		});
	});

	it("shows pricing teaser", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(screen.getByText("$9/month")).toBeInTheDocument();
		});
	});

	it("does not trigger twice in the same session", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);

		// First trigger
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});

		// Close modal
		const closeBtn = screen.getByLabelText("Close");
		fireEvent.click(closeBtn);

		await waitFor(() => {
			expect(
				screen.queryByText("Unlock the full power"),
			).not.toBeInTheDocument();
		});

		// Second trigger — should not reopen
		triggerExitIntent();
		expect(
			screen.queryByText("Unlock the full power"),
		).not.toBeInTheDocument();
	});

	it("stores timestamp in localStorage when shown", async () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
			credits: 10,
			creditsUsed: 0,
			lowCreditsThreshold: 100,
		} as unknown as ReturnType<typeof useCreditsBalance>);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});

		const stored = localStorage.getItem("exit-intent-upgrade-shown");
		expect(stored).toBeTruthy();
		const ts = Number.parseInt(stored as string, 10);
		expect(ts).toBeGreaterThan(Date.now() - 5000);
	});
});
