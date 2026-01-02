import { beforeEach, describe, expect, it, vi } from "vitest";

const { createConsola } = vi.hoisted(() => ({
	createConsola: vi.fn((opts) => ({
		options: opts,
	})),
}));

vi.mock("consola", () => ({
	createConsola: createConsola,
}));

describe("logger", () => {
	beforeEach(() => {
		vi.resetModules();
		createConsola.mockClear();
	});

	it("configures consola without date prefixing", async () => {
		const { logger } = await import("./logger");

		expect(createConsola).toHaveBeenCalledWith({
			formatOptions: { date: false },
		});
		expect(logger.options.formatOptions.date).toBe(false);
	});
});
