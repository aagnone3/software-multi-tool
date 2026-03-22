import { beforeEach, describe, expect, it, vi } from "vitest";

const anthropicMock = vi.hoisted(() => vi.fn());

vi.mock("@anthropic-ai/sdk", () => ({
	default: anthropicMock,
}));

import { createAnthropicClient, getAnthropicClient } from "./client";

describe("createAnthropicClient", () => {
	beforeEach(() => {
		vi.unstubAllEnvs();
	});

	it("throws if ANTHROPIC_API_KEY is not set", () => {
		vi.stubEnv("ANTHROPIC_API_KEY", "");
		expect(() => createAnthropicClient()).toThrow(
			"ANTHROPIC_API_KEY is not set",
		);
	});

	it("returns a client when ANTHROPIC_API_KEY is set", () => {
		vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
		const client = createAnthropicClient();
		expect(client).toBeDefined();
	});
});

describe("getAnthropicClient", () => {
	it("returns a client instance", () => {
		vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
		const client = getAnthropicClient();
		expect(client).toBeDefined();
	});
});
