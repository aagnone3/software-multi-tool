import { exec } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const execAsync = promisify(exec);

const SCRIPT_PATH = resolve(__dirname, "worktree-setup.sh");
const SCRIPT_SOURCE = readFileSync(SCRIPT_PATH, "utf8");
// Get the repo root (3 levels up from tooling/scripts/src/)
const REPO_ROOT = resolve(__dirname, "../../..");

describe("worktree-setup.sh", () => {
	describe("script exists and is executable", () => {
		it("should exist at expected path", () => {
			expect(existsSync(SCRIPT_PATH)).toBe(true);
		});

		it("should be syntactically valid bash", async () => {
			// Use bash -n to check syntax without executing
			const { stderr } = await execAsync(`bash -n "${SCRIPT_PATH}"`);
			expect(stderr).toBe("");
		});

		it("should use the repo-owned preview user validator instead of host psql", () => {
			expect(SCRIPT_SOURCE).toContain("check-local-preview-user.mjs");
			expect(SCRIPT_SOURCE).toContain("check_preview_user exists");
			expect(SCRIPT_SOURCE).not.toContain("psql -h 127.0.0.1");
		});

		it("should use Docker Compose for local database", () => {
			expect(SCRIPT_SOURCE).toContain("docker compose");
			expect(SCRIPT_SOURCE).toContain("prisma migrate deploy");
		});

		it("should use Docker Compose for database setup", () => {
			expect(SCRIPT_SOURCE).toContain("docker compose");
			expect(SCRIPT_SOURCE).toContain("packages/database/seed.sql");
		});
	});

	describe("help command", () => {
		it("should show usage when called with --help", async () => {
			const { stdout } = await execAsync(`"${SCRIPT_PATH}" --help`);

			// Verify key sections are present
			expect(stdout).toContain("Worktree Setup Script");
			expect(stdout).toContain("Usage:");
			expect(stdout).toContain("create");
			expect(stdout).toContain("remove");
			expect(stdout).toContain("list");
			expect(stdout).toContain("resume");
		});

		it("should show usage when called with -h", async () => {
			const { stdout } = await execAsync(`"${SCRIPT_PATH}" -h`);
			expect(stdout).toContain("Usage:");
		});

		it("should show usage when called with no arguments", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}"`);
				// Should not reach here - script exits with error
				expect.fail(
					"Script should exit with error when no arguments provided",
				);
			} catch (error) {
				const execError = error as { stdout?: string; code?: number };
				// Script should exit with code 1 but show usage
				expect(execError.stdout).toContain("Usage:");
				expect(execError.code).toBe(1);
			}
		});
	});

	describe("argument validation (from repo root)", () => {
		it("should reject unknown commands", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}" unknown-command`, {
					cwd: REPO_ROOT,
				});
				expect.fail("Script should reject unknown commands");
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Unknown command");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject create with missing arguments", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}" create`, { cwd: REPO_ROOT });
				expect.fail("Script should reject create without arguments");
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Missing arguments");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject remove with missing worktree name", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}" remove`, { cwd: REPO_ROOT });
				expect.fail(
					"Script should reject remove without worktree name",
				);
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Missing worktree name");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject resume with missing worktree name", async () => {
			try {
				await execAsync(`"${SCRIPT_PATH}" resume`, { cwd: REPO_ROOT });
				expect.fail(
					"Script should reject resume without worktree name",
				);
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Missing worktree name");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject invalid branch type", async () => {
			try {
				await execAsync(
					`"${SCRIPT_PATH}" create PRA-123 invalid-type test-desc`,
					{ cwd: REPO_ROOT },
				);
				expect.fail("Script should reject invalid branch type");
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Invalid branch type");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject description with uppercase letters", async () => {
			try {
				await execAsync(
					`"${SCRIPT_PATH}" create PRA-123 feat InvalidDesc`,
					{ cwd: REPO_ROOT },
				);
				expect.fail("Script should reject uppercase description");
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Invalid description");
				expect(execError.stderr).toContain("kebab-case");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject description with spaces", async () => {
			try {
				await execAsync(
					`"${SCRIPT_PATH}" create PRA-123 feat "invalid desc"`,
					{ cwd: REPO_ROOT },
				);
				expect.fail("Script should reject description with spaces");
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Invalid description");
				expect(execError.code).toBe(1);
			}
		});

		it("should reject description with special characters", async () => {
			try {
				await execAsync(
					`"${SCRIPT_PATH}" create PRA-123 feat "test_desc"`,
					{ cwd: REPO_ROOT },
				);
				expect.fail(
					"Script should reject description with special chars",
				);
			} catch (error) {
				const execError = error as { stderr?: string; code?: number };
				expect(execError.stderr).toContain("Invalid description");
				expect(execError.code).toBe(1);
			}
		});
	});

	describe("list command", () => {
		it("should execute list command successfully from repo root", async () => {
			// The script determines repo root from its own location,
			// so it can be called from anywhere
			const { stdout } = await execAsync(`"${SCRIPT_PATH}" list`, {
				cwd: REPO_ROOT,
			});
			expect(stdout).toContain("Active worktrees");
		});
	});
});
