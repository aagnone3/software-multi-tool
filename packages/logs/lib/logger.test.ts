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

	it("configures consola with Vercel-compatible options", async () => {
		const { logger } = await import("./logger");

		expect(createConsola).toHaveBeenCalledWith(
			expect.objectContaining({
				level: expect.any(Number),
				formatOptions: expect.objectContaining({
					date: false,
					colors: expect.any(Boolean),
				}),
				stdout: expect.anything(),
				stderr: expect.anything(),
			}),
		);
		expect(logger.options.formatOptions.date).toBe(false);
	});
});
