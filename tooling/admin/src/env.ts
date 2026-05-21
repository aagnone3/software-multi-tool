import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

export const ADMIN_ENVS = ["local", "preview", "prod"] as const;
export type AdminEnv = (typeof ADMIN_ENVS)[number];

export function isAdminEnv(value: string): value is AdminEnv {
	return (ADMIN_ENVS as readonly string[]).includes(value);
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
// tooling/admin/src → tooling/admin
const PKG_ROOT = path.resolve(HERE, "..");
const REPO_ROOT = path.resolve(PKG_ROOT, "..", "..");

export function secretsDir(): string {
	return path.join(PKG_ROOT, ".secrets");
}

export function envFilePath(env: AdminEnv): string {
	if (env === "local") {
		// Local re-uses the existing dev env so users don't maintain two copies.
		return path.join(REPO_ROOT, "apps", "web", ".env.local");
	}
	return path.join(secretsDir(), `${env}.env`);
}

/**
 * Load environment variables for the requested target. Hard-fails if the
 * file is missing — never silently falls back to another env.
 *
 * Variables are loaded into `process.env` for this process only. They are
 * never written to disk outside the existing secrets file.
 */
export function loadEnv(env: AdminEnv): { sourcePath: string; loaded: number } {
	const sourcePath = envFilePath(env);
	if (!fs.existsSync(sourcePath)) {
		throw new Error(
			env === "local"
				? `Local env file not found: ${sourcePath}\n` +
						"Run `pnpm setup` from the repo root to create it."
				: `Secrets file for "${env}" not found: ${sourcePath}\n` +
						`Run \`pnpm admin env pull --env ${env}\` to fetch it from Vercel.`,
		);
	}

	const before = Object.keys(process.env).length;
	dotenv.config({ path: sourcePath, override: true });
	const after = Object.keys(process.env).length;

	return { sourcePath, loaded: after - before };
}

export function audit(env: AdminEnv, cmd: string, detail: string): void {
	try {
		fs.mkdirSync(secretsDir(), { recursive: true });
		const line = `${new Date().toISOString()} env=${env} cmd=${cmd} ${detail}\n`;
		fs.appendFileSync(path.join(secretsDir(), "audit.log"), line);
	} catch {
		// Audit log is best-effort; never block the actual command.
	}
}
