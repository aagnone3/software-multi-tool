import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	buildTurboFilters,
	resolveImpactedWorkspaces,
	resolveRootPackageJsonImpact,
	resolveWorkspaceTestCommand,
	shouldPrepareDatabase,
} from "./run-targeted-tests";

const repoRoot = path.resolve(__dirname, "..", "..", "..", "..");

describe("resolveImpactedWorkspaces", () => {
	it("detects app workspace files", () => {
		const result = resolveImpactedWorkspaces(["apps/web/src/app/page.tsx"]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/web"]);
	});

	it("handles multiple workspaces", () => {
		const result = resolveImpactedWorkspaces([
			"apps/web/src/app/page.tsx",
			"packages/utils/src/index.ts",
		]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/utils", "@repo/web"]);
	});

	it("keeps Prisma schema changes scoped to @repo/database", () => {
		const result = resolveImpactedWorkspaces([
			"packages/database/prisma/schema.prisma",
		]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/database"]);
	});

	it("routes database helper scripts through @repo/scripts coverage", () => {
		const result = resolveImpactedWorkspaces([
			"packages/database/scripts/seed-local.sh",
		]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/scripts"]);
	});

	it("marks tooling test config as global", () => {
		const result = resolveImpactedWorkspaces([
			"tooling/test/vitest.workspace.ts",
		]);

		expect(result.global).toBe(true);
		expect(result.workspaces).toEqual([]);
	});

	it("skips documentation-only changes", () => {
		const result = resolveImpactedWorkspaces(["docs/process-notes.md"]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual([]);
	});

	it("skips tests for apps/web env example updates", () => {
		const result = resolveImpactedWorkspaces([
			"apps/web/.env.local.example",
		]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual([]);
	});

	it("treats root package.json with only scripts/engines changes as @repo/scripts-scoped", () => {
		const result =
			resolveRootPackageJsonImpact(`diff --git a/package.json b/package.json
index 1111111..2222222 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "name": "software-multi-tool",
   "scripts": {
-    "repo:feedback": "old command"
+    "repo:feedback": "pnpm --filter @repo/scripts repo:feedback"
   },
   "engines": {
     "node": ">=22.22.0 <23"
`);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/scripts"]);
		expect(result.reason).toBe("package-json-scripts-only");
	});

	it("still treats root package.json plus global config as global", () => {
		const packageJsonImpact =
			resolveRootPackageJsonImpact(`diff --git a/package.json b/package.json
index 1111111..2222222 100644
--- a/package.json
+++ b/package.json
@@ -1,7 +1,7 @@
 {
   "name": "software-multi-tool",
   "scripts": {
-    "repo:feedback": "old command"
+    "repo:feedback": "pnpm --filter @repo/scripts repo:feedback"
   },
   "engines": {
     "node": ">=22.22.0 <23"
`);
		const result = resolveImpactedWorkspaces(["turbo.json"]);

		expect(packageJsonImpact.global).toBe(false);
		expect(packageJsonImpact.workspaces).toEqual(["@repo/scripts"]);
		expect(result.global).toBe(true);
		expect(result.workspaces).toEqual([]);
	});

	it("ignores files outside the repo root", () => {
		const result = resolveImpactedWorkspaces([
			path.join(repoRoot, "..", "README.md"),
		]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual([]);
	});
});

describe("buildTurboFilters", () => {
	it("generates filter flags for workspaces", () => {
		const filters = buildTurboFilters(["@repo/utils", "@repo/web"]);

		expect(filters).toEqual(["--filter=@repo/utils", "--filter=@repo/web"]);
	});
});

describe("resolveWorkspaceTestCommand", () => {
	it("scopes database harness-only changes to unit vitest targets", () => {
		const result = resolveWorkspaceTestCommand("@repo/database", [
			"packages/database/tests/postgres-test-harness.ts",
			"packages/database/tests/postgres-test-harness.test.ts",
		]);

		expect(result.command).toBe("pnpm");
		expect(result.args).toEqual([
			"--filter",
			"@repo/database",
			"exec",
			"vitest",
			"run",
			"--config",
			"./vitest.config.ts",
			"tests/postgres-test-harness.test.ts",
		]);
	});

	it("keeps database integration changes on the full package test command", () => {
		const result = resolveWorkspaceTestCommand("@repo/database", [
			"packages/database/tests/credit-balance.integration.test.ts",
		]);

		expect(result.command).toBe("pnpm");
		expect(result.args).toEqual(["--filter", "@repo/database", "test"]);
	});
});

describe("shouldPrepareDatabase", () => {
	it("returns true for global test runs", () => {
		expect(shouldPrepareDatabase(true, [])).toBe(true);
	});

	it("returns true when @repo/database is directly impacted", () => {
		expect(shouldPrepareDatabase(false, ["@repo/database"])).toBe(true);
	});

	it("returns false when database is not in scope", () => {
		expect(
			shouldPrepareDatabase(false, ["@repo/scripts", "@repo/web"]),
		).toBe(false);
	});
});
