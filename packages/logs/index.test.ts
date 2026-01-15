import { describe, expect, it } from "vitest";
import * as logsModule from "./index";

describe("@repo/logs exports", () => {
	it("exports logger as a named export", () => {
		// Verify logger is exported as a named export (not just under default)
		// This is critical for tsx ESM interop compatibility
		expect(logsModule).toHaveProperty("logger");
		expect(typeof logsModule.logger).toBe("object");
	});

	it("logger has expected consola methods", () => {
		const { logger } = logsModule;

		// Verify logger has core consola methods
		expect(typeof logger.info).toBe("function");
		expect(typeof logger.warn).toBe("function");
		expect(typeof logger.error).toBe("function");
		expect(typeof logger.debug).toBe("function");
	});
});
