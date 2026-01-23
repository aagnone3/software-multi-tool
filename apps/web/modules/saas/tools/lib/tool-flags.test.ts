import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getEnabledTools,
	getToolsWithStatus,
	getVisibleTools,
	isToolEnabled,
	parseEnabledToolsEnv,
} from "./tool-flags";

// Mock the config module
vi.mock("@repo/config", () => ({
	config: {
		tools: {
			registry: [
				{
					slug: "bg-remover",
					name: "Background Remover",
					description: "Remove backgrounds from images",
					icon: "image-minus",
					public: true,
					enabled: true,
					creditCost: 1,
				},
				{
					slug: "news-analyzer",
					name: "News Analyzer",
					description: "Analyze news articles",
					icon: "newspaper",
					public: true,
					enabled: true,
					creditCost: 1,
				},
				{
					slug: "speaker-separation",
					name: "Speaker Separation",
					description:
						"Separate and identify speakers in audio files",
					icon: "audio-lines",
					public: true,
					enabled: true,
					creditCost: 2,
				},
				{
					slug: "disabled-tool",
					name: "Disabled Tool",
					description: "A tool disabled in config",
					icon: "x",
					public: true,
					enabled: false, // Disabled in config
					creditCost: 1,
				},
			],
		},
	},
}));

describe("parseEnabledToolsEnv", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns null when NEXT_PUBLIC_ENABLED_TOOLS is not set", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("returns null when NEXT_PUBLIC_ENABLED_TOOLS is empty string", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "";
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("returns null when NEXT_PUBLIC_ENABLED_TOOLS is only whitespace", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "   ";
		expect(parseEnabledToolsEnv()).toBeNull();
	});

	it("parses a single tool slug", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
		expect(parseEnabledToolsEnv()).toEqual(["bg-remover"]);
	});

	it("parses multiple comma-separated tool slugs", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS =
			"bg-remover,news-analyzer,speaker-separation";
		expect(parseEnabledToolsEnv()).toEqual([
			"bg-remover",
			"news-analyzer",
			"speaker-separation",
		]);
	});

	it("trims whitespace from slugs", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS =
			" bg-remover , news-analyzer , speaker-separation ";
		expect(parseEnabledToolsEnv()).toEqual([
			"bg-remover",
			"news-analyzer",
			"speaker-separation",
		]);
	});

	it("filters out empty strings from parsed list", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover,,news-analyzer,";
		expect(parseEnabledToolsEnv()).toEqual(["bg-remover", "news-analyzer"]);
	});

	it("handles whitespace-only entries", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover,   ,news-analyzer";
		expect(parseEnabledToolsEnv()).toEqual(["bg-remover", "news-analyzer"]);
	});
});

describe("isToolEnabled", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	describe("when NEXT_PUBLIC_ENABLED_TOOLS is not set", () => {
		beforeEach(() => {
			delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		});

		it("returns true for tools with enabled: true in config", () => {
			expect(isToolEnabled("bg-remover")).toBe(true);
			expect(isToolEnabled("news-analyzer")).toBe(true);
			expect(isToolEnabled("speaker-separation")).toBe(true);
		});

		it("returns false for tools with enabled: false in config", () => {
			expect(isToolEnabled("disabled-tool")).toBe(false);
		});

		it("returns false for non-existent tools", () => {
			expect(isToolEnabled("non-existent-tool")).toBe(false);
		});
	});

	describe("when NEXT_PUBLIC_ENABLED_TOOLS is set", () => {
		it("returns true for tools in the allowlist", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover,news-analyzer";
			expect(isToolEnabled("bg-remover")).toBe(true);
			expect(isToolEnabled("news-analyzer")).toBe(true);
		});

		it("returns false for tools not in the allowlist", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
			expect(isToolEnabled("news-analyzer")).toBe(false);
			expect(isToolEnabled("speaker-separation")).toBe(false);
		});

		it("returns false for tools disabled in config even if in allowlist", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "disabled-tool";
			expect(isToolEnabled("disabled-tool")).toBe(false);
		});

		it("returns false for non-existent tools even if in allowlist", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "non-existent-tool";
			expect(isToolEnabled("non-existent-tool")).toBe(false);
		});

		it("handles allowlist with whitespace", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS =
				" bg-remover , news-analyzer ";
			expect(isToolEnabled("bg-remover")).toBe(true);
			expect(isToolEnabled("news-analyzer")).toBe(true);
		});
	});

	describe("edge cases", () => {
		it("returns false for empty string slug", () => {
			expect(isToolEnabled("")).toBe(false);
		});

		it("is case-sensitive for slug matching", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
			expect(isToolEnabled("BG-REMOVER")).toBe(false);
			expect(isToolEnabled("Bg-Remover")).toBe(false);
		});
	});
});

