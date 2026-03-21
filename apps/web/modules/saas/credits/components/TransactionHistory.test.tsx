"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockUseCreditsHistory = vi.fn();
vi.mock("../hooks/use-credits-history", () => ({
	useCreditsHistory: () => mockUseCreditsHistory(),
}));

vi.mock("../lib/format-tool-name", () => ({
	formatToolName: (slug: string | null) => (slug ? slug.toUpperCase() : "—"),
}));

import { TransactionHistory } from "./TransactionHistory";

function makeTransaction(overrides = {}) {
	return {
		id: "tx-1",
		amount: -10,
		type: "USAGE" as const,
		toolSlug: "summarizer",
		jobId: "job-1",
		description: null,
		createdAt: "2024-01-15T10:00:00Z",
		...overrides,
	};
}

describe("TransactionHistory", () => {
	it("renders loading skeletons", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: true,
			transactions: [],
			pagination: null,
		});
		render(<TransactionHistory />);
		expect(screen.getByText("Transaction History")).toBeInTheDocument();
	});

	it("renders empty state when no transactions", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [],
			pagination: { total: 0 },
		});
		render(<TransactionHistory />);
		expect(screen.getByText(/No transactions found/i)).toBeInTheDocument();
	});

	it("renders transactions table", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction()],
			pagination: { total: 1 },
		});
		render(<TransactionHistory />);
		expect(screen.getByText("SUMMARIZER")).toBeInTheDocument();
	});

	it("shows positive credit for GRANT type", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction({ type: "GRANT", amount: 100 })],
			pagination: { total: 1 },
		});
		render(<TransactionHistory />);
		expect(screen.getByText("+100")).toBeInTheDocument();
	});

	it("shows negative credit for USAGE type", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [makeTransaction({ type: "USAGE", amount: -5 })],
			pagination: { total: 1 },
		});
		render(<TransactionHistory />);
		expect(screen.getByText("-5")).toBeInTheDocument();
	});

	it("shows purchase description as source", () => {
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: [
				makeTransaction({
					type: "PURCHASE",
					amount: 500,
					description:
						"Credit pack purchase: Starter (starter-500) - 500 credits",
				}),
			],
			pagination: { total: 1 },
		});
		render(<TransactionHistory />);
		expect(screen.getByText("Starter Pack")).toBeInTheDocument();
	});

	it("pagination buttons appear when total > page size", async () => {
		const user = userEvent.setup();
		mockUseCreditsHistory.mockReturnValue({
			isLoading: false,
			transactions: Array.from({ length: 20 }, (_, i) =>
				makeTransaction({ id: `tx-${i}`, amount: -1 }),
			),
			pagination: { total: 25 },
		});
		render(<TransactionHistory />);
		const nextBtn = screen.getByRole("button", { name: /next/i });
		expect(nextBtn).toBeInTheDocument();
		await user.click(nextBtn);
		// after clicking next, prev should appear
		expect(
			screen.getByRole("button", { name: /prev/i }),
		).toBeInTheDocument();
	});
});
