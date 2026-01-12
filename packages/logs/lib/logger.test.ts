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
		delete process.env.LOG_LEVEL;
	});

	it("configures consola with default log level when LOG_LEVEL not set", async () => {
		const { logger } = await import("./logger");

		expect(createConsola).toHaveBeenCalledWith(
			expect.objectContaining({
				level: 3, // Default info level
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

	it("configures consola with custom log level from LOG_LEVEL env var", async () => {
		process.env.LOG_LEVEL = "5";
		vi.resetModules();
		createConsola.mockClear();

		// Import triggers logger initialization - logger not used directly
		await import("./logger");

		expect(createConsola).toHaveBeenCalledWith(
			expect.objectContaining({
				level: 5, // Custom level from env var
				formatOptions: expect.objectContaining({
					date: false,
					colors: expect.any(Boolean),
				}),
				stdout: expect.anything(),
				stderr: expect.anything(),
			}),
		);
	});
});
