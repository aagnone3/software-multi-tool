#!/usr/bin/env tsx

/**
 * Weekly Test-Readiness Summary Generator
 *
 * Generates a comprehensive weekly summary covering:
 * - Coverage trends (comparing to previous week)
 * - Flaky tests
 * - Coverage threshold blockers
 * - Recent PRs with test-related changes
 */

import { execSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { coverageThresholds } from "../../test/coverage-thresholds.js";
import type {
	CoverageTotals,
	TestingMetrics,
} from "./testing-metrics-helpers.js";

interface SummaryOptions {
	daysBack?: number;
	includeDetails?: boolean;
	outputFormat?: "markdown" | "json";
}

interface CoverageTrend {
	workspace: string;
	current: { statements: number; branches: number };
	previous: { statements: number; branches: number };
	delta: { statements: number; branches: number };
	thresholds: { statements: number; branches: number };
	status: "passing" | "warning" | "failing";
}

interface WeeklySummary {
	generatedAt: string;
	period: { start: string; end: string };
	overview: {
		totalTests: number;
		totalCoverage: {
			statements: number;
			branches: number;
			lines: number;
			functions: number;
		};
		coverageTrend: {
			statements: { current: number; previous: number; delta: number };
			branches: { current: number; previous: number; delta: number };
		};
		flakyTests: {
			current: number;
			previous: number;
			delta: number;
		};
	};
	workspaces: CoverageTrend[];
	blockers: Array<{
		workspace: string;
		metric: "statements" | "branches";
		current: number;
		threshold: number;
		gap: number;
	}>;
	recentPRs?: Array<{
		number: number;
		title: string;
		author: string;
		url: string;
		mergedAt: string;
		labels: string[];
	}>;
}

function readMetricsFile(path: string): TestingMetrics | null {
	if (!existsSync(path)) {
		return null;
	}
	try {
		const content = readFileSync(path, "utf-8");
		return JSON.parse(content) as TestingMetrics;
	} catch (error) {
		console.error(`Failed to read metrics from ${path}:`, error);
		return null;
	}
}

function getPercentage(totals: CoverageTotals): number {
	return totals.total === 0 ? 0 : (totals.covered / totals.total) * 100;
}

function getPreviousWeekMetrics(
	historyFile: string,
	daysBack: number,
): TestingMetrics | null {
	const history = readMetricsFile(historyFile) as unknown;
	if (!history || !Array.isArray(history)) {
		return null;
	}

	const cutoffDate = new Date();
	cutoffDate.setDate(cutoffDate.getDate() - daysBack);
	const cutoffTimestamp = cutoffDate.toISOString();

	// Find the closest entry from around the cutoff date
	const previousEntry = history
		.filter((entry) => entry.timestamp <= cutoffTimestamp)
		.sort((a, b) => b.timestamp.localeCompare(a.timestamp))[0];

	return previousEntry as TestingMetrics | null;
}

function calculateWorkspaceTrends(
	current: TestingMetrics,
	previous: TestingMetrics | null,
): CoverageTrend[] {
	const trends: CoverageTrend[] = [];

	for (const workspace of current.workspaces) {
		const prevWorkspace = previous?.workspaces.find(
			(w) => w.workspace === workspace.workspace,
		);

		const currentStatements = getPercentage(workspace.statements);
		const currentBranches = getPercentage(workspace.branches);
		const prevStatements = prevWorkspace
			? getPercentage(prevWorkspace.statements)
			: currentStatements;
		const prevBranches = prevWorkspace
			? getPercentage(prevWorkspace.branches)
			: currentBranches;

		const threshold = coverageThresholds.find(
			(t) => t.workspace === workspace.workspace,
		) ?? { workspace: workspace.workspace, statements: 0, branches: 0 };

		let status: CoverageTrend["status"] = "passing";
		if (
			currentStatements < threshold.statements ||
			currentBranches < threshold.branches
		) {
			status = "failing";
		} else if (
			currentStatements < threshold.statements + 5 ||
			currentBranches < threshold.branches + 5
		) {
			status = "warning";
		}

		trends.push({
			workspace: workspace.workspace,
			current: {
				statements: currentStatements,
				branches: currentBranches,
			},
			previous: {
				statements: prevStatements,
				branches: prevBranches,
			},
			delta: {
				statements: currentStatements - prevStatements,
				branches: currentBranches - prevBranches,
			},
			thresholds: {
				statements: threshold.statements,
				branches: threshold.branches,
			},
			status,
		});
	}

	return trends.sort((a, b) => {
		// Sort by status (failing first) then by delta (largest drops first)
		if (a.status !== b.status) {
			const statusOrder = { failing: 0, warning: 1, passing: 2 };
			return statusOrder[a.status] - statusOrder[b.status];
		}
		return a.delta.statements - b.delta.statements;
	});
}

function identifyBlockers(trends: CoverageTrend[]) {
	const blockers: WeeklySummary["blockers"] = [];

	for (const trend of trends) {
		if (trend.current.statements < trend.thresholds.statements) {
			blockers.push({
				workspace: trend.workspace,
				metric: "statements",
				current: trend.current.statements,
				threshold: trend.thresholds.statements,
				gap: trend.thresholds.statements - trend.current.statements,
			});
		}
		if (trend.current.branches < trend.thresholds.branches) {
			blockers.push({
				workspace: trend.workspace,
				metric: "branches",
				current: trend.current.branches,
				threshold: trend.thresholds.branches,
				gap: trend.thresholds.branches - trend.current.branches,
			});
		}
	}

	return blockers.sort((a, b) => b.gap - a.gap);
}

function fetchRecentPRs(
	daysBack: number,
): WeeklySummary["recentPRs"] | undefined {
	try {
		const sinceDate = new Date();
		sinceDate.setDate(sinceDate.getDate() - daysBack);
		const since = sinceDate.toISOString();

		// Fetch merged PRs with test-related labels
		const result = execSync(
			`gh pr list --state merged --limit 100 --json number,title,author,url,mergedAt,labels --search "is:pr is:merged merged:>=${since}"`,
			{ encoding: "utf-8", stdio: ["pipe", "pipe", "ignore"] },
		);

		const allPRs = JSON.parse(result) as Array<{
			number: number;
			title: string;
			author: { login: string };
			url: string;
			mergedAt: string;
			labels: Array<{ name: string }>;
		}>;

		// Filter for test-related PRs (by label or title keywords)
		const testKeywords = [
			"test",
			"coverage",
			"ci",
			"flaky",
			"playwright",
			"vitest",
		];
		const testRelatedPRs = allPRs.filter((pr) => {
			const hasTestLabel = pr.labels.some((label) =>
				testKeywords.some((keyword) =>
					label.name.toLowerCase().includes(keyword),
				),
			);
			const hasTestInTitle = testKeywords.some((keyword) =>
				pr.title.toLowerCase().includes(keyword),
			);
			return hasTestLabel || hasTestInTitle;
		});

		return testRelatedPRs.map((pr) => ({
			number: pr.number,
			title: pr.title,
			author: pr.author.login,
			url: pr.url,
			mergedAt: pr.mergedAt,
			labels: pr.labels.map((l) => l.name),
		}));
	} catch (_error) {
		console.warn(
			"Failed to fetch recent PRs (gh CLI may not be available)",
		);
		return undefined;
	}
}

function formatMarkdownSummary(summary: WeeklySummary): string {
	const lines: string[] = [];

	lines.push("# Weekly Test-Readiness Summary");
	lines.push("");
	lines.push(
		`**Generated:** ${new Date(summary.generatedAt).toLocaleString()}`,
	);
	lines.push(`**Period:** ${summary.period.start} to ${summary.period.end}`);
	lines.push("");

	// Overview
	lines.push("## Overview");
	lines.push("");
	lines.push(`- **Total Tests:** ${summary.overview.totalTests}`);
	lines.push(
		`- **Statement Coverage:** ${summary.overview.totalCoverage.statements.toFixed(1)}% ${formatDelta(summary.overview.coverageTrend.statements.delta)}`,
	);
	lines.push(
		`- **Branch Coverage:** ${summary.overview.totalCoverage.branches.toFixed(1)}% ${formatDelta(summary.overview.coverageTrend.branches.delta)}`,
	);
	lines.push(
		`- **Flaky Tests:** ${summary.overview.flakyTests.current} ${formatDelta(summary.overview.flakyTests.delta)}`,
	);
	lines.push("");

	// Blockers
	if (summary.blockers.length > 0) {
		lines.push("## ⚠️ Coverage Threshold Blockers");
		lines.push("");
		lines.push(
			"The following workspaces are below their coverage thresholds and will block CI:",
		);
		lines.push("");
		lines.push("| Workspace | Metric | Current | Threshold | Gap |");
		lines.push("|-----------|--------|---------|-----------|-----|");
		for (const blocker of summary.blockers) {
			lines.push(
				`| ${blocker.workspace} | ${blocker.metric} | ${blocker.current.toFixed(1)}% | ${blocker.threshold}% | ${blocker.gap.toFixed(1)}% |`,
			);
		}
		lines.push("");
	}

	// Workspace Trends
	lines.push("## Coverage Trends by Workspace");
	lines.push("");
	lines.push(
		"| Workspace | Statements | Branches | Status | Threshold (S/B) |",
	);
	lines.push(
		"|-----------|------------|----------|--------|-----------------|",
	);
	for (const trend of summary.workspaces) {
		const statementsCell = `${trend.current.statements.toFixed(1)}% ${formatDelta(trend.delta.statements)}`;
		const branchesCell = `${trend.current.branches.toFixed(1)}% ${formatDelta(trend.delta.branches)}`;
		const statusEmoji =
			trend.status === "failing"
				? "❌"
				: trend.status === "warning"
					? "⚠️"
					: "✅";
		const thresholdCell = `${trend.thresholds.statements}% / ${trend.thresholds.branches}%`;
		lines.push(
			`| ${trend.workspace} | ${statementsCell} | ${branchesCell} | ${statusEmoji} | ${thresholdCell} |`,
		);
	}
	lines.push("");

	// Recent PRs
	if (summary.recentPRs && summary.recentPRs.length > 0) {
		lines.push("## Recent Test-Related PRs");
		lines.push("");
		lines.push("| PR | Title | Author | Merged |");
		lines.push("|----|-------|--------|--------|");
		for (const pr of summary.recentPRs.slice(0, 10)) {
			const mergedDate = new Date(pr.mergedAt).toLocaleDateString();
			lines.push(
				`| [#${pr.number}](${pr.url}) | ${pr.title} | @${pr.author} | ${mergedDate} |`,
			);
		}
		lines.push("");
	}

	// Action Items
	if (summary.blockers.length > 0) {
		lines.push("## Recommended Actions");
		lines.push("");
		const failingWorkspaces = new Set(
			summary.blockers.map((b) => b.workspace),
		);
		for (const workspace of failingWorkspaces) {
			const workspaceBlockers = summary.blockers.filter(
				(b) => b.workspace === workspace,
			);
			lines.push(
				`- **${workspace}**: Increase coverage by ${Math.max(...workspaceBlockers.map((b) => b.gap)).toFixed(1)}%`,
			);
		}
		lines.push("");
	}

	return lines.join("\n");
}

function formatDelta(delta: number): string {
	if (Math.abs(delta) < 0.1) {
		return "(→)";
	}
	const sign = delta > 0 ? "↑" : "↓";
	return `(${sign}${Math.abs(delta).toFixed(1)}%)`;
}

function generateSummary(options: SummaryOptions = {}): WeeklySummary {
	const daysBack = options.daysBack ?? 7;
	const metricsDir = join(process.cwd(), "../../metrics");
	const latestFile = join(metricsDir, "latest.json");
	const historyFile = join(metricsDir, "testing-history.json");

	const current = readMetricsFile(latestFile);
	if (!current) {
		throw new Error(
			"No current metrics found. Run 'pnpm metrics:collect' first.",
		);
	}

	const previous = getPreviousWeekMetrics(historyFile, daysBack);

	const endDate = new Date(current.timestamp);
	const startDate = new Date(endDate);
	startDate.setDate(startDate.getDate() - daysBack);

	const trends = calculateWorkspaceTrends(current, previous);
	const blockers = identifyBlockers(trends);

	const currentStatementsPct = getPercentage(current.coverage.statements);
	const currentBranchesPct = getPercentage(current.coverage.branches);
	const prevStatementsPct = previous
		? getPercentage(previous.coverage.statements)
		: currentStatementsPct;
	const prevBranchesPct = previous
		? getPercentage(previous.coverage.branches)
		: currentBranchesPct;

	const summary: WeeklySummary = {
		generatedAt: new Date().toISOString(),
		period: {
			start: startDate.toISOString().split("T")[0],
			end: endDate.toISOString().split("T")[0],
		},
		overview: {
			totalTests: current.totals.tests,
			totalCoverage: {
				statements: currentStatementsPct,
				branches: currentBranchesPct,
				lines: getPercentage(current.coverage.lines),
				functions: getPercentage(current.coverage.functions),
			},
			coverageTrend: {
				statements: {
					current: currentStatementsPct,
					previous: prevStatementsPct,
					delta: currentStatementsPct - prevStatementsPct,
				},
				branches: {
					current: currentBranchesPct,
					previous: prevBranchesPct,
					delta: currentBranchesPct - prevBranchesPct,
				},
			},
			flakyTests: {
				current: current.flakyTests,
				previous: previous?.flakyTests ?? current.flakyTests,
				delta:
					current.flakyTests -
					(previous?.flakyTests ?? current.flakyTests),
			},
		},
		workspaces: trends,
		blockers,
	};

	// Fetch recent PRs if requested
	if (options.includeDetails) {
		summary.recentPRs = fetchRecentPRs(daysBack);
	}

	return summary;
}

function main() {
	const args = process.argv.slice(2);
	const options: SummaryOptions = {
		daysBack: 7,
		includeDetails: true,
		outputFormat: "markdown",
	};

	// Parse command-line arguments
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === "--days" && args[i + 1]) {
			options.daysBack = Number.parseInt(args[i + 1], 10);
			i++;
		} else if (arg === "--format" && args[i + 1]) {
			options.outputFormat = args[i + 1] as "markdown" | "json";
			i++;
		} else if (arg === "--no-details") {
			options.includeDetails = false;
		}
	}

	const summary = generateSummary(options);

	if (options.outputFormat === "json") {
		console.log(JSON.stringify(summary, null, 2));
	} else {
		console.log(formatMarkdownSummary(summary));
	}
}

if (import.meta.url === `file://${process.argv[1]}`) {
	main();
}

export { generateSummary, formatMarkdownSummary, type WeeklySummary };
