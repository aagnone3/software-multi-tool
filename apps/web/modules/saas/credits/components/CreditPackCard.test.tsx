import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditPackCard } from "./CreditPackCard";

// Define mock pack with the same shape as CreditPack from @repo/config
const mockPack = {
	id: "bundle" as const,
	name: "Bundle",
	credits: 200,
	priceId: "price_test",
	amount: 14.99,
	currency: "USD",
};

describe("CreditPackCard", () => {
	it("renders pack name and credits", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);

		expect(screen.getByText("Bundle")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
		expect(screen.getByText("credits")).toBeInTheDocument();
	});

	it("renders formatted price", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);

		expect(screen.getByText("$14.99")).toBeInTheDocument();
	});

	it("renders price per credit", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);

		// 14.99 / 200 = 0.07495 ≈ $0.075/credit
		expect(screen.getByText("$0.075/credit")).toBeInTheDocument();
	});

	it("calls onPurchase when Buy Now button is clicked", () => {
		const onPurchase = vi.fn();
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={onPurchase}
				isPurchasing={false}
			/>,
		);

		fireEvent.click(screen.getByText("Buy Now"));
		expect(onPurchase).toHaveBeenCalledWith("bundle");
	});

	it("shows loading state when isPurchasing is true", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={true}
			/>,
		);

		const button = screen.getByTestId("purchase-bundle");
		expect(button).toBeDisabled();
	});

	it("shows Best Value badge when isRecommended is true", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
				isRecommended={true}
			/>,
		);

		expect(screen.getByText("Best Value")).toBeInTheDocument();
	});

	it("does not show Best Value badge when isRecommended is false", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
				isRecommended={false}
			/>,
		);

		expect(screen.queryByText("Best Value")).not.toBeInTheDocument();
	});

	it("renders with correct test id", () => {
		render(
			<CreditPackCard
				pack={mockPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);

		expect(screen.getByTestId("credit-pack-bundle")).toBeInTheDocument();
	});

	it("formats small price per credit with 3 decimal places", () => {
		const cheapPack = {
			...mockPack,
			id: "vault" as const,
			name: "Vault",
			credits: 500,
			amount: 29.99,
		};

		render(
			<CreditPackCard
				pack={cheapPack}
				onPurchase={vi.fn()}
				isPurchasing={false}
			/>,
		);

		// 29.99 / 500 = 0.05998 ≈ $0.060/credit
		expect(screen.getByText("$0.060/credit")).toBeInTheDocument();
	});
});
