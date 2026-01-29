import { exec } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const SCRIPT_PATH = resolve(__dirname, "setup-local.sh");
// Get the repo root (3 levels up from tooling/scripts/src/)
const REPO_ROOT = resolve(__dirname, "../../..");

describe("setup-local.sh", () => {
	describe("script exists and is executable", () => {
		it("should exist at expected path", () => {
			expect(existsSync(SCRIPT_PATH)).toBe(true);
		});

		it("should be syntactically valid bash", async () => {
			// Use bash -n to check syntax without executing
			const { stderr } = await execAsync(`bash -n "${SCRIPT_PATH}"`);
			expect(stderr).toBe("");
		});

		it("should have executable permissions", async () => {
			// Check file permissions using ls -l
			const { stdout } = await execAsync(`ls -l "${SCRIPT_PATH}"`);
			// Should have x permission for owner
			expect(stdout).toMatch(/^-rwx/);
		});
	});

	describe("help command", () => {
		it("should show usage when called with --help", async () => {
			const { stdout } = await execAsync(`"${SCRIPT_PATH}" --help`);

			// Verify key sections are present
			expect(stdout).toContain("Usage:");
			expect(stdout).toContain("--force-reset");
		});

		it("should show usage when called with -h", async () => {
			const { stdout } = await execAsync(`"${SCRIPT_PATH}" -h`);
			expect(stdout).toContain("Usage:");
		});
	});

	describe("argument validation", () => {
		it("should reject unknown options", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}" --invalid-option`, {
					cwd: REPO_ROOT,
				});
				expect.fail("Script should reject unknown options");
			} catch (error) {
				const execError = error as {
					stdout?: string;
					stderr?: string;
					code?: number;
				};
				// Output goes to stdout (via echo)
				expect(execError.stdout).toContain("Unknown option");
				expect(execError.code).toBe(1);
			}
		});
	});

	describe("script structure", () => {
		it("should define required helper functions", async () => {
			// Read script content and verify key functions exist
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);

			// Check for key function definitions
			expect(stdout).toContain("is_supabase_running()");
			expect(stdout).toContain("test_user_exists()");
			expect(stdout).toContain("test_user_has_valid_password()");
			expect(stdout).toContain("main()");
		});

		it("should check for supabase CLI", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("command_exists supabase");
		});

		it("should check for psql CLI", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("command_exists psql");
		});

		it("should use correct test user ID", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain('TEST_USER_ID="preview_user_001"');
		});

		it("should use correct Supabase DB port", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("SUPABASE_DB_PORT=54322");
		});

		it("should check for env.local.example files", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("apps/web/.env.local.example");
		});
	});

	describe("error handling", () => {
		it("should use set -euo pipefail for strict error handling", async () => {
			const { stdout } = await execAsync(`head -20 "${SCRIPT_PATH}"`);
			expect(stdout).toContain("set -euo pipefail");
		});
	});

	describe("output formatting", () => {
		it("should define color codes for output", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("RED=");
			expect(stdout).toContain("GREEN=");
			expect(stdout).toContain("YELLOW=");
			expect(stdout).toContain("BLUE=");
			expect(stdout).toContain("NC="); // No Color
		});

		it("should have info/success/warn/error helper functions", async () => {
			const { stdout } = await execAsync(`cat "${SCRIPT_PATH}"`);
			expect(stdout).toContain("info()");
			expect(stdout).toContain("success()");
			expect(stdout).toContain("warn()");
			expect(stdout).toContain("error()");
		});
	});
});
