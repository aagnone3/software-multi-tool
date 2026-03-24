import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { CreditPurchaseConfirmDialog } from "./CreditPurchaseConfirmDialog";

const mockPack = {
	id: "bundle",
	name: "Bundle Pack",
	credits: 500,
	amount: 19.99,
	currency: "USD",
	priceId: "price_test_bundle",
};

describe("CreditPurchaseConfirmDialog", () => {
	it("renders nothing when pack is null", () => {
		const { container } = render(
			<CreditPurchaseConfirmDialog
				pack={null}
				open={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(container.firstChild).toBeNull();
	});

	it("renders confirmation dialog when open with pack", () => {
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText("Confirm Purchase")).toBeInTheDocument();
		expect(screen.getAllByText(/Bundle Pack/).length).toBeGreaterThan(0);
	});

	it("shows credit count and price", () => {
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		expect(screen.getByText(/500 credits/)).toBeInTheDocument();
		expect(screen.getByText("$19.99")).toBeInTheDocument();
	});

	it("shows price per credit", () => {
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
			/>,
		);
		// $19.99 / 500 = $0.040/credit
		expect(screen.getByText(/\$0\.04.*\/credit/)).toBeInTheDocument();
	});

	it("calls onConfirm when Proceed to Checkout clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onConfirm = vi.fn();
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={onConfirm}
				onCancel={vi.fn()}
			/>,
		);
		await user.click(
			screen.getByRole("button", { name: /proceed to checkout/i }),
		);
		expect(onConfirm).toHaveBeenCalled();
	});

	it("calls onCancel when Cancel clicked", async () => {
		const user = userEvent.setup({ delay: null });
		const onCancel = vi.fn();
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={vi.fn()}
				onCancel={onCancel}
			/>,
		);
		await user.click(screen.getByRole("button", { name: /cancel/i }));
		expect(onCancel).toHaveBeenCalled();
	});

	it("disables Cancel and shows loading on Confirm when isPurchasing", () => {
		render(
			<CreditPurchaseConfirmDialog
				pack={mockPack}
				open={true}
				onConfirm={vi.fn()}
				onCancel={vi.fn()}
				isPurchasing={true}
			/>,
		);
		expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
	});
});
