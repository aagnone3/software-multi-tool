import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);
const SCRIPT_PATH = resolve(
	__dirname,
	"..",
	"..",
	"..",
	"packages",
	"database",
	"scripts",
	"seed-local.sh",
);

describe("packages/database/scripts/seed-local.sh", () => {
	it("should exist at the expected path", () => {
		expect(existsSync(SCRIPT_PATH)).toBe(true);
	});

	it("should be syntactically valid bash", async () => {
		const { stderr } = await execAsync(`bash -n "${SCRIPT_PATH}"`);
		expect(stderr).toBe("");
	});

	it("should delegate seeding to the repo-owned Node runner", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
		expect(stdout).toContain(
			"pnpm --filter @repo/scripts exec node ./src/run-local-seed.mjs",
		);
		expect(stdout).toContain('SEED_FILE="$REPO_ROOT/supabase/seed.sql"');
	});
});
