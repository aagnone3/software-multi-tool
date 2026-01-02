import fs from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
	countFlakyAssertions,
	deriveWorkspaceFromFile,
	extractCoverageTotals,
	formatCoverageTotals,
	mergeWorkspaceMetrics,
	roundNumber,
	type WorkspaceCoverage,
	type WorkspaceMetrics,
	type WorkspaceTestMetrics,
} from "./testing-metrics-helpers";

export type {
	CoverageTotals,
	WorkspaceCoverage,
	WorkspaceMetrics,
	WorkspaceTestMetrics,
} from "./testing-metrics-helpers";

const REPO_ROOT = path.resolve(
	process.env.INIT_CWD ?? path.join(__dirname, "..", "..", ".."),
);

const WORKSPACE_ROOTS = ["apps", "packages", "tooling"];
const SINGLE_WORKSPACES = ["config"];
const HISTORY_LIMIT = Number(process.env.TESTING_METRICS_HISTORY_LIMIT ?? 50);

const workspaceFromFile = (file: string) =>
	deriveWorkspaceFromFile(REPO_ROOT, file);

interface AggregatedMetrics {
	timestamp: string;
	coverage: WorkspaceCoverage;
	testDurationMs: number;
	flakyTests: number;
	totals: {
		testSuites: number;
		tests: number;
	};
	workspaces: WorkspaceMetrics[];
}

/* c8 ignore next */
async function main() {
	const { coverageFiles, vitestFiles } = await collectMetricFiles();

	if (coverageFiles.length === 0 && vitestFiles.length === 0) {
		console.error(
			"No coverage or vitest result files found. Run tests with coverage before collecting metrics.",
		);
		process.exitCode = 1;
		return;
	}

	const coverageData = aggregateCoverage(coverageFiles);
	const vitestData = aggregateVitest(vitestFiles);

	const workspaces = mergeWorkspaceMetrics(
		coverageData.workspaces,
		vitestData.workspaces,
	);
	const entry: AggregatedMetrics = {
		timestamp: new Date().toISOString(),
		coverage: coverageData.total,
		testDurationMs: roundNumber(vitestData.totalDuration),
		flakyTests: vitestData.totalFlaky,
		totals: {
			testSuites: vitestData.totalSuites,
			tests: vitestData.totalTests,
		},
		workspaces,
	};

	const metricsDir = path.join(REPO_ROOT, "metrics");
	await mkdir(metricsDir, { recursive: true });

	const historyPath = path.join(metricsDir, "testing-history.json");
	const latestPath = path.join(metricsDir, "latest.json");

	const history = await readHistory(historyPath);
	history.push(entry);
	if (HISTORY_LIMIT > 0 && history.length > HISTORY_LIMIT) {
		history.splice(0, history.length - HISTORY_LIMIT);
	}
	await writeFile(
		historyPath,
		`${JSON.stringify(history, null, 2)}\n`,
		"utf8",
	);
	await writeFile(latestPath, `${JSON.stringify(entry, null, 2)}\n`, "utf8");

	console.log(
		`Captured metrics from ${coverageFiles.length} coverage summaries and ${vitestFiles.length} test reports.`,
	);
	console.log(
		`Latest metrics written to ${path.relative(REPO_ROOT, latestPath)}`,
	);
}

/* c8 ignore next */
async function collectMetricFiles() {
	const coverageFiles: string[] = [];
	const vitestFiles: string[] = [];

	const enqueueWorkspace = async (workspacePath: string) => {
		const coverageDir = path.join(workspacePath, "coverage");
		const summaryPath = path.join(coverageDir, "coverage-summary.json");
		const vitestPath = path.join(coverageDir, "vitest-results.json");
		if (await exists(summaryPath)) {
			coverageFiles.push(summaryPath);
		}
		if (await exists(vitestPath)) {
			vitestFiles.push(vitestPath);
		}
	};

	for (const root of WORKSPACE_ROOTS) {
		const rootPath = path.join(REPO_ROOT, root);
		if (!(await exists(rootPath))) {
			continue;
		}
		const entries = await readdir(rootPath, { withFileTypes: true });
		for (const entry of entries) {
			if (!entry.isDirectory()) {
				continue;
			}
			await enqueueWorkspace(path.join(rootPath, entry.name));
		}
	}

	for (const single of SINGLE_WORKSPACES) {
		const singlePath = path.join(REPO_ROOT, single);
		if (await exists(singlePath)) {
			await enqueueWorkspace(singlePath);
		}
	}

	// Consider root coverage if present (e.g., aggregated reports)
	await enqueueWorkspace(REPO_ROOT);

	return { coverageFiles, vitestFiles };
}

