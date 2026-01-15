import { afterAll, describe, expect, it, vi } from "vitest";
import { config, getPlanCredits, getToolCreditCost } from "./index";

describe("config", () => {
	const originalEnv = { ...process.env };

	afterAll(() => {
		process.env = originalEnv;
	});

	it("exposes defaults and honors environment overrides", async () => {
		vi.resetModules();
		process.env = { ...originalEnv };

		const defaults = await import("./index");
		expect(defaults.config.appName).toBe("Software Multitool");
		expect(defaults.config.storage.bucketNames.avatars).toBe("avatars");

		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_AVATARS_BUCKET_NAME: "custom-bucket",
		};

		const overridden = await import("./index");
		expect(overridden.config.storage.bucketNames.avatars).toBe(
			"custom-bucket",
		);
	});
});

describe("plan credits configuration", () => {
	it("all plans have credit configuration with included credits", () => {
		const planIds = Object.keys(config.payments.plans);
		for (const planId of planIds) {
			const credits = getPlanCredits(planId);
			expect(credits).toBeDefined();
			expect(credits?.included).toBeGreaterThanOrEqual(0);
		}
	});

	it("config has exactly three plans: free, starter, pro", () => {
		const planIds = Object.keys(config.payments.plans);
		expect(planIds).toHaveLength(3);
		expect(planIds).toContain("free");
		expect(planIds).toContain("starter");
		expect(planIds).toContain("pro");
	});

	it("free plan includes 10 credits", () => {
		const freeCredits = getPlanCredits("free");
		expect(freeCredits).toBeDefined();
		expect(freeCredits?.included).toBe(10);
	});

	it("starter plan includes 100 credits", () => {
		const starterCredits = getPlanCredits("starter");
		expect(starterCredits).toBeDefined();
		expect(starterCredits?.included).toBe(100);
	});

	it("pro plan includes 500 credits", () => {
		const proCredits = getPlanCredits("pro");
		expect(proCredits).toBeDefined();
		expect(proCredits?.included).toBe(500);
	});

	it("returns undefined for non-existent plan", () => {
		const credits = getPlanCredits("nonexistent");
		expect(credits).toBeUndefined();
	});
});

describe("plan pricing configuration", () => {
	it("starter plan has correct pricing ($4.99/mo, $49.99/yr)", () => {
		const starterPlan = config.payments.plans.starter;
		expect(starterPlan.prices).toHaveLength(2);

		const monthlyPrice = starterPlan.prices?.find(
			(p) => p.type === "recurring" && p.interval === "month",
		);
		const yearlyPrice = starterPlan.prices?.find(
			(p) => p.type === "recurring" && p.interval === "year",
		);

		expect(monthlyPrice?.amount).toBe(4.99);
		expect(yearlyPrice?.amount).toBe(49.99);
	});

	it("pro plan has correct pricing ($19.99/mo, $199.99/yr)", () => {
		const proPlan = config.payments.plans.pro;
		expect(proPlan.prices).toHaveLength(2);

		const monthlyPrice = proPlan.prices?.find(
			(p) => p.type === "recurring" && p.interval === "month",
		);
		const yearlyPrice = proPlan.prices?.find(
			(p) => p.type === "recurring" && p.interval === "year",
		);

		expect(monthlyPrice?.amount).toBe(19.99);
		expect(yearlyPrice?.amount).toBe(199.99);
	});

	it("pro plan is marked as recommended", () => {
		const proPlan = config.payments.plans.pro;
		expect(proPlan.recommended).toBe(true);
	});

	it("paid plans have 7-day trial period", () => {
		const starterPlan = config.payments.plans.starter;
		const proPlan = config.payments.plans.pro;

		for (const price of starterPlan.prices ?? []) {
			if (price.type === "recurring") {
				expect(price.trialPeriodDays).toBe(7);
			}
		}

		for (const price of proPlan.prices ?? []) {
			if (price.type === "recurring") {
				expect(price.trialPeriodDays).toBe(7);
			}
		}
	});
});

describe("tool credit costs", () => {
	it("all tools have credit costs defined", () => {
		for (const tool of config.tools.registry) {
			expect(tool.creditCost).toBeGreaterThan(0);
		}
	});

	it("getToolCreditCost returns correct cost for known tools", () => {
		expect(getToolCreditCost("bg-remover")).toBe(1);
		expect(getToolCreditCost("diarization")).toBe(2);
		expect(getToolCreditCost("invoice-processor")).toBe(3);
		expect(getToolCreditCost("contract-analyzer")).toBe(5);
	});

	it("getToolCreditCost returns undefined for unknown tool", () => {
		expect(getToolCreditCost("nonexistent")).toBeUndefined();
	});

	it("variable-cost tools have creditUnit defined", () => {
		const diarization = config.tools.registry.find(
			(t) => t.slug === "diarization",
		);
		expect(diarization?.creditUnit).toBe("minute");

		const contractAnalyzer = config.tools.registry.find(
			(t) => t.slug === "contract-analyzer",
		);
		expect(contractAnalyzer?.creditUnit).toBe("page");
	});

	it("fixed-cost tools do not have creditUnit", () => {
		const bgRemover = config.tools.registry.find(
			(t) => t.slug === "bg-remover",
		);
		expect("creditUnit" in (bgRemover ?? {})).toBe(false);

		const newsAnalyzer = config.tools.registry.find(
			(t) => t.slug === "news-analyzer",
		);
		expect("creditUnit" in (newsAnalyzer ?? {})).toBe(false);
	});
});
