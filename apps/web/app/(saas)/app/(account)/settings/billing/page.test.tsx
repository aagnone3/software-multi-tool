import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("@repo/payments/lib/helper", () => ({
	createPurchasesHelper: (purchases: unknown[]) => ({
		activePlan: purchases.length > 0 ? { id: "pro" } : null,
	}),
}));

vi.mock("@saas/auth/lib/server", () => ({
	getSession: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: {
		payments: {
			listPurchases: vi.fn().mockResolvedValue({ purchases: [] }),
		},
	},
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			listPurchases: {
				queryKey: vi
					.fn()
					.mockReturnValue(["payments", "listPurchases"]),
				queryOptions: vi.fn().mockReturnValue({
					queryKey: ["payments", "listPurchases"],
					queryFn: vi.fn(),
				}),
			},
		},
	},
}));

vi.mock("@shared/lib/server", () => ({
	getServerQueryClient: () => ({
		prefetchQuery: vi.fn(),
	}),
}));

vi.mock("es-toolkit", () => ({
	attemptAsync: vi.fn().mockResolvedValue([null, { purchases: [] }]),
}));

vi.mock("@saas/credits/components/CreditAlertSettings", () => ({
	CreditAlertSettings: () => (
		<div data-testid="credit-alert-settings">CreditAlertSettings</div>
	),
}));
vi.mock("@saas/credits/components/CreditBalanceSection", () => ({
	CreditBalanceSection: () => (
		<div data-testid="credit-balance-section">CreditBalanceSection</div>
	),
}));
vi.mock("@saas/payments/components/ActivePlan", () => ({
	ActivePlan: () => <div data-testid="active-plan">ActivePlan</div>,
}));
vi.mock("@saas/payments/components/BillingTrustSection", () => ({
	BillingTrustSection: () => (
		<div data-testid="billing-trust-section">BillingTrustSection</div>
	),
}));
vi.mock("@saas/payments/components/ChangePlan", () => ({
	ChangePlan: () => <div data-testid="change-plan">ChangePlan</div>,
}));
vi.mock("@saas/payments/components/PaymentIssueAlert", () => ({
	PaymentIssueAlert: () => (
		<div data-testid="payment-issue-alert">PaymentIssueAlert</div>
	),
}));
vi.mock("@saas/payments/components/UpgradePromptBanner", () => ({
	UpgradePromptBanner: () => (
		<div data-testid="upgrade-prompt-banner">UpgradePromptBanner</div>
	),
}));
vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		children,
		title,
	}: {
		children: React.ReactNode;
		title: string;
	}) => (
		<div>
			<span>{title}</span>
			{children}
		</div>
	),
}));
vi.mock("@saas/shared/components/SettingsList", () => ({
	SettingsList: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

let BillingSettingsPage: () => Promise<React.ReactElement>;
let generateMetadata: () => Promise<{ title: string }>;

beforeAll(async () => {
	const mod = await import("./page");
	BillingSettingsPage = mod.default as typeof BillingSettingsPage;
	generateMetadata = mod.generateMetadata as typeof generateMetadata;
});

describe("BillingSettingsPage", () => {
	it("renders billing-related components", async () => {
		render(await BillingSettingsPage());
		expect(screen.getByTestId("upgrade-prompt-banner")).toBeInTheDocument();
		expect(
			screen.getByTestId("credit-balance-section"),
		).toBeInTheDocument();
		expect(screen.getByTestId("credit-alert-settings")).toBeInTheDocument();
		expect(screen.getByTestId("billing-trust-section")).toBeInTheDocument();
	});

	it("does not render ActivePlan when no active plan", async () => {
		render(await BillingSettingsPage());
		expect(screen.queryByTestId("active-plan")).not.toBeInTheDocument();
	});

	it("generateMetadata returns billing title", async () => {
		const meta = await generateMetadata();
		expect(meta.title).toBe("Billing");
	});
});
