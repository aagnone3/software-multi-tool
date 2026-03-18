import { describe, expect, it } from "vitest";

import {
	buildVitestArgs,
	hasWorkingContainerRuntime,
} from "./container-runtime.mjs";

describe("database test runtime detection", () => {
	it("treats a successful runtime probe as available", () => {
		expect(
			hasWorkingContainerRuntime({
				checks: [{ command: "true", args: [], description: "true" }],
			}),
		).toBe(true);
	});

	it("falls back across probes before declaring no runtime", () => {
		expect(
			hasWorkingContainerRuntime({
				checks: [
					{ command: "false", args: [], description: "false" },
					{ command: "true", args: [], description: "true" },
				],
			}),
		).toBe(true);
	});

	it("returns false when no runtime probe succeeds", () => {
		expect(
			hasWorkingContainerRuntime({
				checks: [
					{
						command: "definitely-not-a-real-runtime-command",
						args: [],
						description: "missing",
					},
				],
			}),
		).toBe(false);
	});
});

describe("database Vitest argument builder", () => {
	it("keeps integration tests in scope when a runtime is available", () => {
		expect(buildVitestArgs({ includeIntegration: true })).toEqual([
			"run",
			"--config",
			"./vitest.config.ts",
		]);
	});

	it("excludes integration tests in Dockerless runners", () => {
		expect(buildVitestArgs({ includeIntegration: false })).toEqual([
			"run",
			"--config",
			"./vitest.config.ts",
			"--exclude",
			"**/*.integration.test.ts",
		]);
	});
});
