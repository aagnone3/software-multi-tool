import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { type AdminEnv, audit, envFilePath, secretsDir } from "../env";

const VERCEL_ENV_FOR: Record<AdminEnv, string | null> = {
	local: null,
	preview: "preview",
	prod: "production",
};

const HERE = path.dirname(fileURLToPath(import.meta.url));
// tooling/admin/src/commands -> repo root
const REPO_ROOT = path.resolve(HERE, "..", "..", "..", "..");

/**
 * Vercel CLI requires the working directory to contain a linked Vercel
 * project (`.vercel/project.json`). In this repo that lives at apps/web.
 * Locate it deterministically so the user can invoke `pnpm admin env pull`
 * from anywhere.
 */
function findVercelLinkedDir(): string {
	const linked = path.join(REPO_ROOT, "apps", "web");
	if (!fs.existsSync(path.join(linked, ".vercel", "project.json"))) {
		throw new Error(
			"apps/web is not linked to Vercel. Run `vercel link` from apps/web first.",
		);
	}
	return linked;
}

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
	const cwd = findVercelLinkedDir();

	console.log(
		chalk.cyan(
			`Pulling Vercel ${target} env into ${path.relative(process.cwd(), destination)} ...`,
		),
	);

	await new Promise<void>((resolve, reject) => {
		const child = spawn(
			"vercel",
			["env", "pull", destination, "--environment", target, "--yes"],
			{ stdio: "inherit", cwd },
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

	// Hard-verify the destination is inside .secrets/ — paranoid double-check
	// that nothing redirected the file outside the intended dir.
	const resolved = fs.realpathSync(destination);
	if (!resolved.startsWith(`${fs.realpathSync(secretsDir())}${path.sep}`)) {
		fs.rmSync(resolved, { force: true });
		throw new Error(
			`SECURITY: env file was written outside .secrets/ (${resolved}); aborted and removed.`,
		);
	}

	// Restrict perms so casual `cat` from a screen-share doesn't leak.
	try {
		fs.chmodSync(destination, 0o600);
	} catch {
		// best-effort
	}

	audit(env, "env-pull", `dest=${destination}`);
	console.log(chalk.green(`✓ Pulled ${target} env to ${destination}`));
}
