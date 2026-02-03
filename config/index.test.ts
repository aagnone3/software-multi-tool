import { afterAll, describe, expect, it, vi } from "vitest";
import {
	config,
	getCreditPackById,
	getCreditPackByPriceId,
	getCreditPacks,
	getPlanCredits,
	getToolCreditCost,
} from "./index";

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
	const originalEnv = { ...process.env };

	afterAll(() => {
		process.env = originalEnv;
	});

	it("starter plan has correct default pricing ($4.99/mo, $49.99/yr)", () => {
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

	it("pro plan has correct default pricing ($19.99/mo, $199.99/yr)", () => {
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

	it("pricing amounts can be overridden via environment variables", async () => {
		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_PRICE_STARTER_MONTHLY: "5.99",
			NEXT_PUBLIC_PRICE_STARTER_YEARLY: "59.99",
			NEXT_PUBLIC_PRICE_PRO_MONTHLY: "24.99",
			NEXT_PUBLIC_PRICE_PRO_YEARLY: "249.99",
		};

		const overridden = await import("./index");

		const starterMonthly =
			overridden.config.payments.plans.starter.prices?.find(
				(p) => p.type === "recurring" && p.interval === "month",
			);
		const starterYearly =
			overridden.config.payments.plans.starter.prices?.find(
				(p) => p.type === "recurring" && p.interval === "year",
			);
		const proMonthly = overridden.config.payments.plans.pro.prices?.find(
			(p) => p.type === "recurring" && p.interval === "month",
		);
		const proYearly = overridden.config.payments.plans.pro.prices?.find(
			(p) => p.type === "recurring" && p.interval === "year",
		);

		expect(starterMonthly?.amount).toBe(5.99);
		expect(starterYearly?.amount).toBe(59.99);
		expect(proMonthly?.amount).toBe(24.99);
		expect(proYearly?.amount).toBe(249.99);
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
			expect(tool.creditCost).toBeGreaterThanOrEqual(0);
		}
	});

	it("client-side only tools have zero credit cost", () => {
		const diagramEditor = config.tools.registry.find(
			(t) => t.slug === "diagram-editor",
		);
		expect(diagramEditor?.creditCost).toBe(0);
	});

	it("getToolCreditCost returns correct cost for known tools", () => {
		expect(getToolCreditCost("bg-remover")).toBe(1);
		expect(getToolCreditCost("speaker-separation")).toBe(2);
		expect(getToolCreditCost("invoice-processor")).toBe(3);
		expect(getToolCreditCost("contract-analyzer")).toBe(5);
	});

	it("getToolCreditCost returns undefined for unknown tool", () => {
		expect(getToolCreditCost("nonexistent")).toBeUndefined();
	});

	it("variable-cost tools have creditUnit defined", () => {
		const speakerSeparation = config.tools.registry.find(
			(t) => t.slug === "speaker-separation",
		);
		expect(speakerSeparation?.creditUnit).toBe("minute");

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

describe("credit pack configuration", () => {
	it("config has exactly three credit packs: boost, bundle, vault", () => {
		const packs = getCreditPacks();
		expect(packs).toHaveLength(3);

		const packIds = packs.map((p) => p.id);
		expect(packIds).toContain("boost");
		expect(packIds).toContain("bundle");
		expect(packIds).toContain("vault");
	});

	it("boost pack has 50 credits at $4.99", () => {
		const boost = getCreditPackById("boost");
		expect(boost).toBeDefined();
		expect(boost?.credits).toBe(50);
		expect(boost?.amount).toBe(4.99);
		expect(boost?.currency).toBe("USD");
		expect(boost?.name).toBe("Boost");
	});

	it("bundle pack has 200 credits at $14.99", () => {
		const bundle = getCreditPackById("bundle");
		expect(bundle).toBeDefined();
		expect(bundle?.credits).toBe(200);
		expect(bundle?.amount).toBe(14.99);
		expect(bundle?.currency).toBe("USD");
		expect(bundle?.name).toBe("Bundle");
	});

	it("vault pack has 500 credits at $29.99", () => {
		const vault = getCreditPackById("vault");
		expect(vault).toBeDefined();
		expect(vault?.credits).toBe(500);
		expect(vault?.amount).toBe(29.99);
		expect(vault?.currency).toBe("USD");
		expect(vault?.name).toBe("Vault");
	});

	it("getCreditPackById returns undefined for non-existent pack", () => {
		const pack = getCreditPackById("nonexistent");
		expect(pack).toBeUndefined();
	});

	it("getCreditPackByPriceId returns correct pack", () => {
		// Get a pack first to get its priceId
		const boost = getCreditPackById("boost");
		expect(boost).toBeDefined();
		if (!boost) {
			throw new Error("Boost pack should be defined");
		}

		// Look up by priceId
		const foundPack = getCreditPackByPriceId(boost.priceId);
		expect(foundPack).toBeDefined();
		expect(foundPack?.id).toBe("boost");
	});

	it("getCreditPackByPriceId returns undefined for non-existent priceId", () => {
		const pack = getCreditPackByPriceId("price_nonexistent");
		expect(pack).toBeUndefined();
	});

	it("credit packs offer volume discounts (lower $/credit for larger packs)", () => {
		const packs = getCreditPacks();

		const costPerCredit = packs.map((p) => ({
			id: p.id,
			credits: p.credits,
			costPerCredit: p.amount / p.credits,
		}));

		// Sort by credits ascending (boost, bundle, vault)
		costPerCredit.sort((a, b) => a.credits - b.credits);

		// Verify descending cost per credit (larger packs = better value)
		expect(costPerCredit[0].id).toBe("boost");
		expect(costPerCredit[1].id).toBe("bundle");
		expect(costPerCredit[2].id).toBe("vault");

		// Boost ($0.10/credit) > Bundle ($0.075/credit) > Vault ($0.06/credit)
		expect(costPerCredit[0].costPerCredit).toBeGreaterThan(
			costPerCredit[1].costPerCredit,
		);
		expect(costPerCredit[1].costPerCredit).toBeGreaterThan(
			costPerCredit[2].costPerCredit,
		);
	});

	it("all credit packs have required fields", () => {
		const packs = getCreditPacks();

		for (const pack of packs) {
			expect(pack.id).toBeDefined();
			expect(pack.name).toBeDefined();
			expect(pack.credits).toBeGreaterThan(0);
			expect(pack.amount).toBeGreaterThan(0);
			expect(pack.currency).toBe("USD");
			// priceId comes from environment, so it may be undefined in tests
			expect("priceId" in pack).toBe(true);
		}
	});
});

describe("blog configuration", () => {
	it("config.ui.blog exists and has enabled property", () => {
		expect(config.ui.blog).toBeDefined();
		expect(typeof config.ui.blog.enabled).toBe("boolean");
	});

	it("blog is disabled by default", () => {
		expect(config.ui.blog.enabled).toBe(false);
	});

	it("blog config is part of the ui section", () => {
		expect("blog" in config.ui).toBe(true);
		expect(config.ui.blog).toHaveProperty("enabled");
	});
});
