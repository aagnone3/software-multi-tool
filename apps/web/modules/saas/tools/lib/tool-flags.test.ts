import { afterEach, describe, expect, it, vi } from "vitest";

// Mock @repo/config
const mockRegistry = vi.hoisted(() => [
	{ slug: "news-analyzer", enabled: true, name: "News Analyzer" },
	{ slug: "invoice-processor", enabled: true, name: "Invoice Processor" },
	{ slug: "bg-remover", enabled: false, name: "Background Remover" },
]);

vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: mockRegistry,
		},
	},
}));

import {
	getEnabledTools,
	getToolsWithStatus,
	getVisibleTools,
	isToolEnabled,
	parseEnabledToolsEnv,
} from "./tool-flags";

describe("parseEnabledToolsEnv", () => {
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
	});

	it("returns null when env var is not set", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("returns null when env var is empty string", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "";
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("returns null when env var is only whitespace", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "   ";
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("parses a single tool slug", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		expect(parseEnabledToolsEnv()).toEqual(["news-analyzer"]);
	});

	it("parses multiple tool slugs", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS =
			"news-analyzer,invoice-processor";
		expect(parseEnabledToolsEnv()).toEqual([
			"news-analyzer",
			"invoice-processor",
		]);
	});

	it("trims whitespace around slugs", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS =
			" news-analyzer , invoice-processor ";
		expect(parseEnabledToolsEnv()).toEqual([
			"news-analyzer",
			"invoice-processor",
		]);
	});

	it("filters empty strings after split", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS =
			"news-analyzer,,invoice-processor";
		expect(parseEnabledToolsEnv()).toEqual([
			"news-analyzer",
			"invoice-processor",
		]);
	});
});

describe("isToolEnabled", () => {
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
	});

	it("returns false for unknown tool slug", () => {
		expect(isToolEnabled("unknown-tool")).toBe(false);
	});

	it("returns false for tool with enabled: false in config", () => {
		expect(isToolEnabled("bg-remover")).toBe(false);
	});

	it("returns true when ENABLED_TOOLS not set and tool is config-enabled", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		expect(isToolEnabled("news-analyzer")).toBe(true);
	});

	it("returns true when tool is in allowlist", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		expect(isToolEnabled("news-analyzer")).toBe(true);
	});

	it("returns false when tool is not in allowlist", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		expect(isToolEnabled("invoice-processor")).toBe(false);
	});

	it("returns false when tool is not in allowlist even if config-enabled", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "invoice-processor";
		expect(isToolEnabled("news-analyzer")).toBe(false);
	});
});

describe("getToolsWithStatus", () => {
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
	});

	it("returns all tools with status when ENABLED_TOOLS not set", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getToolsWithStatus();
		expect(tools).toHaveLength(3);
	});

	it("marks config-enabled tools as isEnabled when no env restriction", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getToolsWithStatus();
		const newsAnalyzer = tools.find((t) => t.slug === "news-analyzer");
		expect(newsAnalyzer?.isEnabled).toBe(true);
		expect(newsAnalyzer?.isComingSoon).toBe(false);
	});

	it("marks config-disabled tools as not enabled and not coming soon", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getToolsWithStatus();
		const bgRemover = tools.find((t) => t.slug === "bg-remover");
		expect(bgRemover?.isEnabled).toBe(false);
		expect(bgRemover?.isComingSoon).toBe(false);
	});

	it("marks tool as coming soon when config-enabled but not in env allowlist", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		const tools = getToolsWithStatus();
		const invoiceProcessor = tools.find(
			(t) => t.slug === "invoice-processor",
		);
		expect(invoiceProcessor?.isEnabled).toBe(false);
		expect(invoiceProcessor?.isComingSoon).toBe(true);
	});

	it("marks tool as enabled when in both config and env allowlist", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		const tools = getToolsWithStatus();
		const newsAnalyzer = tools.find((t) => t.slug === "news-analyzer");
		expect(newsAnalyzer?.isEnabled).toBe(true);
		expect(newsAnalyzer?.isComingSoon).toBe(false);
	});
});

describe("getEnabledTools", () => {
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
	});

	it("returns only enabled tools when no env restriction", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getEnabledTools();
		// news-analyzer and invoice-processor are config-enabled, bg-remover is not
		expect(tools).toHaveLength(2);
		expect(tools.every((t) => t.isEnabled)).toBe(true);
	});

	it("returns only allowed tools when env allowlist is set", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		const tools = getEnabledTools();
		expect(tools).toHaveLength(1);
		expect(tools[0].slug).toBe("news-analyzer");
	});
});

describe("getVisibleTools", () => {
	afterEach(() => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
	});

	it("returns enabled tools when no env restriction", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getVisibleTools();
		// news-analyzer and invoice-processor are enabled; bg-remover is config-disabled (not visible)
		expect(tools).toHaveLength(2);
	});

	it("returns both enabled and coming-soon tools when env allowlist is set", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "news-analyzer";
		const tools = getVisibleTools();
		// news-analyzer: enabled, invoice-processor: coming soon, bg-remover: not visible
		expect(tools).toHaveLength(2);
		const slugs = tools.map((t) => t.slug);
		expect(slugs).toContain("news-analyzer");
		expect(slugs).toContain("invoice-processor");
	});
});
