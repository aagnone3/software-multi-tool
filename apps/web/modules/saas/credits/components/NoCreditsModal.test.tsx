import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NoCreditsModal } from "./NoCreditsModal";

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({ activeOrganization: null }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

const mockUseCreditsBalance = vi.fn();
vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

describe("NoCreditsModal", () => {
	beforeEach(() => {
		mockUseCreditsBalance.mockReturnValue({
			isStarterPlan: false,
			isFreePlan: true,
		});
		mockTrack.mockClear();
	});

	it("renders when open", () => {
		render(<NoCreditsModal open={true} onClose={vi.fn()} />);
		expect(screen.getByText("Out of credits")).toBeInTheDocument();
	});

	it("fires no_credits_modal_shown when opened", () => {
		render(
			<NoCreditsModal
				open={true}
				onClose={vi.fn()}
				toolName="Invoice Processor"
				creditCost={5}
			/>,
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "no_credits_modal_shown",
			props: { tool_name: "Invoice Processor", credit_cost: 5 },
		});
	});

	it("does not render when closed", () => {
		render(<NoCreditsModal open={false} onClose={vi.fn()} />);
		expect(screen.queryByText("Out of credits")).not.toBeInTheDocument();
	});

	it("shows generic message when no toolName/creditCost", () => {
		render(<NoCreditsModal open={true} onClose={vi.fn()} />);
		expect(
			screen.getByText(/you've used all your credits/i),
		).toBeInTheDocument();
	});

	it("shows tool-specific message when toolName and creditCost provided", () => {
		render(
			<NoCreditsModal
				open={true}
				onClose={vi.fn()}
				toolName="Invoice Processor"
				creditCost={5}
			/>,
		);
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(screen.getByText("5 credits")).toBeInTheDocument();
	});

	it("calls onClose when Maybe later is clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onClose = vi.fn();
		render(<NoCreditsModal open={true} onClose={onClose} />);
		await user.click(screen.getByRole("button", { name: /maybe later/i }));
		expect(onClose).toHaveBeenCalled();
	});

	describe("Free plan", () => {
		it("shows Buy Credits and Upgrade Plan links", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			const buyLinks = screen.getAllByRole("link", {
				name: /buy credits/i,
			});
			expect(buyLinks.length).toBeGreaterThan(0);
			expect(buyLinks[0].getAttribute("href")).toBe(
				"/app/settings/billing",
			);
			const upgradeLinks = screen.getAllByRole("link", {
				name: /upgrade plan/i,
			});
			expect(upgradeLinks.length).toBeGreaterThan(0);
		});

		it("uses /app/settings/billing when no active organization", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			const links = screen.getAllByRole("link");
			expect(
				links.some((l) =>
					l.getAttribute("href")?.includes("settings/billing"),
				),
			).toBe(true);
		});
	});

	describe("Starter plan", () => {
		beforeEach(() => {
			mockUseCreditsBalance.mockReturnValue({
				isStarterPlan: true,
				isFreePlan: false,
			});
		});

		it("shows Upgrade to Pro CTA instead of generic upgrade plan", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			expect(
				screen.getByRole("link", { name: /upgrade to pro/i }),
			).toBeInTheDocument();
		});

		it("shows Compare plans link", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			expect(
				screen.getByRole("link", { name: /compare plans/i }),
			).toBeInTheDocument();
		});

		it("Upgrade to Pro link points to billing with upgrade=pro", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			const link = screen.getByRole("link", { name: /upgrade to pro/i });
			expect(link.getAttribute("href")).toContain("upgrade=pro");
		});

		it("does not show Buy Credits option for Starter users", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			expect(
				screen.queryByRole("link", { name: /buy credits/i }),
			).not.toBeInTheDocument();
		});

		it("shows Pro feature highlights", () => {
			render(<NoCreditsModal open={true} onClose={vi.fn()} />);
			expect(screen.getByText(/5× more credits/i)).toBeInTheDocument();
		});
	});
});
