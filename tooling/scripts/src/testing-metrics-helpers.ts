import path from "node:path";

export type CoverageTotals = {
	total: number;
	covered: number;
	pct: number;
};

export type WorkspaceCoverage = {
	statements: CoverageTotals;
	branches: CoverageTotals;
	lines: CoverageTotals;
	functions: CoverageTotals;
};

export type WorkspaceTestMetrics = {
	totalTests: number;
	totalSuites: number;
	durationMs: number;
	flakyTests: number;
};

export type WorkspaceMetrics = WorkspaceCoverage &
	WorkspaceTestMetrics & { workspace: string };

export function roundNumber(value: number): number {
	return Math.round(value * 100) / 100;
}

export function toCoverageTotal(value: any): CoverageTotals {
	const total = Number(value?.total ?? 0);
	const covered = Number(value?.covered ?? 0);
	const pct = total === 0 ? 0 : roundNumber((covered / total) * 100);
	return { total, covered, pct };
}

export function formatCoverageTotals(
	source: Record<string, { total: number; covered: number }>,
): WorkspaceCoverage {
	return {
		statements: calculatePct(source.statements),
		branches: calculatePct(source.branches),
		lines: calculatePct(source.lines),
		functions: calculatePct(source.functions),
	};
}

export function emptyCoverageTotals(): WorkspaceCoverage {
	const empty = { total: 0, covered: 0, pct: 0 } satisfies CoverageTotals;
	return {
		statements: { ...empty },
		branches: { ...empty },
		lines: { ...empty },
		functions: { ...empty },
	};
}

export function countFlakyAssertions(suite: any): number {
	let count = 0;
	if (Array.isArray(suite?.retryReasons)) {
		count += suite.retryReasons.length;
	}
	const assertions = Array.isArray(suite?.assertionResults)
		? suite.assertionResults
		: [];
	for (const assertion of assertions) {
		if (assertion?.status === "flaky") {
			count += 1;
		} else if (Array.isArray(assertion?.retryReasons)) {
			count += assertion.retryReasons.length;
		}
	}
	return count;
}

export function mergeWorkspaceMetrics(
	coverage: Map<string, WorkspaceCoverage>,
	tests: Map<string, WorkspaceTestMetrics>,
): WorkspaceMetrics[] {
	const workspaceNames = new Set<string>([
		...coverage.keys(),
		...tests.keys(),
	]);

	const combined: WorkspaceMetrics[] = [];
	for (const workspace of workspaceNames) {
		const cov = coverage.get(workspace) ?? emptyCoverageTotals();
		const test = tests.get(workspace) ?? {
			totalTests: 0,
			totalSuites: 0,
			durationMs: 0,
			flakyTests: 0,
		};

		combined.push({
			workspace,
			...cov,
			...test,
		});
	}

	return combined.sort((a, b) => a.workspace.localeCompare(b.workspace));
}

export function extractCoverageTotals(
	total: Record<string, any>,
): WorkspaceCoverage {
	return {
		statements: toCoverageTotal(total.statements),
		branches: toCoverageTotal(total.branches),
		lines: toCoverageTotal(total.lines),
		functions: toCoverageTotal(total.functions),
	};
}

export function calculatePct({
	total,
	covered,
}: {
	total: number;
	covered: number;
}): CoverageTotals {
	const pct = total === 0 ? 0 : roundNumber((covered / total) * 100);
	return { total, covered, pct };
}

export function deriveWorkspaceFromFile(
	repoRoot: string,
	file: string,
): string {
	const dir = path.dirname(path.dirname(file));
	const relative = path.relative(repoRoot, dir);
	return relative === "" ? "." : relative;
}
