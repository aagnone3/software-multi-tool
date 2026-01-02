import { describe, expect, it } from "vitest";

import { promptListProductNames } from "./prompts";

describe("promptListProductNames", () => {
	it("returns the expected multi-line prompt with sanitized input", () => {
		expect(promptListProductNames("  eco  gadgets   ")).toBe(
			[
				"You are an AI naming assistant specialising in product branding.",
				"Generate 5 playful product name ideas for eco gadgets.",
				"Respond with a numbered list where each item is at most three words.",
				"Avoid repeating core keywords and skip explanations.",
			].join("\n"),
		);
	});

	it("falls back to the default topic when the input is blank", () => {
		expect(promptListProductNames("   ")).toContain("a new product idea");
	});

	it("supports custom prompt options and strips unsafe whitespace", () => {
		const prompt = promptListProductNames("AI onboarding\n", {
			audience: " enterprise founders\n",
			count: 3,
			tone: "professional ",
		});

		expect(prompt.split("\n")).toStrictEqual([
			"You are an AI naming assistant specialising in product branding.",
			"Generate 3 professional product name ideas for AI onboarding that resonate with enterprise founders.",
			"Respond with a numbered list where each item is at most three words.",
			"Avoid repeating core keywords and skip explanations.",
		]);
	});
});
