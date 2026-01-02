import { describe, expect, it, vi } from "vitest";

vi.mock("@ai-sdk/openai", () => {
	const openaiMock = vi.fn((model: string) => `mock-${model}`);
	return { openai: openaiMock };
});

describe("ai exports", () => {
	it("creates model clients using @ai-sdk/openai", async () => {
		const { imageModel, textModel, audioModel } = await import("./index");

		expect(textModel).toBe("mock-gpt-4o-mini");
		expect(imageModel).toBe("mock-dall-e-3");
		expect(audioModel).toBe("mock-whisper-1");
	});
});
