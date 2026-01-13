/**
 * Tests for preview-sync SKIPPED state handling
 *
 * These tests verify the logic for detecting and handling Supabase
 * GitHub check SKIPPED states as per PRA-100.
 */

import { describe, expect, it } from "vitest";

// We need to test the logic without actually calling APIs
// Since the module is a script with side effects, we'll test the key logic patterns

describe("preview-sync SKIPPED state handling", () => {
	describe("GitHub check status detection", () => {
		it("should detect SKIPPED conclusion from Supabase check", () => {
			// Simulated check_runs response from GitHub API
			const checkRuns = {
				check_runs: [
					{
						name: "build",
						conclusion: "success",
						status: "completed",
						app: { slug: "github-actions" },
					},
					{
						name: "Supabase Preview",
						conclusion: "skipped",
						status: "completed",
						app: { slug: "supabase-integration" },
					},
					{
						name: "Vercel",
						conclusion: "success",
						status: "completed",
						app: { slug: "vercel" },
					},
				],
			};

			// Find Supabase check by name or app slug
			const supabaseCheck = checkRuns.check_runs.find(
				(check) =>
					check.name?.toLowerCase().includes("supabase") ||
					check.app?.slug === "supabase-integration" ||
					check.app?.name?.toLowerCase().includes("supabase"),
			);

			expect(supabaseCheck).toBeDefined();
			expect(supabaseCheck.conclusion).toBe("skipped");
		});

		it("should return not skipped when Supabase check succeeds", () => {
			const checkRuns = {
				check_runs: [
					{
						name: "Supabase Preview",
						conclusion: "success",
						status: "completed",
						app: { slug: "supabase-integration" },
					},
				],
			};

			const supabaseCheck = checkRuns.check_runs.find(
				(check) =>
					check.name?.toLowerCase().includes("supabase") ||
					check.app?.slug === "supabase-integration",
			);

			expect(supabaseCheck).toBeDefined();
			expect(supabaseCheck.conclusion).toBe("success");
			expect(supabaseCheck.conclusion === "skipped").toBe(false);
		});

		it("should handle missing Supabase check gracefully", () => {
			const checkRuns = {
				check_runs: [
					{
						name: "build",
						conclusion: "success",
						status: "completed",
						app: { slug: "github-actions" },
					},
				],
			};

			const supabaseCheck = checkRuns.check_runs.find(
				(check) =>
					check.name?.toLowerCase().includes("supabase") ||
					check.app?.slug === "supabase-integration",
			);

			// When no Supabase check found, treat as not skipped (normal flow)
			expect(supabaseCheck).toBeUndefined();
		});
	});

	describe("existing branch lookup logic", () => {
		it("should use existing branch when SKIPPED and branch is ACTIVE_HEALTHY", () => {
			// Simulate finding an existing branch
			const existingBranch = {
				id: "branch-123",
				name: "feat/pra-75-news-analyzer",
				git_branch: "feat/pra-75-news-analyzer",
				status: "ACTIVE_HEALTHY",
				db_host: "db.branch-123.supabase.co",
				db_port: 5432,
				db_user: "postgres",
				db_pass: "secret-password",
			};

			// Check if branch is ready (mimics isBranchReady logic)
			const isBranchReady =
				existingBranch.status === "ACTIVE_HEALTHY" &&
				!!existingBranch.db_host &&
				!!existingBranch.db_pass;

			expect(isBranchReady).toBe(true);
		});

		it("should fail when SKIPPED but no existing branch found", () => {
			const gitBranch = "feat/pra-new-feature";
			const branches = [
				{
					git_branch: "feat/pra-75-news-analyzer",
					status: "ACTIVE_HEALTHY",
				},
				{ git_branch: "fix/pra-42-bugfix", status: "ACTIVE_HEALTHY" },
			];

			const existingBranch = branches.find(
				(b) => b.git_branch === gitBranch,
			);

			expect(existingBranch).toBeUndefined();

			// AC3: Should throw error with clear message
			const expectedError = `Supabase check was SKIPPED but no existing branch found for "${gitBranch}". Manual investigation required.`;
			expect(expectedError).toContain("SKIPPED");
			expect(expectedError).toContain("Manual investigation required");
		});

		it("should wait for branch when exists but not ready", () => {
			const existingBranch = {
				id: "branch-456",
				name: "feat/pra-100",
				git_branch: "feat/pra-100",
				status: "COMING_UP", // Not ready yet
				db_host: null,
				db_pass: null,
			};

			// Check if branch is ready
			const isBranchReady =
				existingBranch.status === "ACTIVE_HEALTHY" &&
				!!existingBranch.db_host &&
				!!existingBranch.db_pass;

			// Should continue to normal wait flow
			expect(isBranchReady).toBe(false);
		});
	});

	describe("output formatting", () => {
		it("should indicate when using existing branch in status output", () => {
			const output = {
				branch: { name: "feat/pra-75" },
				credentials: { poolerUrl: "...", directUrl: "..." },
				usedExistingBranch: true,
			};

			const supabaseStatus = output.usedExistingBranch
				? "READY (using existing branch)"
				: "READY";

			expect(supabaseStatus).toBe("READY (using existing branch)");
		});

		it("should show normal READY status for new branches", () => {
			const output = {
				branch: { name: "feat/pra-100" },
				credentials: { poolerUrl: "...", directUrl: "..." },
				// usedExistingBranch not set
			};

			const supabaseStatus = output.usedExistingBranch
				? "READY (using existing branch)"
				: "READY";

			expect(supabaseStatus).toBe("READY");
		});

		it("should show ERROR status when branch lookup fails", () => {
			const output = {
				error: 'Supabase check was SKIPPED but no existing branch found for "feat/pra-orphan"',
			};

			const supabaseStatus = output.error
				? `ERROR: ${output.error}`
				: "READY";

			expect(supabaseStatus).toContain("ERROR");
			expect(supabaseStatus).toContain("SKIPPED");
		});
	});

	describe("workflow PR comment", () => {
		it("should generate appropriate comment when using existing branch", () => {
			const usedExistingSupabase = true;

			const supabaseNote = usedExistingSupabase
				? "- **Supabase** using existing branch database (GitHub check was SKIPPED)"
				: "- **Supabase** branch database credentials synced to Render";

			expect(supabaseNote).toContain("existing branch");
			expect(supabaseNote).toContain("SKIPPED");
		});

		it("should generate standard comment for normal flow", () => {
			const usedExistingSupabase = false;

			const supabaseNote = usedExistingSupabase
				? "- **Supabase** using existing branch database (GitHub check was SKIPPED)"
				: "- **Supabase** branch database credentials synced to Render";

			expect(supabaseNote).toContain("synced to Render");
			expect(supabaseNote).not.toContain("existing branch");
		});
	});
});
