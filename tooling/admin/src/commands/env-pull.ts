import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import chalk from "chalk";
import { type AdminEnv, audit, envFilePath, secretsDir } from "../env";

const VERCEL_ENV_FOR: Record<AdminEnv, string | null> = {
	local: null,
	preview: "preview",
	prod: "production",
};

export async function envPullCommand(opts: { env: AdminEnv }): Promise<void> {
	const { env } = opts;
	if (env === "local") {
		console.log(
			chalk.yellow(
				"`local` env is sourced from apps/web/.env.local; nothing to pull.",
			),
		);
		return;
	}

	const target = VERCEL_ENV_FOR[env];
	if (!target) {
		throw new Error(`No Vercel mapping for env "${env}"`);
	}

	fs.mkdirSync(secretsDir(), { recursive: true });
	const destination = envFilePath(env);

	console.log(
		chalk.cyan(
			`Pulling Vercel ${target} env into ${path.relative(process.cwd(), destination)}...`,
		),
	);

	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			"vercel",
			["env", "pull", destination, "--environment", target, "--yes"],
			{ stdio: "inherit", cwd: path.dirname(destination) },
		);
		child.on("exit", (code) => {
			if (code === 0) {
				resolve();
			} else {
				reject(new Error(`vercel env pull exited with code ${code}`));
			}
		});
		child.on("error", reject);
	});

	// Restrict perms so casual `cat` from a screen-share doesn't leak.
	try {
		fs.chmodSync(destination, 0o600);
	} catch {
		// best-effort
	}

	audit(env, "env-pull", `dest=${destination}`);
	console.log(chalk.green(`✓ Pulled ${target} env to ${destination}`));
}
