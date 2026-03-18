import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	buildTurboFilters,
	resolveImpactedWorkspaces,
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

	it("scopes the current root package.json change set to @repo/scripts", () => {
		const result = resolveImpactedWorkspaces(["package.json"]);

		expect(result.global).toBe(false);
		expect(result.workspaces).toEqual(["@repo/scripts"]);
	});

	it("still treats root package.json plus global config as global", () => {
		const result = resolveImpactedWorkspaces([
			"package.json",
			"turbo.json",
		]);

		expect(result.global).toBe(true);
		expect(result.workspaces).toEqual(["@repo/scripts"]);
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
