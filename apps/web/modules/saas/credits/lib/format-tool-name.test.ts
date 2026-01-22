import { describe, expect, it } from "vitest";
import { formatToolName } from "./format-tool-name";

describe("formatToolName", () => {
	it("returns dash for null toolSlug", () => {
		expect(formatToolName(null)).toBe("-");
	});

	it("returns tool name from registry for known tools", () => {
		expect(formatToolName("bg-remover")).toBe("Background Remover");
		expect(formatToolName("speaker-separation")).toBe("Speaker Separation");
		expect(formatToolName("news-analyzer")).toBe("News Analyzer");
	});

	it("converts unknown slugs to title case", () => {
		expect(formatToolName("unknown-tool")).toBe("Unknown Tool");
		expect(formatToolName("my-custom-app")).toBe("My Custom App");
	});

	it("handles single word slugs", () => {
		expect(formatToolName("test")).toBe("Test");
	});

	it("handles empty string", () => {
		// Empty string is falsy, so returns "-"
		expect(formatToolName("")).toBe("-");
	});
});
