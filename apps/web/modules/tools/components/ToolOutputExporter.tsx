"use client";

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
} from "lucide-react";
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

	const handleCopyJson = async () => {
		try {
			await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			toast.success("Copied to clipboard");
		} catch {
			toast.error("Failed to copy");
		}
	};

	const handleDownloadJson = () => {
		try {
			downloadBlob(
				JSON.stringify(data, null, 2),
				toFilename(label, "json"),
				"application/json",
			);
			toast.success("Downloaded JSON");
		} catch {
			toast.error("Download failed");
		}
	};

	const handleDownloadTxt = () => {
		const content = plainText ?? JSON.stringify(data, null, 2);
		try {
			downloadBlob(content, toFilename(label, "txt"), "text/plain");
			toast.success("Downloaded TXT");
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
			<DropdownMenuContent align="end" className="w-48">
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
				<DropdownMenuItem onClick={handleDownloadJson}>
					<FileJsonIcon className="mr-2 size-4" />
					Download JSON
				</DropdownMenuItem>
				<DropdownMenuItem onClick={handleDownloadTxt}>
					<FileTextIcon className="mr-2 size-4" />
					Download TXT
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
