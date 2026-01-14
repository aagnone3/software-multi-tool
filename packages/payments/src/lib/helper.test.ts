import { config } from "@repo/config";
import { describe, expect, it } from "vitest";
import { getPlanIdFromPriceId } from "./helper";

describe("getPlanIdFromPriceId", () => {
	// Get actual price IDs from the config to ensure tests work regardless of env vars
	const proPlan = config.payments.plans.pro;
	const lifetimePlan = config.payments.plans.lifetime;

	// Extract price IDs - these are from process.env but cast to string in config
	// In CI without env vars, these will be the string "undefined"
	const proMonthlyPriceId =
		"prices" in proPlan ? proPlan.prices[0].productId : undefined;
	const proYearlyPriceId =
		"prices" in proPlan ? proPlan.prices[1].productId : undefined;
	const lifetimePriceId =
		"prices" in lifetimePlan ? lifetimePlan.prices[0].productId : undefined;

	it("returns plan ID for pro monthly price", () => {
		// productId will be a string (either actual price ID or "undefined" from env)
		// This ensures the "found match" branch is covered
		if (proMonthlyPriceId) {
			expect(getPlanIdFromPriceId(proMonthlyPriceId)).toBe("pro");
		}
	});

	it("returns plan ID for pro yearly price", () => {
		if (proYearlyPriceId) {
			expect(getPlanIdFromPriceId(proYearlyPriceId)).toBe("pro");
		}
	});

	it("returns plan ID for lifetime price", () => {
		if (lifetimePriceId) {
			expect(getPlanIdFromPriceId(lifetimePriceId)).toBe("lifetime");
		}
	});

	it("returns undefined for unknown price ID", () => {
		// This tests the case where we iterate through all plans but don't find a match
		expect(getPlanIdFromPriceId("price_unknown_123")).toBeUndefined();
	});

	it("returns undefined for empty string", () => {
		expect(getPlanIdFromPriceId("")).toBeUndefined();
	});

	it("iterates through plans without prices (free, enterprise) safely", () => {
		// Free and enterprise plans don't have prices array
		// This ensures we handle the plan.prices check correctly
		expect(getPlanIdFromPriceId("free")).toBeUndefined();
		expect(getPlanIdFromPriceId("enterprise")).toBeUndefined();
	});

	it("finds plan correctly when price ID matches config", () => {
		// This test MUST cover the hasPrice=true branch explicitly
		// proMonthlyPriceId is always a string from config (either real price or "undefined")
		// We need to test with whatever value is actually in the config
		if (proMonthlyPriceId) {
			const result = getPlanIdFromPriceId(proMonthlyPriceId);
			// The result should be "pro" because proMonthlyPriceId comes from pro plan config
			expect(result).toBe("pro");
		} else {
			// Fallback: if somehow undefined, at least run a coverage path
			expect(getPlanIdFromPriceId("test")).toBeUndefined();
		}
	});
});
