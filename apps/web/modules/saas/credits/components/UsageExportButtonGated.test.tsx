"use client";

import { UpgradeGate } from "@saas/payments/components/UpgradeGate";
import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { UsageExportButton } from "./UsageExportButton";

// ---- module mocks ----
vi.mock("@saas/credits/hooks/use-credits-balance", () => ({
	useCreditsBalance: vi.fn(),
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: vi.fn(() => ({ activeOrganization: null })),
}));
vi.mock("../hooks/use-usage-stats", () => ({
	useUsageStats: vi.fn(() => ({
		byTool: [{ toolSlug: "news-analyzer", credits: 50, count: 5 }],
		byPeriod: [{ date: "2026-03-01", credits: 50 }],
		totalUsed: 50,
		totalOverage: 0,
		isLoading: false,
	})),
}));
vi.mock("../lib/format-tool-name", () => ({
	formatToolName: (slug: string) => slug,
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

describe("UsageExportButton inside UpgradeGate", () => {
	it("shows export button for Pro users", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: false,
			isLoading: false,
		});

		render(
			<UpgradeGate
				featureName="Usage Export"
				description="Export your usage report as CSV."
			>
				<UsageExportButton />
			</UpgradeGate>,
		);

		expect(
			screen.getByRole("button", { name: /export report/i }),
		).toBeDefined();
		expect(screen.queryByText(/upgrade to unlock/i)).toBeNull();
	});

	it("shows upgrade prompt for free users instead of export button", () => {
		mockUseCreditsBalance.mockReturnValue({
			isFreePlan: true,
			isLoading: false,
		});

		render(
			<UpgradeGate
				featureName="Usage Export"
				description="Export your usage report as CSV."
			>
				<UsageExportButton />
			</UpgradeGate>,
		);

		expect(
			screen.getByText(/upgrade to unlock usage export/i),
		).toBeDefined();
		expect(
			screen.getByText(/export your usage report as csv/i),
		).toBeDefined();
	});
});
