import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { EmptyStateUpgradeNudge } from "./EmptyStateUpgradeNudge";

vi.mock("@saas/payments/hooks/purchases", () => ({
	usePurchases: vi.fn(),
}));

import { usePurchases } from "@saas/payments/hooks/purchases";

const mockUsePurchases = vi.mocked(usePurchases);

describe("EmptyStateUpgradeNudge", () => {
	it("renders nothing for paid users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "pro", name: "Pro" },
		} as unknown as ReturnType<typeof usePurchases>);
		const { container } = render(<EmptyStateUpgradeNudge />);
		expect(container.firstChild).toBeNull();
	});

	it("renders nothing when activePlan is null", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: null,
		} as unknown as ReturnType<typeof usePurchases>);
		const { container } = render(<EmptyStateUpgradeNudge />);
		expect(container.firstChild).toBeNull();
	});

	it("renders upgrade nudge for free users — default context (jobs)", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free", name: "Free" },
		} as unknown as ReturnType<typeof usePurchases>);
		render(<EmptyStateUpgradeNudge />);
		expect(
			screen.getByText("Start running tools — get more with Pro"),
		).toBeInTheDocument();
		expect(screen.getByText("See plans")).toBeInTheDocument();
		expect(screen.getByText("Start free trial")).toBeInTheDocument();
	});

	it("renders tool context copy for free users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free", name: "Free" },
		} as unknown as ReturnType<typeof usePurchases>);
		render(<EmptyStateUpgradeNudge context="tool" />);
		expect(
			screen.getByText("Run this tool more with Pro"),
		).toBeInTheDocument();
		expect(screen.getByText("Upgrade now")).toBeInTheDocument();
	});

	it("renders credits context copy for free users", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free", name: "Free" },
		} as unknown as ReturnType<typeof usePurchases>);
		render(<EmptyStateUpgradeNudge context="credits" />);
		expect(
			screen.getByText("You've used all your credits"),
		).toBeInTheDocument();
		expect(screen.getByText("Upgrade now")).toBeInTheDocument();
	});

	it("links to org billing path when organizationId is provided", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free", name: "Free" },
		} as unknown as ReturnType<typeof usePurchases>);
		render(<EmptyStateUpgradeNudge organizationId="org-123" />);
		const links = screen
			.getAllByRole("link")
			.map((l) => l.getAttribute("href"));
		expect(links).toContain("/app/orgs/org-123/settings/billing");
	});

	it("links to personal billing path when no organizationId", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "free", name: "Free" },
		} as unknown as ReturnType<typeof usePurchases>);
		render(<EmptyStateUpgradeNudge />);
		const links = screen
			.getAllByRole("link")
			.map((l) => l.getAttribute("href"));
		expect(links).toContain("/app/settings/billing");
	});

	it("renders starter plan users as paid (no nudge)", () => {
		mockUsePurchases.mockReturnValue({
			activePlan: { id: "starter", name: "Starter" },
		} as unknown as ReturnType<typeof usePurchases>);
		const { container } = render(<EmptyStateUpgradeNudge />);
		expect(container.firstChild).toBeNull();
	});
});
