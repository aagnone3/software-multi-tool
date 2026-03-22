import { describe, expect, it } from "vitest";

import {
	buildVitestArgs,
	hasWorkingContainerRuntime,
	shouldWarnAboutDockerlessFallback,
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

describe("Dockerless fallback warnings", () => {
	it("stays quiet by default in Dockerless runners", () => {
		expect(
			shouldWarnAboutDockerlessFallback({
				includeIntegration: false,
				env: {},
			}),
		).toBe(false);
	});

	it("allows an explicit opt-in warning when needed", () => {
		expect(
			shouldWarnAboutDockerlessFallback({
				includeIntegration: false,
				env: { REPO_TEST_RUNTIME_NOTICE: "1" },
			}),
		).toBe(true);
	});

	it("never warns when integration tests are actually in scope", () => {
		expect(
			shouldWarnAboutDockerlessFallback({
				includeIntegration: true,
				env: { REPO_TEST_RUNTIME_NOTICE: "1" },
			}),
		).toBe(false);
	});
});