describe("getToolsWithStatus", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns all tools from registry with status", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getToolsWithStatus();
		expect(tools).toHaveLength(4);
		expect(tools.map((t) => t.slug)).toEqual([
			"bg-remover",
			"news-analyzer",
			"speaker-separation",
			"disabled-tool",
		]);
	});

	describe("when NEXT_PUBLIC_ENABLED_TOOLS is not set", () => {
		beforeEach(() => {
			delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		});

		it("marks config-enabled tools as isEnabled: true", () => {
			const tools = getToolsWithStatus();
			const bgRemover = tools.find((t) => t.slug === "bg-remover");
			expect(bgRemover?.isEnabled).toBe(true);
			expect(bgRemover?.isComingSoon).toBe(false);
		});

		it("marks config-disabled tools as isEnabled: false, isComingSoon: false", () => {
			const tools = getToolsWithStatus();
			const disabledTool = tools.find((t) => t.slug === "disabled-tool");
			expect(disabledTool?.isEnabled).toBe(false);
			expect(disabledTool?.isComingSoon).toBe(false);
		});
	});

	describe("when NEXT_PUBLIC_ENABLED_TOOLS is set", () => {
		it("marks tools in allowlist as isEnabled: true", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
			const tools = getToolsWithStatus();
			const bgRemover = tools.find((t) => t.slug === "bg-remover");
			expect(bgRemover?.isEnabled).toBe(true);
			expect(bgRemover?.isComingSoon).toBe(false);
		});

		it("marks config-enabled tools not in allowlist as isComingSoon: true", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
			const tools = getToolsWithStatus();
			const newsAnalyzer = tools.find((t) => t.slug === "news-analyzer");
			expect(newsAnalyzer?.isEnabled).toBe(false);
			expect(newsAnalyzer?.isComingSoon).toBe(true);
		});

		it("marks config-disabled tools as neither enabled nor coming soon", () => {
			process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
			const tools = getToolsWithStatus();
			const disabledTool = tools.find((t) => t.slug === "disabled-tool");
			expect(disabledTool?.isEnabled).toBe(false);
			expect(disabledTool?.isComingSoon).toBe(false);
		});
	});
});

describe("getEnabledTools", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns only enabled tools when env var not set", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getEnabledTools();
		expect(tools).toHaveLength(3); // Excludes disabled-tool
		expect(tools.map((t) => t.slug)).toEqual([
			"bg-remover",
			"news-analyzer",
			"speaker-separation",
		]);
	});

	it("returns only tools in allowlist when env var is set", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover,news-analyzer";
		const tools = getEnabledTools();
		expect(tools).toHaveLength(2);
		expect(tools.map((t) => t.slug)).toEqual([
			"bg-remover",
			"news-analyzer",
		]);
	});

	it("filters out config-disabled tools even if in allowlist", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover,disabled-tool";
		const tools = getEnabledTools();
		expect(tools).toHaveLength(1);
		expect(tools[0].slug).toBe("bg-remover");
	});
});

describe("getVisibleTools", () => {
	const originalEnv = process.env;

	beforeEach(() => {
		vi.resetModules();
		process.env = { ...originalEnv };
	});

	afterEach(() => {
		process.env = originalEnv;
	});

	it("returns enabled and coming soon tools when env var not set", () => {
		delete process.env.NEXT_PUBLIC_ENABLED_TOOLS;
		const tools = getVisibleTools();
		// Only config-enabled tools (3), not config-disabled
		expect(tools).toHaveLength(3);
		expect(tools.map((t) => t.slug)).toEqual([
			"bg-remover",
			"news-analyzer",
			"speaker-separation",
		]);
	});

	it("includes coming soon tools when env var is set", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
		const tools = getVisibleTools();
		// bg-remover (enabled) + news-analyzer + speaker-separation (coming soon)
		expect(tools).toHaveLength(3);
		expect(tools.find((t) => t.slug === "bg-remover")?.isEnabled).toBe(
			true,
		);
		expect(
			tools.find((t) => t.slug === "news-analyzer")?.isComingSoon,
		).toBe(true);
		expect(
			tools.find((t) => t.slug === "speaker-separation")?.isComingSoon,
		).toBe(true);
	});

	it("excludes config-disabled tools", () => {
		process.env.NEXT_PUBLIC_ENABLED_TOOLS = "bg-remover";
		const tools = getVisibleTools();
		expect(tools.find((t) => t.slug === "disabled-tool")).toBeUndefined();
	});
});
