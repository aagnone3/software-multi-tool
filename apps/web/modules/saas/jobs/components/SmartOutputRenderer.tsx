"use client";

import { Badge } from "@ui/components/badge";
import { Button } from "@ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@ui/components/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ui/components/tabs";
import {
	AlertCircleIcon,
	CheckCircleIcon,
	ChevronDownIcon,
	ChevronRightIcon,
	CodeIcon,
	ListIcon,
	TableIcon,
} from "lucide-react";
import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isPrimitive(v: unknown): v is string | number | boolean | null {
	return v === null || typeof v !== "object";
}

function isArrayOfObjects(v: unknown): v is Record<string, unknown>[] {
	return (
		Array.isArray(v) &&
		v.length > 0 &&
		v.every(
			(item) =>
				typeof item === "object" &&
				item !== null &&
				!Array.isArray(item),
		)
	);
}

function getAllKeys(rows: Record<string, unknown>[]): string[] {
	const keySet = new Set<string>();
	for (const row of rows) {
		for (const key of Object.keys(row)) {
			keySet.add(key);
		}
	}
	return Array.from(keySet);
}

function renderValue(value: unknown): React.ReactNode {
	if (value === null || value === undefined) {
		return <span className="text-muted-foreground italic">—</span>;
	}
	if (typeof value === "boolean") {
		return value ? (
			<CheckCircleIcon className="size-4 text-green-500" />
		) : (
			<AlertCircleIcon className="size-4 text-red-500" />
		);
	}
	if (typeof value === "number") {
		return <span className="tabular-nums">{value.toLocaleString()}</span>;
	}
	if (typeof value === "string") {
		if (value.length > 100) {
			return <TruncatedText text={value} />;
		}
		return <span>{value}</span>;
	}
	if (Array.isArray(value)) {
		return (
			<span className="text-muted-foreground text-xs">
				[{value.length} items]
			</span>
		);
	}
	return (
		<span className="text-muted-foreground text-xs font-mono">
			{JSON.stringify(value).slice(0, 60)}
		</span>
	);
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TruncatedText({ text }: { text: string }) {
	const [expanded, setExpanded] = useState(false);
	const preview = text.slice(0, 100);
	return (
		<span>
			{expanded ? text : `${preview}…`}{" "}
			<button
				type="button"
				className="text-xs text-primary underline ml-1"
				onClick={() => setExpanded(!expanded)}
			>
				{expanded ? "show less" : "show more"}
			</button>
		</span>
	);
}

function TableView({ rows }: { rows: Record<string, unknown>[] }) {
	const keys = getAllKeys(rows);
	return (
		<div className="overflow-auto max-h-80">
			<table className="w-full text-xs border-collapse">
				<thead>
					<tr className="border-b bg-muted/50">
						{keys.map((k) => (
							<th
								key={k}
								className="text-left px-3 py-2 font-medium text-muted-foreground capitalize whitespace-nowrap"
							>
								{k.replace(/_/g, " ")}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{rows.map((row, i) => (
						// biome-ignore lint/suspicious/noArrayIndexKey: table rows
						<tr key={i} className="border-b hover:bg-muted/25">
							{keys.map((k) => (
								<td key={k} className="px-3 py-2 align-top">
									{renderValue(row[k])}
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function KeyValueList({ obj }: { obj: Record<string, unknown> }) {
	const entries = Object.entries(obj).filter(
		([, v]) => !Array.isArray(v) || (v as unknown[]).length === 0,
	);
	const nestedEntries = Object.entries(obj).filter(
		([, v]) => Array.isArray(v) && (v as unknown[]).length > 0,
	);

	return (
		<div className="space-y-2">
			{entries.length > 0 && (
				<dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
					{entries.map(([k, v]) => (
						<React.Fragment key={k}>
							<dt className="text-muted-foreground capitalize font-medium whitespace-nowrap">
								{k.replace(/_/g, " ")}
							</dt>
							<dd>{renderValue(v)}</dd>
						</React.Fragment>
					))}
				</dl>
			)}
			{nestedEntries.map(([k, v]) => (
				<NestedSection key={k} label={k} value={v} />
			))}
		</div>
	);
}

function NestedSection({ label, value }: { label: string; value: unknown }) {
	const [open, setOpen] = useState(true);
	const arr = Array.isArray(value) ? value : [];
	return (
		<div className="border rounded-md overflow-hidden">
			<button
				type="button"
				className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium bg-muted/40 hover:bg-muted/60 text-left"
				onClick={() => setOpen(!open)}
			>
				{open ? (
					<ChevronDownIcon className="size-4" />
				) : (
					<ChevronRightIcon className="size-4" />
				)}
				<span className="capitalize">{label.replace(/_/g, " ")}</span>
				<Badge className="ml-auto text-xs">{arr.length}</Badge>
			</button>
			{open && (
				<div className="p-2">
					{isArrayOfObjects(arr) ? (
						<TableView rows={arr} />
					) : (
						<ul className="space-y-1 text-sm">
							{arr.map((item, i) => (
								// biome-ignore lint/suspicious/noArrayIndexKey: list items
								<li
									key={i}
									className="flex items-start gap-2 px-2 py-1 rounded hover:bg-muted/30"
								>
									<ListIcon className="size-3 mt-0.5 text-muted-foreground shrink-0" />
									<span>
										{isPrimitive(item)
											? String(item)
											: JSON.stringify(item)}
									</span>
								</li>
							))}
						</ul>
					)}
				</div>
			)}
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface SmartOutputRendererProps {
	output: unknown;
	toolSlug?: string;
}

type ViewMode = "smart" | "raw";

export function SmartOutputRenderer({
	output,
	toolSlug: _toolSlug,
}: SmartOutputRendererProps) {
	const [view, setView] = useState<ViewMode>("smart");

	const rawText = (() => {
		try {
			return JSON.stringify(output, null, 2);
		} catch {
			return String(output);
		}
	})();

	// Determine top-level shape
	const isObj =
		typeof output === "object" && output !== null && !Array.isArray(output);
	const isArr = Array.isArray(output);
	const isArrOfObj = isArr && isArrayOfObjects(output as unknown[]);

	const canShowSmart = isObj || isArrOfObj;

	return (
		<div className="space-y-2">
			{canShowSmart ? (
				<Tabs
					value={view}
					onValueChange={(v) => setView(v as ViewMode)}
				>
					<TabsList className="h-8">
						<TabsTrigger value="smart" className="text-xs gap-1.5">
							<TableIcon className="size-3" />
							Formatted
						</TabsTrigger>
						<TabsTrigger value="raw" className="text-xs gap-1.5">
							<CodeIcon className="size-3" />
							Raw JSON
						</TabsTrigger>
					</TabsList>
					<TabsContent value="smart" className="mt-2">
						{isObj ? (
							<Card className="border-muted">
								<CardHeader className="pb-2 pt-3 px-4">
									<CardTitle className="text-sm">
										Result
									</CardTitle>
								</CardHeader>
								<CardContent className="px-4 pb-4">
									<KeyValueList
										obj={output as Record<string, unknown>}
									/>
								</CardContent>
							</Card>
						) : isArrOfObj ? (
							<TableView
								rows={output as Record<string, unknown>[]}
							/>
						) : null}
					</TabsContent>
					<TabsContent value="raw" className="mt-2">
						<RawOutput text={rawText} />
					</TabsContent>
				</Tabs>
			) : (
				<RawOutput text={rawText} />
			)}
		</div>
	);
}

function RawOutput({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	return (
		<div className="relative">
			<Button
				variant="ghost"
				size="sm"
				className="absolute top-2 right-2 z-10"
				onClick={async () => {
					await navigator.clipboard.writeText(text);
					setCopied(true);
					setTimeout(() => setCopied(false), 2000);
				}}
			>
				{copied ? "Copied!" : "Copy"}
			</Button>
			<pre className="bg-muted rounded-lg p-4 pt-10 text-xs overflow-auto max-h-96 text-foreground font-mono">
				{text}
			</pre>
		</div>
	);
}
