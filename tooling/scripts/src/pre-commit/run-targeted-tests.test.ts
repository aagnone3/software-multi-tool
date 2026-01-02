import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	buildTurboFilters,
	resolveImpactedWorkspaces,
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

	it("treats root package.json as global", () => {
		const result = resolveImpactedWorkspaces(["package.json"]);

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

		expect(filters).toEqual([
			"--filter=@repo/utils...",
			"--filter=@repo/web...",
		]);
	});
});
