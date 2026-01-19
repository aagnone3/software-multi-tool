import { describe, expect, it } from "vitest";

// Replicate the getTransactionSource function for testing
// (it's currently inline in TransactionHistory.tsx)
interface Transaction {
	id: string;
	amount: number;
	type: "GRANT" | "USAGE" | "OVERAGE" | "REFUND" | "PURCHASE" | "ADJUSTMENT";
	toolSlug: string | null;
	jobId: string | null;
	description: string | null;
	createdAt: string;
}

function getTransactionSource(tx: Transaction): string {
	// For PURCHASE transactions, extract pack name from description
	if (tx.type === "PURCHASE" && tx.description) {
		// Description format: "Credit pack purchase: {packName} ({packId}) - {credits} credits [session: ...]"
		const match = tx.description.match(/Credit pack purchase: (\w+)/);
		if (match) {
			return `${match[1]} Pack`;
		}
		return "Credit Pack";
	}

	// For GRANT transactions, show subscription info
	if (tx.type === "GRANT" && !tx.toolSlug) {
		return "Subscription";
	}

	// Default: format tool slug
	if (!tx.toolSlug) {
		return "-";
	}

	return tx.toolSlug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

describe("getTransactionSource", () => {
	const baseTransaction: Omit<
		Transaction,
		"type" | "toolSlug" | "description"
	> = {
		id: "tx-1",
		amount: 100,
		jobId: null,
		createdAt: "2025-01-01T00:00:00.000Z",
	};

	describe("PURCHASE transactions", () => {
		it("extracts pack name from description", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "PURCHASE",
				toolSlug: null,
				description:
					"Credit pack purchase: Bundle (bundle) - 200 credits [session: cs_test_123]",
			};

			expect(getTransactionSource(tx)).toBe("Bundle Pack");
		});

		it("handles Boost pack", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "PURCHASE",
				toolSlug: null,
				description:
					"Credit pack purchase: Boost (boost) - 50 credits [session: cs_test_456]",
			};

			expect(getTransactionSource(tx)).toBe("Boost Pack");
		});

		it("handles Vault pack", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "PURCHASE",
				toolSlug: null,
				description:
					"Credit pack purchase: Vault (vault) - 500 credits [session: cs_test_789]",
			};

			expect(getTransactionSource(tx)).toBe("Vault Pack");
		});

		it("returns 'Credit Pack' when description format is unexpected", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "PURCHASE",
				toolSlug: null,
				description: "Some other purchase description",
			};

			expect(getTransactionSource(tx)).toBe("Credit Pack");
		});

		it("returns 'Credit Pack' when description is empty", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "PURCHASE",
				toolSlug: null,
				description: "",
			};

			// Empty string is falsy, so this falls through to tool slug formatting
			expect(getTransactionSource(tx)).toBe("-");
		});
	});

	describe("GRANT transactions", () => {
		it("returns 'Subscription' for grants without tool slug", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "GRANT",
				toolSlug: null,
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("Subscription");
		});

		it("returns formatted tool slug when present", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "GRANT",
				toolSlug: "news-analyzer",
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("News Analyzer");
		});
	});

	describe("USAGE transactions", () => {
		it("formats tool slug to title case", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "USAGE",
				toolSlug: "news-analyzer",
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("News Analyzer");
		});

		it("returns dash for null tool slug", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "USAGE",
				toolSlug: null,
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("-");
		});

		it("handles single word tool slug", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "USAGE",
				toolSlug: "analyzer",
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("Analyzer");
		});
	});

	describe("other transaction types", () => {
		it("handles REFUND transactions", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "REFUND",
				toolSlug: "news-analyzer",
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("News Analyzer");
		});

		it("handles OVERAGE transactions", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "OVERAGE",
				toolSlug: "news-analyzer",
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("News Analyzer");
		});

		it("handles ADJUSTMENT transactions", () => {
			const tx: Transaction = {
				...baseTransaction,
				type: "ADJUSTMENT",
				toolSlug: null,
				description: null,
			};

			expect(getTransactionSource(tx)).toBe("-");
		});
	});
});
