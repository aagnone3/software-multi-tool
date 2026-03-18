#!/usr/bin/env node

import { spawnSync } from "node:child_process";

import {
	buildVitestArgs,
	hasWorkingContainerRuntime,
} from "./container-runtime.mjs";

const includeIntegration = hasWorkingContainerRuntime();
const passthroughArgs = process.argv.slice(2).filter((arg) => arg !== "--");
const vitestArgs = [
	...buildVitestArgs({ includeIntegration }),
	...passthroughArgs,
];

if (!includeIntegration) {
	console.warn(
		"[database:test] No working Docker/Podman runtime detected. Running the non-integration Vitest slice only. Use `pnpm --filter @repo/database test:integration` in a Docker/Podman-capable environment to exercise the Postgres harness-backed tests.",
	);
}

const result = spawnSync("vitest", vitestArgs, {
	stdio: "inherit",
});

if (typeof result.status === "number") {
	process.exit(result.status);
}

if (result.error) {
	console.error("[database:test] Failed to launch Vitest:", result.error);
	process.exit(1);
}

if (result.signal) {
	console.error(
		`[database:test] Vitest terminated by signal ${result.signal}`,
	);
	process.exit(1);
}
