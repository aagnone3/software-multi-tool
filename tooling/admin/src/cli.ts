#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { doctorCommand } from "./commands/doctor";
import { envPullCommand } from "./commands/env-pull";
import { sqlCommand } from "./commands/sql";
import { type AdminEnv, isAdminEnv, loadEnv } from "./env";

function parseEnvOption(value: string): AdminEnv {
	if (!isAdminEnv(value)) {
		throw new Error(
			`Invalid --env "${value}". Expected one of: local, preview, prod.`,
		);
	}
	return value;
}

const program = new Command();
program
	.name("admin")
	.description("Operational CLI for ad-hoc admin tasks across environments.")
	.version("0.0.0");

// -----------------------------------------------------------------------------
// `admin env ...`
// -----------------------------------------------------------------------------
const envGroup = program.command("env").description("Manage environment files");

envGroup
	.command("pull")
	.description("Pull a Vercel environment into tooling/admin/.secrets/")
	.option(
		"-e, --env <env>",
		"Target env (preview|prod)",
		parseEnvOption,
		"prod" as AdminEnv,
	)
	.action(async (opts: { env: AdminEnv }) => {
		await envPullCommand(opts);
	});

envGroup
	.command("show")
	.description("Show which env file would be loaded without loading it")
	.option(
		"-e, --env <env>",
		"Target env (local|preview|prod)",
		parseEnvOption,
		"local" as AdminEnv,
	)
	.action((opts: { env: AdminEnv }) => {
		const { sourcePath } = loadEnv(opts.env);
		console.log(chalk.green(`env=${opts.env}  source=${sourcePath}`));
	});

// -----------------------------------------------------------------------------
// `admin sql ...`
// -----------------------------------------------------------------------------
program
	.command("sql [inline]")
	.description("Run an ad-hoc SQL query (read-only by convention)")
	.option(
		"-e, --env <env>",
		"Target env (local|preview|prod)",
		parseEnvOption,
		"local" as AdminEnv,
	)
	.option("-f, --file <path>", "Read SQL from a file")
	.action(
		async (
			inline: string | undefined,
			opts: { env: AdminEnv; file?: string },
		) => {
			await sqlCommand({ env: opts.env, file: opts.file, sql: inline });
		},
	);

// -----------------------------------------------------------------------------
// `admin doctor`
// -----------------------------------------------------------------------------
program
	.command("doctor")
	.description(
		"Scan the working tree for misplaced production env files. " +
			"Same check that runs as predev/prebuild.",
	)
	.action(async () => {
		await doctorCommand();
		console.log(
			chalk.green(
				"✓ No production env files found outside tooling/admin/.secrets/",
			),
		);
	});

program.parseAsync().catch((error: unknown) => {
	console.error(
		chalk.red(error instanceof Error ? error.message : String(error)),
	);
	process.exit(1);
});
