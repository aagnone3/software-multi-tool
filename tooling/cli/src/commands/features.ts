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

interface PostHogFeatureFlag {
	id: number;
	key: string;
	name: string;
	active: boolean;
	rollout_percentage: number | null;
	filters?: {
		groups?: Array<{
			rollout_percentage?: number;
			properties?: unknown[];
		}>;
		multivariate?: {
			variants: Array<{
				key: string;
				rollout_percentage: number;
			}>;
		};
	};
}

interface PostHogApiResponse {
	results: PostHogFeatureFlag[];
	next?: string | null;
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

	// Initialize PostHog client for local evaluation
	const posthog = new PostHog(apiKey, {
		host,
		flushAt: 1,
		flushInterval: 0,
	});

	// Fetch feature flags from the PostHog API
	const flags = await fetchFeatureFlags(apiKey, host);

	if (flags.length === 0) {
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

	// Get current values for local user (using machine-specific distinct_id)
	const distinctId = `cli-dev-${process.env.USER ?? "anonymous"}`;
	const flagInfos: FeatureFlagInfo[] = [];

	for (const flag of flags) {
		// Get the current value for this user
		const value = await posthog.getFeatureFlag(flag.key, distinctId);

		// Determine status and rollout
		const { status, rollout } = determineStatus(flag);

		flagInfos.push({
			key: flag.key,
			status,
			rollout,
			value: value ?? false,
		});
	}

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

function determineStatus(flag: PostHogFeatureFlag): {
	status: FeatureFlagInfo["status"];
	rollout: string;
} {
	if (!flag.active) {
		return { status: "disabled", rollout: "0%" };
	}

	// Check for multivariate flags
	if (flag.filters?.multivariate?.variants) {
		const variants = flag.filters.multivariate.variants;
		const totalRollout = variants.reduce(
			(sum, v) => sum + v.rollout_percentage,
			0,
		);
		if (totalRollout === 100) {
			return { status: "enabled", rollout: "100%" };
		}
		return { status: "partial", rollout: `${totalRollout}%` };
	}

	// Check for release conditions (groups)
	if (flag.filters?.groups && flag.filters.groups.length > 0) {
		const groups = flag.filters.groups;
		// If any group has a rollout percentage, use that
		for (const group of groups) {
			if (typeof group.rollout_percentage === "number") {
				if (group.rollout_percentage === 100) {
					return { status: "enabled", rollout: "100%" };
				}
				if (group.rollout_percentage === 0) {
					return { status: "disabled", rollout: "0%" };
				}
				return {
					status: "partial",
					rollout: `${group.rollout_percentage}%`,
				};
			}
		}
		// If groups exist but no explicit rollout percentage, assume enabled for matching conditions
		return { status: "enabled", rollout: "100%" };
	}

	// Use the top-level rollout_percentage if set
	if (
		flag.rollout_percentage !== null &&
		flag.rollout_percentage !== undefined
	) {
		if (flag.rollout_percentage === 100) {
			return { status: "enabled", rollout: "100%" };
		}
		if (flag.rollout_percentage === 0) {
			return { status: "disabled", rollout: "0%" };
		}
		return { status: "partial", rollout: `${flag.rollout_percentage}%` };
	}

	// Active flag with no specific rollout rules - assume fully enabled
	return { status: "enabled", rollout: "100%" };
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

async function fetchFeatureFlags(
	apiKey: string,
	host: string,
): Promise<PostHogFeatureFlag[]> {
	// Extract project ID from API key (format: phc_<project_key>)
	// For the feature flags API, we need to use the project API endpoint
	// The public API key can be used to identify the project

	// PostHog's public API doesn't expose flag definitions directly
	// We need to use the private API with a personal API key, or use the
	// feature flags evaluate endpoint with known flag keys.

	// For now, we'll use a workaround: call the decide endpoint which returns
	// all flags for a given user, then infer the flag list from there.

	const decideUrl = `${host}/decide/?v=3`;

	const response = await fetch(decideUrl, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			api_key: apiKey,
			distinct_id: `cli-dev-${process.env.USER ?? "anonymous"}`,
		}),
	});

	if (!response.ok) {
		throw new Error(
			`PostHog API error: ${response.status} ${response.statusText}`,
		);
	}

	interface DecideResponse {
		featureFlags?: Record<string, boolean | string>;
		featureFlagPayloads?: Record<string, unknown>;
		errorsWhileComputingFlags?: boolean;
	}

	const data = (await response.json()) as DecideResponse;

	if (!data.featureFlags) {
		return [];
	}

	// Convert the decide response to our flag format
	// Note: The decide endpoint doesn't give us rollout percentages,
	// so we'll mark everything as enabled/disabled based on the value
	const flags: PostHogFeatureFlag[] = Object.entries(data.featureFlags).map(
		([key, value], index) => ({
			id: index,
			key,
			name: key,
			active: value !== false,
			rollout_percentage: value !== false ? 100 : 0,
		}),
	);

	return flags;
}
