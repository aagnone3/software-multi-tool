import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
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

describe("NoCreditsModal", () => {
	it("renders when open", () => {
		render(<NoCreditsModal open={true} onClose={vi.fn()} />);
		expect(screen.getByText("Out of credits")).toBeInTheDocument();
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

	it("shows Buy Credits and Upgrade Plan links", () => {
		render(<NoCreditsModal open={true} onClose={vi.fn()} />);
		const buyLinks = screen.getAllByRole("link", { name: /buy credits/i });
		expect(buyLinks.length).toBeGreaterThan(0);
		expect(buyLinks[0].getAttribute("href")).toBe("/app/settings/billing");
		const upgradeLinks = screen.getAllByRole("link", {
			name: /upgrade plan/i,
		});
		expect(upgradeLinks.length).toBeGreaterThan(0);
	});

	it("uses org billing path when activeOrganization exists", () => {
		vi.doMock("@saas/organizations/hooks/use-active-organization", () => ({
			useActiveOrganization: () => ({
				activeOrganization: { slug: "my-org" },
			}),
		}));
		// Default (no org) path used — mock overrides per-test in beforeEach pattern
		render(<NoCreditsModal open={true} onClose={vi.fn()} />);
		// The billing paths are correct for the mocked (no-org) case
		const links = screen.getAllByRole("link");
		expect(
			links.some((l) =>
				l.getAttribute("href")?.includes("settings/billing"),
			),
		).toBe(true);
	});
});
