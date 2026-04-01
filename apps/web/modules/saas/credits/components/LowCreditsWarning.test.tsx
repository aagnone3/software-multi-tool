import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/link", () => ({
	default: ({ children, href }: { children: ReactNode; href: string }) =>
		React.createElement("a", { href }, children),
}));

const mockUseCreditsBalance = vi.fn();
vi.mock("../hooks/use-credits-balance", () => ({
	useCreditsBalance: () => mockUseCreditsBalance(),
}));

const mockUseActiveOrganization = vi.fn();
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => mockUseActiveOrganization(),
}));

vi.mock("@ui/components/alert", () => {
	const React = require("react");
	return {
		Alert: ({
			children,
			variant,
		}: {
			children: ReactNode;
			variant?: string;
		}) =>
			React.createElement(
				"div",
				{ "data-testid": "alert", "data-variant": variant },
				children,
			),
		AlertTitle: ({ children }: { children: ReactNode }) =>
			React.createElement(
				"div",
				{ "data-testid": "alert-title" },
				children,
			),
		AlertDescription: ({ children }: { children: ReactNode }) =>
			React.createElement(
				"div",
				{ "data-testid": "alert-description" },
				children,
			),
	};
});

vi.mock("@ui/components/button", () => {
	const React = require("react");
	return {
		Button: ({ children }: { children: ReactNode; asChild?: boolean }) =>
			React.createElement("div", { "data-testid": "button" }, children),
	};
});

import { LowCreditsWarning } from "./LowCreditsWarning";

const makeBalance = (remaining: number, included: number, plan = "Free") => ({
	remaining,
	included,
	purchasedCredits: 0,
	plan: { id: "free", name: plan },
});

describe("LowCreditsWarning", () => {
	it("renders nothing when loading", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: true,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		const { container } = render(<LowCreditsWarning />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when balance is null", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: null,
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		const { container } = render(<LowCreditsWarning />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when credits are above threshold", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(80, 100),
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		const { container } = render(<LowCreditsWarning />);
		expect(container.firstChild).toBeNull();
	});

	it("renders warning when credits are below default threshold (20%)", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(10, 100),
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning />);
		expect(screen.getByTestId("alert")).toBeTruthy();
		expect(screen.getByTestId("alert-title").textContent).toBe(
			"Low on credits",
		);
	});

	it("shows remaining and included credits in description", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(15, 100, "Pro"),
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning />);
		const desc = screen.getByTestId("alert-description").textContent;
		expect(desc).toContain("15");
		expect(desc).toContain("100");
		expect(desc).toContain("Pro");
	});

	it("shows purchased credits when present", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: { ...makeBalance(10, 100), purchasedCredits: 50 },
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning />);
		const desc = screen.getByTestId("alert-description").textContent;
		expect(desc).toContain("50 purchased credits");
	});

	it("uses org billing path when organization is active", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(5, 100),
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: { slug: "my-org" },
		});
		render(<LowCreditsWarning />);
		const links = document.querySelectorAll("a");
		expect(
			Array.from(links).some((l) =>
				l.getAttribute("href")?.includes("my-org"),
			),
		).toBe(true);
	});

	it("hides action buttons when showActionButtons is false", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(5, 100),
			isLoading: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning showActionButtons={false} />);
		expect(screen.queryAllByTestId("button")).toHaveLength(0);
	});

	it("shows Upgrade to Pro and Compare plans CTAs for Starter plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: {
				...makeBalance(10, 100, "Starter"),
				plan: { id: "starter", name: "Starter" },
			},
			isLoading: false,
			isStarterPlan: true,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning />);
		const links = Array.from(document.querySelectorAll("a"));
		const linkTexts = links.map((l) => l.textContent);
		expect(linkTexts).toContain("Upgrade to Pro");
		expect(linkTexts).toContain("Compare plans");
	});

	it("shows Buy Credits and Upgrade Plan CTAs for Free plan users", () => {
		mockUseCreditsBalance.mockReturnValue({
			balance: makeBalance(10, 100),
			isLoading: false,
			isStarterPlan: false,
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		render(<LowCreditsWarning />);
		const links = Array.from(document.querySelectorAll("a"));
		const linkTexts = links.map((l) => l.textContent);
		expect(linkTexts).toContain("Buy Credits");
		expect(linkTexts).toContain("Upgrade Plan");
	});
});
