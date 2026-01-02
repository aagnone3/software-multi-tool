import path from "node:path";

import { describe, expect, it } from "vitest";

import {
	countFlakyAssertions,
	deriveWorkspaceFromFile,
	emptyCoverageTotals,
	formatCoverageTotals,
	mergeWorkspaceMetrics,
	roundNumber,
	toCoverageTotal,
} from "./testing-metrics-helpers";

describe("testing-metrics helpers", () => {
	it("rounds numbers to two decimal places", () => {
		expect(roundNumber(1.234)).toBe(1.23);
		expect(roundNumber(5.678)).toBe(5.68);
	});

	it("merges coverage and test maps", () => {
		const utilsCoverage = emptyCoverageTotals();
		const coverage = new Map([["packages/utils", utilsCoverage]]);

		utilsCoverage.statements = toCoverageTotal({
			total: 10,
			covered: 8,
		});

		const tests = new Map([
			[
				"packages/utils",
				{
					totalTests: 5,
					totalSuites: 2,
					durationMs: 120,
					flakyTests: 1,
				},
			],
		]);

		const result = mergeWorkspaceMetrics(coverage, tests);
		expect(result).toHaveLength(1);
		expect(result[0]).toMatchObject({
			workspace: "packages/utils",
			totalTests: 5,
			statements: { total: 10, covered: 8, pct: 80 },
		});
	});

	it("counts flaky assertions across suites", () => {
		const suite = {
			retryReasons: ["timeout"],
			assertionResults: [
				{ status: "flaky" },
				{ retryReasons: ["network", "api"] },
			],
		};

		expect(countFlakyAssertions(suite)).toBe(4);
	});

	it("formats coverage totals with percentages", () => {
		const formatted = formatCoverageTotals({
			statements: { total: 20, covered: 15 },
			branches: { total: 10, covered: 5 },
			lines: { total: 0, covered: 0 },
			functions: { total: 8, covered: 8 },
		});

		expect(formatted.statements.pct).toBe(75);
		expect(formatted.branches.pct).toBe(50);
		expect(formatted.lines.pct).toBe(0);
		expect(formatted.functions.pct).toBe(100);
	});

	it("derives workspace names relative to repository root", () => {
		const fakeFile = path.join(
			process.cwd(),
			"packages/utils/coverage/coverage-summary.json",
		);

		const repoRoot = path.resolve(process.cwd(), "..", "..");
		const result = deriveWorkspaceFromFile(repoRoot, fakeFile);
		expect(result.endsWith(path.join("packages", "utils"))).toBe(true);
	});
});
