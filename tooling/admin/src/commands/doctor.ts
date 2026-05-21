import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SCRIPT = path.resolve(
	HERE,
	"..",
	"..",
	"scripts",
	"check-secrets-location.sh",
);

/**
 * Runs the filesystem scanner that ensures no .env.production /
 * .env.preview / .env.staging file exists outside tooling/admin/.secrets/.
 * Used both interactively (`pnpm admin doctor`) and as a predev/prebuild
 * gate so dev tools fail fast if a stray prod env is anywhere it could be
 * auto-loaded.
 */
export async function doctorCommand(): Promise<void> {
	await new Promise<void>((resolve, reject) => {
		const child = spawn(SCRIPT, [], { stdio: "inherit" });
		child.on("exit", (code) => {
			if (code === 0) resolve();
			else reject(new Error(`doctor failed (exit ${code})`));
		});
		child.on("error", reject);
	});
}
