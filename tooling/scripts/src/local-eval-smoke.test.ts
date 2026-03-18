import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const SCRIPT_PATH = resolve(__dirname, "local-eval-smoke.sh");

describe("local-eval-smoke.sh", () => {
	it("should exist at the expected path", () => {
		expect(existsSync(SCRIPT_PATH)).toBe(true);
	});

	it("should be syntactically valid bash", async () => {
		const { stderr } = await execAsync(`bash -n "${SCRIPT_PATH}"`);
		expect(stderr).toBe("");
	});

	it("should mention the README contract it verifies", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);

		expect(stdout).toContain("pnpm run setup");
		expect(stdout).toContain("pnpm --filter web run dev");
		expect(stdout).toContain("test@preview.local");
		expect(stdout).toContain("/auth/login");
	});

	it("should use the repo-owned preview user validator instead of host psql", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);

		expect(stdout).toContain("check-local-preview-user.mjs exists");
		expect(stdout).not.toContain(
			'require_command psql "used to verify the seeded preview user in local Postgres"',
		);
		expect(stdout).toContain(
			"Install pnpm, then re-run: pnpm local-eval:smoke",
		);
	});

	it("should keep the smoke path anchored on pnpm run setup", async () => {
		const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);

		expect(stdout).toContain("pnpm run setup");
		expect(stdout).not.toContain("pnpm setup");
	});
});
