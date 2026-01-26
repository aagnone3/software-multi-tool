import chalk from "chalk";
import Table from "cli-table3";
import { Command } from "commander";
import { PostHog } from "posthog-node";

interface FeatureFlagInfo {
	key: string;
	status: "enabled" | "disabled" | "partial";
	rollout: string;
	value: string | boolean;
}

export const featuresCommand = new Command("features")
	.description("Display PostHog feature flag status")
	.option("--json", "Output as JSON for scripting")
	.action(async (options: { json?: boolean }) => {
		try {
			await displayFeatureFlags(options.json ?? false);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			if (options.json) {
				console.log(JSON.stringify({ error: message }, null, 2));
			} else {
				console.error(chalk.red(`Error: ${message}`));
			}
			process.exit(1);
		}
	});

async function displayFeatureFlags(jsonOutput: boolean): Promise<void> {
	const apiKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
	const host =
		process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

	if (!apiKey) {
		throw new Error(
			"Missing NEXT_PUBLIC_POSTHOG_KEY in environment.\n" +
				"Add it to apps/web/.env.local to use the features command.",
		);
	}

	// Initialize PostHog client
	const posthog = new PostHog(apiKey, {
		host,
		flushAt: 1,
		flushInterval: 0,
	});

	// Get current values for local user (using machine-specific distinct_id)
	const distinctId = `cli-dev-${process.env.USER ?? "anonymous"}`;

	// Use the SDK's getAllFlags() to fetch all feature flags for this user
	const allFlags = await posthog.getAllFlags(distinctId);

	if (!allFlags || Object.keys(allFlags).length === 0) {
		if (jsonOutput) {
			console.log(
				JSON.stringify({ flags: [], summary: { total: 0 } }, null, 2),
			);
		} else {
			console.log(chalk.yellow("No feature flags found in PostHog."));
		}
		await posthog.shutdown();
		return;
	}

	// Convert the flags to our display format
	const flagInfos: FeatureFlagInfo[] = Object.entries(allFlags).map(
		([key, value]) => {
			// Determine status based on the value
			const isEnabled = value !== false && value !== undefined;
			const status: FeatureFlagInfo["status"] = isEnabled
				? "enabled"
				: "disabled";

			return {
				key,
				status,
				rollout: isEnabled ? "100%" : "0%",
				value: value ?? false,
			};
		},
	);

	// Calculate summary
	const enabled = flagInfos.filter((f) => f.status === "enabled").length;
	const partial = flagInfos.filter((f) => f.status === "partial").length;
	const disabled = flagInfos.filter((f) => f.status === "disabled").length;

	if (jsonOutput) {
		console.log(
			JSON.stringify(
				{
					flags: flagInfos.map((f) => ({
						key: f.key,
						status: f.status,
						rollout: f.rollout,
						value: f.value,
					})),
					summary: {
						total: flagInfos.length,
						enabled,
						partial,
						disabled,
					},
				},
				null,
				2,
			),
		);
	} else {
		console.log();
		console.log(chalk.bold.cyan("PostHog Feature Flags"));
		console.log(chalk.cyan("====================="));
		console.log();

		const table = new Table({
			head: [
				chalk.bold("Flag"),
				chalk.bold("Status"),
				chalk.bold("Rollout"),
				chalk.bold("Your Value"),
			],
			style: {
				head: [],
				border: [],
			},
		});

		for (const flag of flagInfos) {
			const statusIcon = getStatusIcon(flag.status);
			const valueDisplay = formatValue(flag.value);
			table.push([flag.key, statusIcon, flag.rollout, valueDisplay]);
		}

		console.log(table.toString());
		console.log();
		console.log(
			`${flagInfos.length} flags total (${chalk.green(`${enabled} enabled`)}, ${chalk.yellow(`${partial} partial`)}, ${chalk.red(`${disabled} disabled`)})`,
		);
	}

	await posthog.shutdown();
}

function getStatusIcon(status: FeatureFlagInfo["status"]): string {
	switch (status) {
		case "enabled":
			return chalk.green("ON");
		case "disabled":
			return chalk.red("OFF");
		case "partial":
			return chalk.yellow("PARTIAL");
	}
}

function formatValue(value: string | boolean): string {
	if (typeof value === "boolean") {
		return value ? chalk.green("true") : chalk.red("false");
	}
	return chalk.cyan(value);
}