/* c8 ignore next */
function aggregateCoverage(files: string[]) {
	const totals: Record<string, { total: number; covered: number }> = {
		statements: { total: 0, covered: 0 },
		branches: { total: 0, covered: 0 },
		lines: { total: 0, covered: 0 },
		functions: { total: 0, covered: 0 },
	};

	const workspaces = new Map<string, WorkspaceCoverage>();

	for (const file of files) {
		const summary = safeReadJson<Record<string, any>>(file);
		if (!summary) {
			continue;
		}
		const workspace = workspaceFromFile(file);
		const workspaceTotals = extractCoverageTotals(summary.total ?? {});
		workspaces.set(workspace, workspaceTotals);

		for (const key of Object.keys(totals)) {
			const metric = summary.total?.[key];
			if (!metric) {
				continue;
			}
			totals[key].total += metric.total ?? 0;
			totals[key].covered += metric.covered ?? 0;
		}
	}

	return {
		total: formatCoverageTotals(totals),
		workspaces,
	};
}

/* c8 ignore next */
function aggregateVitest(files: string[]) {
	let totalDuration = 0;
	let totalTests = 0;
	let totalSuites = 0;
	let totalFlaky = 0;

	const workspaces = new Map<string, WorkspaceTestMetrics>();

	for (const file of files) {
		const result = safeReadJson<any>(file);
		if (!result) {
			continue;
		}

		const workspace = workspaceFromFile(file);
		const suites = Array.isArray(result.testResults)
			? result.testResults
			: [];

		const workspaceMetrics: WorkspaceTestMetrics = {
			totalTests: Number(result.numTotalTests ?? suites.length) || 0,
			totalSuites:
				Number(result.numTotalTestSuites ?? suites.length) ||
				suites.length,
			durationMs: 0,
			flakyTests: 0,
		};

		for (const suite of suites) {
			const start =
				typeof suite.startTime === "number" ? suite.startTime : 0;
			const end = typeof suite.endTime === "number" ? suite.endTime : 0;
			if (end >= start) {
				workspaceMetrics.durationMs += end - start;
			}
			workspaceMetrics.flakyTests += countFlakyAssertions(suite);
		}

		workspaceMetrics.durationMs = roundNumber(workspaceMetrics.durationMs);
		workspaces.set(workspace, workspaceMetrics);

		totalDuration += workspaceMetrics.durationMs;
		totalTests += workspaceMetrics.totalTests;
		totalSuites += workspaceMetrics.totalSuites;
		totalFlaky += workspaceMetrics.flakyTests;
	}

	return {
		totalDuration,
		totalTests,
		totalSuites,
		totalFlaky,
		workspaces,
	};
}

/* c8 ignore next */
async function readHistory(historyPath: string) {
	if (!(await exists(historyPath))) {
		return [] as AggregatedMetrics[];
	}
	const raw = await readFile(historyPath, "utf8");
	try {
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

/* c8 ignore next */
function safeReadJson<T>(file: string): T | null {
	try {
		const raw = fs.readFileSync(file, "utf8");
		return JSON.parse(raw) as T;
	} catch (error) {
		console.warn(
			`Failed to read JSON from ${path.relative(REPO_ROOT, file)}:`,
			error,
		);
		return null;
	}
}

/* c8 ignore next */
async function exists(target: string): Promise<boolean> {
	try {
		await fs.promises.access(target, fs.constants.F_OK);
		return true;
	} catch {
		return false;
	}
}

if (!process.env.VITEST) {
	main().catch((error) => {
		console.error("Failed to gather testing metrics:", error);
		process.exitCode = 1;
	});
}
