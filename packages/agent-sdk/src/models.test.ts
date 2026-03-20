import { describe, expect, it } from "vitest";
import {
	CLAUDE_MODELS,
	type ClaudeModel,
	DEFAULT_MODEL,
	MODEL_RECOMMENDATIONS,
} from "./models";

describe("CLAUDE_MODELS", () => {
	it("exports expected model identifiers", () => {
		expect(CLAUDE_MODELS.HAIKU_3_5).toBe("claude-haiku-4-5-20251001");
		expect(CLAUDE_MODELS.SONNET_3).toBe("claude-3-sonnet-20240229");
		expect(CLAUDE_MODELS.SONNET_3_5_V1).toBe("claude-3-5-sonnet-20240620");
		expect(CLAUDE_MODELS.SONNET_3_5_V2).toBe("claude-3-5-sonnet-20241022");
		expect(CLAUDE_MODELS.OPUS_3).toBe("claude-3-opus-20240229");
	});

	it("has all expected keys", () => {
		const keys = Object.keys(CLAUDE_MODELS);
		expect(keys).toContain("HAIKU_3_5");
		expect(keys).toContain("SONNET_3");
		expect(keys).toContain("SONNET_3_5_V1");
		expect(keys).toContain("SONNET_3_5_V2");
		expect(keys).toContain("OPUS_3");
	});
});

describe("DEFAULT_MODEL", () => {
	it("defaults to HAIKU_3_5", () => {
		expect(DEFAULT_MODEL).toBe(CLAUDE_MODELS.HAIKU_3_5);
	});

	it("is a valid ClaudeModel type", () => {
		const model: ClaudeModel = DEFAULT_MODEL;
		expect(typeof model).toBe("string");
	});
});

describe("MODEL_RECOMMENDATIONS", () => {
	it("structured recommendation uses HAIKU_3_5", () => {
		expect(MODEL_RECOMMENDATIONS.structured).toBe(CLAUDE_MODELS.HAIKU_3_5);
	});

	it("analysis recommendation uses SONNET_3_5_V2", () => {
		expect(MODEL_RECOMMENDATIONS.analysis).toBe(
			CLAUDE_MODELS.SONNET_3_5_V2,
		);
	});

	it("creative recommendation uses OPUS_3", () => {
		expect(MODEL_RECOMMENDATIONS.creative).toBe(CLAUDE_MODELS.OPUS_3);
	});
});
