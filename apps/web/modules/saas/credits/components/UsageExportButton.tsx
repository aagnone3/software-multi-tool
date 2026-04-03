"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { Button } from "@ui/components/button";
import { DownloadIcon } from "lucide-react";
import React from "react";
import { useUsageStats } from "../hooks/use-usage-stats";
import { formatToolName } from "../lib/format-tool-name";

function downloadCSV(filename: string, rows: string[][]): void {
	const csv = rows
		.map((row) =>
			row
				.map((cell) => {
					const escaped = String(cell).replace(/"/g, '""');
					return /[,"\n\r]/.test(escaped) ? `"${escaped}"` : escaped;
				})
				.join(","),
		)
		.join("\n");

	const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function UsageExportButton() {
	const { track } = useProductAnalytics();
	const { byTool, byPeriod, totalUsed, totalOverage, isLoading } =
		useUsageStats();

	const handleExport = () => {
		const now = new Date().toISOString().split("T")[0];

		// Sheet 1: by-tool summary
		const toolRows: string[][] = [
			["Tool", "Credits Used", "Operations", "Avg Credits/Op"],
			...byTool.map((t) => [
				formatToolName(t.toolSlug),
				String(t.credits),
				String(t.count),
				t.count > 0 ? (t.credits / t.count).toFixed(2) : "0",
			]),
			[],
			["Summary", "", "", ""],
			["Total Credits", String(totalUsed), "", ""],
			["Overage Credits", String(totalOverage), "", ""],
		];

		// Sheet 2: by-period trend (appended after blank line)
		const periodRows: string[][] = [
			[],
			["Date", "Credits Used"],
			...byPeriod.map((p) => [p.date, String(p.credits)]),
		];

		downloadCSV(`usage-report-${now}.csv`, [...toolRows, ...periodRows]);
		track({
			name: "usage_report_exported",
			props: {
				tool_count: byTool.length,
				period_count: byPeriod.length,
			},
		});
	};

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={handleExport}
			disabled={
				isLoading || (byTool.length === 0 && byPeriod.length === 0)
			}
		>
			<DownloadIcon className="size-4 mr-2" />
			Export Report
		</Button>
	);
}
