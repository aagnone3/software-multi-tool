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

	it("free plan includes 10 credits", () => {
		const freeCredits = getPlanCredits("free");
		expect(freeCredits).toBeDefined();
		expect(freeCredits?.included).toBe(10);
	});

	it("pro plan includes 500 credits", () => {
		const proCredits = getPlanCredits("pro");
		expect(proCredits).toBeDefined();
		expect(proCredits?.included).toBe(500);
	});

	it("lifetime plan includes 1000 credits", () => {
		const lifetimeCredits = getPlanCredits("lifetime");
		expect(lifetimeCredits).toBeDefined();
		expect(lifetimeCredits?.included).toBe(1000);
	});

	it("enterprise plan includes 5000 credits", () => {
		const enterpriseCredits = getPlanCredits("enterprise");
		expect(enterpriseCredits).toBeDefined();
		expect(enterpriseCredits?.included).toBe(5000);
	});

	it("returns undefined for non-existent plan", () => {
		const credits = getPlanCredits("nonexistent");
		expect(credits).toBeUndefined();
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
