import chalk from "chalk";
import { Command } from "commander";

interface CreateFeatureFlagOptions {
	key: string;
	description?: string;
	enabled?: boolean;
}

interface PostHogProject {
	id: number;
	name: string;
}

interface PostHogFeatureFlag {
	id: number;
	key: string;
	name: string;
	active: boolean;
}

export const createFeatureCommand = new Command("create-feature")
	.description("Create a new PostHog feature flag")
	.requiredOption(
		"-k, --key <key>",
		"Feature flag key (e.g., enable-github-login)",
	)
	.option(
		"-d, --description <description>",
		"Description of the feature flag",
	)
	.option("--enabled", "Create the flag as enabled (default: disabled)")
	.action(async (options: CreateFeatureFlagOptions) => {
		try {
			await createFeatureFlag(options);
		} catch (error) {
			const message =
				error instanceof Error ? error.message : String(error);
			console.error(chalk.red(`Error: ${message}`));
			process.exit(1);
		}
	});

async function createFeatureFlag(
	options: CreateFeatureFlagOptions,
): Promise<void> {
	const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY;
	const host =
		process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

	if (!personalApiKey) {
		throw new Error(
			"Missing POSTHOG_PERSONAL_API_KEY in environment.\n\n" +
				"To get a personal API key:\n" +
				"1. Go to PostHog Settings > Personal API Keys\n" +
				"2. Create a new key with 'Feature flags' scope\n" +
				"3. Add it to apps/web/.env.local:\n" +
				"   POSTHOG_PERSONAL_API_KEY=phx_...\n",
		);
	}

	// Normalize host URL
	const apiHost = host.replace("i.posthog.com", "posthog.com");

	console.log(
		chalk.cyan(`\nCreating feature flag: ${chalk.bold(options.key)}`),
	);

	// First, get the project ID
	console.log(chalk.gray("  Fetching project info..."));
	const projectId = await getProjectId(apiHost, personalApiKey);

	// Check if flag already exists
	console.log(chalk.gray("  Checking for existing flag..."));
	const existingFlag = await getExistingFlag(
		apiHost,
		personalApiKey,
		projectId,
		options.key,
	);

	if (existingFlag) {
		console.log(
			chalk.yellow(
				`\n⚠ Feature flag "${options.key}" already exists (ID: ${existingFlag.id})`,
			),
		);
		console.log(
			chalk.gray(
				`  Status: ${existingFlag.active ? chalk.green("enabled") : chalk.red("disabled")}`,
			),
		);
		return;
	}

	// Create the feature flag
	console.log(chalk.gray("  Creating feature flag..."));
	const flag = await createFlag(apiHost, personalApiKey, projectId, options);

	console.log(chalk.green("\n✓ Feature flag created successfully!"));
	console.log(chalk.gray(`  Key: ${flag.key}`));
	console.log(chalk.gray(`  ID: ${flag.id}`));
	console.log(
		chalk.gray(
			`  Status: ${flag.active ? chalk.green("enabled") : chalk.red("disabled")}`,
		),
	);
}

async function getProjectId(host: string, apiKey: string): Promise<number> {
	const response = await fetch(`${host}/api/projects/`, {
		method: "GET",
		headers: {
			Authorization: `Bearer ${apiKey}`,
			"Content-Type": "application/json",
		},
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Failed to fetch projects: ${response.status} ${text}`);
	}

	const data = (await response.json()) as { results: PostHogProject[] };

	if (!data.results || data.results.length === 0) {
		throw new Error(
			"No PostHog projects found. Make sure your API key has access to at least one project.",
		);
	}

	// Use the first project (most common case)
	return data.results[0].id;
}

async function getExistingFlag(
	host: string,
	apiKey: string,
	projectId: number,
	key: string,
): Promise<PostHogFeatureFlag | null> {
	const response = await fetch(
		`${host}/api/projects/${projectId}/feature_flags/?search=${encodeURIComponent(key)}`,
		{
			method: "GET",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!response.ok) {
		return null;
	}

	const data = (await response.json()) as { results: PostHogFeatureFlag[] };
	return data.results?.find((f) => f.key === key) ?? null;
}

async function createFlag(
	host: string,
	apiKey: string,
	projectId: number,
	options: CreateFeatureFlagOptions,
): Promise<PostHogFeatureFlag> {
	const payload = {
		key: options.key,
		name: options.description ?? options.key,
		active: options.enabled ?? false,
		// Default filter: release to everyone when enabled
		filters: {
			groups: [
				{
					properties: [],
					rollout_percentage: 100,
				},
			],
		},
	};

	const response = await fetch(
		`${host}/api/projects/${projectId}/feature_flags/`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${apiKey}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		},
	);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(
			`Failed to create feature flag: ${response.status} ${text}`,
		);
	}

	return response.json() as Promise<PostHogFeatureFlag>;
}
