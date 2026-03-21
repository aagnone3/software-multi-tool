import { describe, expect, it, vi } from "vitest";

const mockCreate = vi.hoisted(() => vi.fn());

vi.mock("./client", () => ({
	getAnthropicClient: () => ({
		messages: {
			create: mockCreate,
		},
	}),
}));

import { executePrompt } from "./prompt";

function makeMessage(
	content: string,
	overrides: Partial<{
		model: string;
		stop_reason: string | null;
		inputTokens: number;
		outputTokens: number;
	}> = {},
) {
	return {
		content: [{ type: "text" as const, text: content }],
		model: overrides.model ?? "claude-3-5-sonnet-20241022",
		stop_reason: overrides.stop_reason ?? "end_turn",
		usage: {
			input_tokens: overrides.inputTokens ?? 10,
			output_tokens: overrides.outputTokens ?? 20,
		},
	};
}

describe("executePrompt", () => {
	it("returns content, model, usage and stopReason from response", async () => {
		mockCreate.mockResolvedValue(makeMessage("Paris is the capital."));

		const result = await executePrompt("What is the capital of France?");

		expect(result.content).toBe("Paris is the capital.");
		expect(result.model).toBe("claude-3-5-sonnet-20241022");
		expect(result.usage).toEqual({ inputTokens: 10, outputTokens: 20 });
		expect(result.stopReason).toBe("end_turn");
	});

	it("passes default options to anthropic client", async () => {
		mockCreate.mockResolvedValue(makeMessage("ok"));

		await executePrompt("test prompt");

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "claude-3-5-sonnet-20241022",
				max_tokens: 1024,
				temperature: 1,
				messages: [{ role: "user", content: "test prompt" }],
			}),
		);
	});

	it("passes custom options to anthropic client", async () => {
		mockCreate.mockResolvedValue(
			makeMessage("ok", { model: "claude-3-5-haiku-latest" }),
		);

		await executePrompt("prompt", {
			model: "claude-3-5-haiku-latest",
			maxTokens: 500,
			temperature: 0.5,
			system: "You are a teacher.",
		});

		expect(mockCreate).toHaveBeenCalledWith(
			expect.objectContaining({
				model: "claude-3-5-haiku-latest",
				max_tokens: 500,
				temperature: 0.5,
				system: "You are a teacher.",
			}),
		);
	});

	it("concatenates multiple text blocks", async () => {
		mockCreate.mockResolvedValue({
			...makeMessage(""),
			content: [
				{ type: "text" as const, text: "Hello" },
				{ type: "text" as const, text: " World" },
			],
		});

		const result = await executePrompt("prompt");
		expect(result.content).toBe("Hello World");
	});

	it("filters out non-text content blocks", async () => {
		mockCreate.mockResolvedValue({
			...makeMessage(""),
			content: [
				{ type: "tool_use" as const, id: "x", name: "tool", input: {} },
				{ type: "text" as const, text: "text only" },
			],
		});

		const result = await executePrompt("prompt");
		expect(result.content).toBe("text only");
	});

	it("uses custom client when provided", async () => {
		const customCreate = vi.fn().mockResolvedValue(makeMessage("custom"));
		const customClient = { messages: { create: customCreate } } as any;

		const result = await executePrompt("prompt", { client: customClient });

		expect(customCreate).toHaveBeenCalled();
		expect(mockCreate).not.toHaveBeenCalled();
		expect(result.content).toBe("custom");
	});

	it("propagates errors from anthropic client", async () => {
		mockCreate.mockRejectedValue(new Error("API error"));

		await expect(executePrompt("prompt")).rejects.toThrow("API error");
	});

	it("returns null stopReason when stop_reason is null", async () => {
		const msg = makeMessage("ok");
		msg.stop_reason = null;
		mockCreate.mockResolvedValue(msg);

		const result = await executePrompt("prompt");
		expect(result.stopReason).toBeNull();
	});
});
