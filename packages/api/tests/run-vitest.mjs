#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import {
	buildVitestArgs,
	hasWorkingContainerRuntime,
} from "@repo/database/tests/container-runtime.mjs";

const includeIntegration = hasWorkingContainerRuntime();
const passthroughArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const vitestArgs = [
	...buildVitestArgs({ includeIntegration }),
	...passthroughArgs,
];

if (!includeIntegration) {
	console.warn(
		"[api:test] No working Docker/Podman runtime detected. Running the non-integration Vitest slice only. Use `pnpm --filter @repo/api test:integration` in a Docker/Podman-capable environment to exercise the Postgres harness-backed tests.",
	);
}

const result = spawnSync("vitest", vitestArgs, {
	stdio: "inherit",
	env: {
		...process.env,
		DOTENV_CONFIG_QUIET: process.env.DOTENV_CONFIG_QUIET ?? "true",
	},
});

if (typeof result.status === "number") {
	process.exit(result.status);
}

if (result.error) {
	console.error("[api:test] Failed to launch Vitest:", result.error);
	process.exit(1);
}

if (result.signal) {
	console.error(`[api:test] Vitest terminated by signal ${result.signal}`);
	process.exit(1);
}
