"use client";

import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { DiagramExport } from "./diagram-export";

// ---- module mocks ----
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({ activeOrganization: null })),
}));
vi.mock("next-themes", () => ({
	useTheme: vi.fn(() => ({ resolvedTheme: "light" })),
}));
vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";

const mockUseCreditsBalance = useCreditsBalance as ReturnType<typeof vi.fn>;

describe("DiagramExport inside UpgradeGate", () => {
	it("shows export buttons for Pro users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});

		const ref = { current: null };
		render(
			<UpgradeGate
				featureName="Diagram Export"
				description="Export your diagrams as PNG or SVG files."
			>
				<DiagramExport containerRef={ref} />
			</UpgradeGate>,
		);

		expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
		expect(screen.queryByText(/upgrade to unlock/i)).toBeNull();
	});

	it("shows upgrade prompt for free users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		const ref = { current: null };
		render(
			<UpgradeGate
				featureName="Diagram Export"
				description="Export your diagrams as PNG or SVG files."
			>
				<DiagramExport containerRef={ref} />
			</UpgradeGate>,
		);

		expect(
			screen.getByText(/upgrade to unlock diagram export/i),
		).toBeDefined();
		expect(
			screen.getByText(/export your diagrams as png or svg files/i),
		).toBeDefined();
	});
});
