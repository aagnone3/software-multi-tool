"use client";

import { Button } from "@ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@ui/components/dropdown-menu";
import { ChevronDown, Copy, Download, Image } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
	copyPngToClipboard,
	copySvgToClipboard,
	downloadPng,
	downloadSvg,
} from "./lib/export-utils";

interface DiagramExportProps {
	containerRef: React.RefObject<HTMLDivElement | null>;
	disabled?: boolean;
}

export function DiagramExport({ containerRef, disabled }: DiagramExportProps) {
	const { resolvedTheme } = useTheme();

	const getBackgroundColor = () => {
		return resolvedTheme === "dark" ? "#1a1a1a" : "#ffffff";
	};

	const handleAction = async (
		action: () => Promise<void> | void,
		successMessage: string,
	) => {
		if (!containerRef.current) {
			toast.error("No diagram to export");
			return;
		}

		try {
			await action();
			toast.success(successMessage);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Export failed");
		}
	};

	const handleCopyPng = () => {
		const container = containerRef.current;
		if (!container) {
			return;
		}
		handleAction(
			() =>
				copyPngToClipboard(container, {
					backgroundColor: getBackgroundColor(),
				}),
			"PNG copied to clipboard",
		);
	};

	const handleCopySvg = () => {
		const container = containerRef.current;
		if (!container) {
			return;
		}
		handleAction(
			() => copySvgToClipboard(container),
			"SVG copied to clipboard",
		);
	};

	const handleDownloadPng = () => {
		const container = containerRef.current;
		if (!container) {
			return;
		}
		handleAction(
			() =>
				downloadPng(container, {
					backgroundColor: getBackgroundColor(),
				}),
			"PNG downloaded",
		);
	};

	const handleDownloadSvg = () => {
		const container = containerRef.current;
		if (!container) {
			return;
		}
		handleAction(() => downloadSvg(container), "SVG downloaded");
	};

	return (
		<div className="flex gap-2">
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" disabled={disabled}>
						<Copy className="mr-2 h-4 w-4" />
						Copy
						<ChevronDown className="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={handleCopyPng}>
						<Image className="mr-2 h-4 w-4" />
						Copy as PNG
					</DropdownMenuItem>
					<DropdownMenuItem onClick={handleCopySvg}>
						<Copy className="mr-2 h-4 w-4" />
						Copy as SVG
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button variant="outline" size="sm" disabled={disabled}>
						<Download className="mr-2 h-4 w-4" />
						Download
						<ChevronDown className="ml-2 h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={handleDownloadPng}>
						<Image className="mr-2 h-4 w-4" />
						Download PNG
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem onClick={handleDownloadSvg}>
						<Download className="mr-2 h-4 w-4" />
						Download SVG
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}
