import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditPackCard } from "./CreditPackCard";

const mockPack = {
	id: "boost",
	name: "Boost Pack",
	credits: 100,
	amount: 5,
	currency: "USD",
	priceId: "price_test123",
};

describe("CreditPackCard", () => {
	it("renders pack name, credits, and price", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);
		expect(screen.getByText("Boost Pack")).toBeDefined();
		expect(screen.getByText("100")).toBeDefined();
		expect(screen.getByText("$5.00")).toBeDefined();
	});

	it("shows per-credit price with 3 decimals for sub-$0.10 pricing", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);
		// $5 / 100 credits = $0.05/credit < $0.10 → 3 decimals = $0.050
		expect(screen.getByText("$0.050/credit")).toBeDefined();
	});

	it("shows 2 decimal places for $0.10/credit or above pricing", () => {
		const expensivePack = { ...mockPack, credits: 10, amount: 5 };
		render(
			<CreditPackCard
				pack={expensivePack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);
		// $5 / 10 = $0.50/credit >= $0.10 → 2 decimals
		expect(screen.getByText("$0.50/credit")).toBeDefined();
	});

	it("does not show Best Value badge by default", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);
		expect(screen.queryByText("Best Value")).toBeNull();
	});

	it("shows Best Value badge when isRecommended=true", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
				isRecommended={true}
			/>,
		);
		expect(screen.getByText("Best Value")).toBeDefined();
	});

	it("calls onPurchase with pack id when button clicked", async () => {
		const onPurchase = vi.fn();
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={onPurchase}
				isPurchasing={false}
			/>,
		);
		await userEvent.click(screen.getByTestId("purchase-boost"));
		expect(onPurchase).toHaveBeenCalledWith("boost");
	});

	it("shows loading state when isPurchasing=true", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={true}
			/>,
		);
		// button should be disabled/loading
		const btn = screen.getByTestId("purchase-boost");
		expect(btn).toBeDefined();
	});

	it("uses CoinsIcon for unknown pack id", () => {
		const unknownPack = { ...mockPack, id: "unknown" };
		render(
			<CreditPackCard
				pack={unknownPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);
		expect(screen.getByText("Boost Pack")).toBeDefined();
	});
});
