"use client";

import { useProductAnalytics } from "@analytics/hooks/use-product-analytics";
import { useCreditsBalance } from "@saas/credits/hooks/use-credits-balance";
import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { cn } from "@ui/lib";
import {
	CheckIcon,
	ClipboardIcon,
	DownloadIcon,
	FileJsonIcon,
	FileTextIcon,
	LockIcon,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

interface ToolOutputExporterProps {
	/** The data to export (will be JSON-serialized) */
	data: unknown;
	/** Human-readable label for the output, used as filename base */
	label?: string;
	/** Optional plain-text representation for TXT export */
	plainText?: string;
	className?: string;
}

function toFilename(label: string, ext: string): string {
	const slug = label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
	const ts = new Date().toISOString().slice(0, 10);
	return `${slug}-${ts}.${ext}`;
}

function downloadBlob(content: string, filename: string, mimeType: string) {
	const blob = new Blob([content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(url);
}

export function ToolOutputExporter({
	data,
	label = "output",
	plainText,
	className,
}: ToolOutputExporterProps) {
	const [copied, setCopied] = useState(false);
	const { isFreePlan, isLoading } = useCreditsBalance();
	const { track } = useProductAnalytics();

	// Downloads are a Pro feature; copy-to-clipboard stays free
	const downloadsLocked = !isLoading && isFreePlan;

	const handleCopyJson = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Copied to clipboard");
			track({ name: "tool_output_copied", props: { label } });
		} catch {
			toast.error("Failed to copy");
		}
	};

	const handleDownloadJson = () => {
		if (downloadsLocked) return;
		try {
			downloadBlob(
				JSON.stringify(data, null, 2),
				toFilename(label, "json"),
				"application/json",
			);
			toast.success("Downloaded JSON");
			track({
				name: "tool_output_downloaded",
				props: { label, format: "json" },
			});
		} catch {
			toast.error("Download failed");
		}
	};

	const handleDownloadTxt = () => {
		if (downloadsLocked) return;
		const content = plainText ?? JSON.stringify(data, null, 2);
		try {
			downloadBlob(content, toFilename(label, "txt"), "text/plain");
			toast.success("Downloaded TXT");
			track({
				name: "tool_output_downloaded",
				props: { label, format: "txt" },
			});
		} catch {
			toast.error("Download failed");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					size="sm"
					className={cn("gap-2", className)}
				>
					<DownloadIcon className="size-4" />
					Export
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuLabel>Export results</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={handleCopyJson}>
					{copied ? (
						<CheckIcon className="mr-2 size-4 text-green-500" />
					) : (
						<ClipboardIcon className="mr-2 size-4" />
					)}
					Copy as JSON
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{downloadsLocked ? (
					<>
						<DropdownMenuLabel className="flex items-center gap-1.5 text-muted-foreground text-xs font-normal">
							<LockIcon className="size-3" />
							Downloads require Pro
						</DropdownMenuLabel>
						<DropdownMenuItem asChild>
							<Link
								href="/pricing"
								className="flex items-center gap-2 text-primary"
								onClick={() =>
									track({
										name: "tool_output_upgrade_clicked",
										props: {},
									})
								}
							>
								Upgrade to unlock downloads
							</Link>
						</DropdownMenuItem>
					</>
				) : (
					<>
						<DropdownMenuItem onClick={handleDownloadJson}>
							<FileJsonIcon className="mr-2 size-4" />
							Download JSON
						</DropdownMenuItem>
						<DropdownMenuItem onClick={handleDownloadTxt}>
							<FileTextIcon className="mr-2 size-4" />
							Download TXT
						</DropdownMenuItem>
					</>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
