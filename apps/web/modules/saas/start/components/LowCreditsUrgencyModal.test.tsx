import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LowCreditsUrgencyModal } from "./LowCreditsUrgencyModal";

const mockUseCreditsBalance = vi.fn();
const mockUseActiveOrganization = vi.fn();

vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
		onClick,
	}: {
		children: React.ReactNode;
		href: string;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

const DISMISS_KEY = "low-credits-modal-dismissed-user-123";

describe("LowCreditsUrgencyModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
	});

	function makeBalance(overrides = {}) {
		return {
			included: 500,
			used: 420,
			remaining: 80,
			purchasedCredits: 0,
			totalAvailable: 80,
			overage: 0,
			periodStart: "",
			periodEnd: "",
			plan: { id: "free", name: "Free" },
			...overrides,
		};
	}

	it("does not render when loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: true,
			isLowCredits: false,
			percentageUsed: 0,
			totalCredits: 0,
		});
		const { container } = render(
			<LowCreditsUrgencyModal userId="user-123" />,
		);
		expect(container.firstChild).toBeNull();
	});

	it("does not render when credits are not low", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 300, used: 200 }),
			isLoading: false,
			isLowCredits: false,
			percentageUsed: 40,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("does not render when remaining is 0 (ZeroCreditsModal handles that)", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 0, used: 500 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 100,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("does not render for fresh accounts with no usage", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 50, used: 0 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 0,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("shows modal when low on credits with some usage", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 80, used: 420 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 84,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		expect(
			await screen.findByText("Running Low on Credits"),
		).toBeInTheDocument();
		expect(
			screen.getByText(/You've used 84% of your credits/),
		).toBeInTheDocument();
	});

	it("shows upgrade and buy credits CTAs", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 80, used: 420 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 84,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		await screen.findByText("Running Low on Credits");
		expect(
			screen.getByText("Upgrade Plan for More Credits"),
		).toBeInTheDocument();
		expect(screen.getByText("Buy a Credit Pack")).toBeInTheDocument();
	});

	it("dismisses and stores timestamp when 'Remind me tomorrow' clicked", async () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 80, used: 420 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 84,
			totalCredits: 500,
		});
		const user = userEvent.setup({ delay: null });
		render(<LowCreditsUrgencyModal userId="user-123" />);
		await screen.findByText("Running Low on Credits");
		await user.click(screen.getByText("Remind me tomorrow"));
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
		expect(localStorage.getItem(DISMISS_KEY)).toBeTruthy();
	});

	it("does not show if already dismissed within 24h", () => {
		localStorage.setItem(DISMISS_KEY, String(Date.now() - 1000)); // 1 second ago
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 80, used: 420 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 84,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("uses org-scoped billing path when org is active", async () => {
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-org" },
		});
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance({ remaining: 80, used: 420 }),
			isLoading: false,
			isLowCredits: true,
			percentageUsed: 84,
			totalCredits: 500,
		});
		render(<LowCreditsUrgencyModal userId="user-123" />);
		await screen.findByText("Running Low on Credits");
		const upgradeLink = screen
			.getByText("Upgrade Plan for More Credits")
			.closest("a");
		expect(upgradeLink?.getAttribute("href")).toBe(
			"/app/my-org/settings/billing",
		);
	});
});
