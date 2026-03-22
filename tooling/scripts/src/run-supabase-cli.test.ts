import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);
const SCRIPT_PATH = resolve(__dirname, "supabase/run-supabase-cli.sh");

describe("run-supabase-cli.sh", () => {
	it("should exist at the expected path", () => {
		expect(existsSync(SCRIPT_PATH)).toBe(true);
	});

	it("should be syntactically valid bash", async () => {
		const { stderr } = await execAsync(`bash -n "${SCRIPT_PATH}"`);
		expect(stderr).toBe("");
	});

	it("should prefer a global supabase binary when present", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
		expect(stdout).toContain(
			"if command -v supabase >/dev/null 2>&1; then",
		);
		expect(stdout).toContain('exec supabase "$@"');
	});

	it("should fall back to a pinned pnpm dlx supabase invocation", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
		expect(stdout).toContain(
			'SUPABASE_CLI_VERSION="${SUPABASE_CLI_VERSION:-2.81.2}"',
		);
		expect(stdout).toContain(
			'exec pnpm dlx "supabase@${SUPABASE_CLI_VERSION}" "$@"',
		);
	});

	it("should explain the pnpm requirement when neither CLI path is available", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
		expect(stdout).toContain(
			"Supabase CLI is not installed and pnpm is unavailable for the repo-owned fallback.",
		);
		expect(stdout).toContain(
			"Install pnpm or install Supabase CLI globally, then retry.",
		);
	});
});
