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

function freeUserBalance(overrides = {}) {
	return {
		isFreePlan: true,
		isStarterPlan: false,
		isLoading: false,
		credits: 10,
		creditsUsed: 0,
		lowCreditsThreshold: 100,
		...overrides,
	} as unknown as ReturnType<typeof useCreditsBalance>;
}

function starterUserBalance(overrides = {}) {
	return {
		isFreePlan: false,
		isStarterPlan: true,
		isLoading: false,
		credits: 100,
		creditsUsed: 50,
		lowCreditsThreshold: 20,
		...overrides,
	} as unknown as ReturnType<typeof useCreditsBalance>;
}

function paidUserBalance() {
	return {
		isFreePlan: false,
		isStarterPlan: false,
		isLoading: false,
		credits: 1000,
		creditsUsed: 0,
		lowCreditsThreshold: 100,
	} as unknown as ReturnType<typeof useCreditsBalance>;
}

describe("ExitIntentUpgradeModal", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.clearAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("renders nothing for paid (Pro+) users", () => {
		mockUseCreditsBalance.mockReturnValue(paidUserBalance());
		const { container } = render(<ExitIntentUpgradeModal />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing while loading", () => {
		mockUseCreditsBalance.mockReturnValue(
			freeUserBalance({ isLoading: true }),
		);
		const { container } = render(<ExitIntentUpgradeModal />);
		expect(container.firstChild).toBeNull();
	});

	it("does not show modal until exit intent fires", () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
		render(<ExitIntentUpgradeModal />);
		expect(
			screen.queryByText("Unlock the full power"),
		).not.toBeInTheDocument();
	});

	it("shows free-plan modal when mouse leaves top of viewport", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Unlock the full power"),
			).toBeInTheDocument();
		});
	});

	it("shows starter-to-pro modal for starter plan users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Ready to go further?"),
			).toBeInTheDocument();
		});
	});

	it("shows pro-specific benefits for starter users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText(
					"500 credits/month (vs. 100 on Starter) + rollover",
				),
			).toBeInTheDocument();
			expect(
				screen.getByText("Scheduler runs & bulk actions"),
			).toBeInTheDocument();
		});
	});

	it("shows pro pricing for starter users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(screen.getByText("$29/month")).toBeInTheDocument();
		});
	});

	it("shows 'Upgrade to Pro' CTA for starter users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(screen.getByText("Upgrade to Pro")).toBeInTheDocument();
		});
	});

	it("shows dismiss text specific to starter users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("No thanks, Starter is fine"),
			).toBeInTheDocument();
		});
	});

	it("uses separate cooldown key for starter users", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());

		// Mark starter cooldown as recently shown (1 day ago)
		const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;
		localStorage.setItem(
			"exit-intent-starter-to-pro-shown",
			String(oneDayAgo),
		);

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		expect(
			screen.queryByText("Ready to go further?"),
		).not.toBeInTheDocument();
	});

	it("free cooldown does not block starter modal", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());

		// Free plan cooldown set — should not affect starter
		const oneDayAgo = Date.now() - 1000 * 60 * 60 * 24;
		localStorage.setItem("exit-intent-upgrade-shown", String(oneDayAgo));

		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Ready to go further?"),
			).toBeInTheDocument();
		});
	});

	it("does not trigger when mouse leaves from below top 50px", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());

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
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());

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
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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

	it("closes modal when 'No thanks' is clicked (free plan)", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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

	it("closes modal when 'No thanks' is clicked (starter plan)", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Ready to go further?"),
			).toBeInTheDocument();
		});

		const noThanksBtn = screen.getByText("No thanks, Starter is fine");
		fireEvent.click(noThanksBtn);

		await waitFor(() => {
			expect(
				screen.queryByText("Ready to go further?"),
			).not.toBeInTheDocument();
		});
	});

	it("shows free upgrade benefits list", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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

	it("shows pricing teaser for free plan", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(screen.getByText("$9/month")).toBeInTheDocument();
		});
	});

	it("does not trigger twice in the same session", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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

	it("stores timestamp in localStorage for free plan when shown", async () => {
		mockUseCreditsBalance.mockReturnValue(freeUserBalance());
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

	it("stores timestamp in starter localStorage key when starter modal shown", async () => {
		mockUseCreditsBalance.mockReturnValue(starterUserBalance());
		render(<ExitIntentUpgradeModal />);
		triggerExitIntent();

		await waitFor(() => {
			expect(
				screen.getByText("Ready to go further?"),
			).toBeInTheDocument();
		});

		const stored = localStorage.getItem("exit-intent-starter-to-pro-shown");
		expect(stored).toBeTruthy();
		const ts = Number.parseInt(stored as string, 10);
		expect(ts).toBeGreaterThan(Date.now() - 5000);
	});
});
