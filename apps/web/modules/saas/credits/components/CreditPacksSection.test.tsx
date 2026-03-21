import { render, screen } from "@testing-library/react";
import React, { type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

const mockGetCreditPacks = vi.fn();
const mockUseCreditPackPurchase = vi.fn();

vi.mock("@repo/config", () => ({
	getCreditPacks: () => mockGetCreditPacks(),
}));

vi.mock("../hooks/use-credit-pack-purchase", () => ({
	useCreditPackPurchase: () => mockUseCreditPackPurchase(),
}));

vi.mock("./CreditPackCard", () => {
	const React = require("react");
	return {
		CreditPackCard: ({ pack }: { pack: { id: string; name?: string } }) =>
			React.createElement(
				"div",
				{ "data-testid": `pack-${pack.id}` },
				pack.id,
			),
	};
});

vi.mock("@saas/shared/components/SettingsItem", () => {
	const React = require("react");
	return {
		SettingsItem: ({
			children,
			title,
		}: {
			children: ReactNode;
			title: string;
		}) =>
			React.createElement(
				"div",
				{ "data-testid": "settings-item" },
				React.createElement("span", null, title),
				children,
			),
	};
});

vi.mock("sonner", () => ({
	toast: { error: vi.fn() },
}));

import { CreditPacksSection } from "./CreditPacksSection";

const defaultPurchaseResult = {
	purchasePack: vi.fn(),
	isPurchasing: false,
	purchasingPackId: null,
};

describe("CreditPacksSection", () => {
	it("renders nothing when no credit packs configured", () => {
		mockGetCreditPacks.mockReturnValue([]);
		mockUseCreditPackPurchase.mockReturnValue(defaultPurchaseResult);
		const { container } = render(<CreditPacksSection />);
		expect(container).toBeEmptyDOMElement();
	});

	it("renders packs when configured", () => {
		mockGetCreditPacks.mockReturnValue([
			{ id: "boost", name: "Boost" },
			{ id: "bundle", name: "Bundle" },
		]);
		mockUseCreditPackPurchase.mockReturnValue(defaultPurchaseResult);
		render(<CreditPacksSection />);
		expect(screen.getByTestId("pack-boost")).toBeInTheDocument();
		expect(screen.getByTestId("pack-bundle")).toBeInTheDocument();
	});

	it("renders the settings item title", () => {
		mockGetCreditPacks.mockReturnValue([{ id: "boost", name: "Boost" }]);
		mockUseCreditPackPurchase.mockReturnValue(defaultPurchaseResult);
		render(<CreditPacksSection />);
		expect(screen.getByText("Buy credits")).toBeInTheDocument();
	});

	it("renders grid container with correct testid", () => {
		mockGetCreditPacks.mockReturnValue([{ id: "boost", name: "Boost" }]);
		mockUseCreditPackPurchase.mockReturnValue(defaultPurchaseResult);
		render(<CreditPacksSection />);
		expect(screen.getByTestId("credit-packs-grid")).toBeInTheDocument();
	});
});
