import { spawnSync } from "node:child_process";

const DEFAULT_RUNTIME_CHECKS = [
	{
		command: "docker",
		args: ["info"],
		description: "Docker daemon",
	},
	{
		command: "podman",
		args: ["info", "--format", "json"],
		description: "Podman service",
	},
];

export function hasWorkingContainerRuntime(options = {}) {
	const checks = options.checks ?? DEFAULT_RUNTIME_CHECKS;

	for (const check of checks) {
		const result = spawnSync(check.command, check.args, {
			encoding: "utf8",
			stdio: "ignore",
		});

		if (result.status === 0) {
			return true;
		}
	}

	return false;
}

export function buildVitestArgs({ includeIntegration }) {
	const args = ["run", "--config", "./vitest.config.ts"];

	if (!includeIntegration) {
		args.push("--exclude", "**/*.integration.test.ts");
	}

	return args;
}

export function shouldWarnAboutDockerlessFallback({
	includeIntegration,
	env = process.env,
}) {
	if (includeIntegration) {
		return false;
	}

	return env.REPO_TEST_RUNTIME_NOTICE === "1";
}
