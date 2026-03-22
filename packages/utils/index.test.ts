import { describe, expect, it } from "vitest";
import * as utils from "./index";

describe("@repo/utils index", () => {
	it("exports getBaseUrl", () => {
		expect(typeof utils.getBaseUrl).toBe("function");
	});

	it("exports getApiBaseUrl", () => {
		expect(typeof utils.getApiBaseUrl).toBe("function");
	});

	it("exports getOrpcUrl", () => {
		expect(typeof utils.getOrpcUrl).toBe("function");
	});

	it("exports isPreviewEnvironment", () => {
		expect(typeof utils.isPreviewEnvironment).toBe("function");
	});

	it("exports shouldUseProxy", () => {
		expect(typeof utils.shouldUseProxy).toBe("function");
	});

	it("exports formatDuration", () => {
		expect(typeof utils.formatDuration).toBe("function");
	});
});
