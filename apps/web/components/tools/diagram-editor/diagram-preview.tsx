"use client";

import { Alert, AlertDescription } from "@ui/components/alert";
import { cn } from "@ui/lib";
import { AlertCircle, Loader2 } from "lucide-react";
import mermaid from "mermaid";
import { useTheme } from "next-themes";
import { forwardRef, useEffect, useId, useRef, useState } from "react";

interface DiagramPreviewProps {
	code: string;
	className?: string;
}

export const DiagramPreview = forwardRef<HTMLDivElement, DiagramPreviewProps>(
	function DiagramPreview({ code, className }, ref) {
		const { resolvedTheme } = useTheme();
		const containerId = useId();
		const containerRef = useRef<HTMLDivElement>(null);
		const [error, setError] = useState<string | null>(null);
		const [isRendering, setIsRendering] = useState(false);

		// Initialize mermaid with theme
		useEffect(() => {
			mermaid.initialize({
				startOnLoad: false,
				theme: resolvedTheme === "dark" ? "dark" : "default",
				securityLevel: "loose",
				fontFamily: "inherit",
			});
		}, [resolvedTheme]);

		// Render diagram
		useEffect(() => {
			const container = containerRef.current;
			if (!container || !code.trim()) {
				return;
			}

			const renderDiagram = async () => {
				setIsRendering(true);
				setError(null);

				try {
					// Clear previous content
					container.innerHTML = "";

					// Validate syntax first
					const isValid = await mermaid.parse(code);
					if (!isValid) {
						setError("Invalid Mermaid syntax");
						setIsRendering(false);
						return;
					}

					// Render the diagram
					const { svg } = await mermaid.render(
						`mermaid-${containerId.replace(/:/g, "-")}`,
						code,
					);
					container.innerHTML = svg;

					// Apply some styling to the SVG
					const svgElement = container.querySelector("svg");
					if (svgElement) {
						svgElement.style.maxWidth = "100%";
						svgElement.style.height = "auto";
					}
				} catch (err) {
					const message =
						err instanceof Error
							? err.message
							: "Failed to render diagram";
					setError(message);
				} finally {
					setIsRendering(false);
				}
			};

			renderDiagram();
		}, [code, containerId, resolvedTheme]);

		// Forward ref to the container for export functionality
		useEffect(() => {
			if (ref && containerRef.current) {
				if (typeof ref === "function") {
					ref(containerRef.current);
				} else {
					ref.current = containerRef.current;
				}
			}
		}, [ref]);

		if (!code.trim()) {
			return (
				<div
					className={cn(
						"flex items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/50 p-12",
						className,
					)}
				>
					<p className="text-center text-muted-foreground">
						Enter Mermaid syntax in the editor to see a preview
					</p>
				</div>
			);
		}

		if (error) {
			return (
				<div className={cn("space-y-4", className)}>
					<Alert variant="error">
						<AlertCircle className="h-4 w-4" />
						<AlertDescription className="font-mono text-xs">
							{error}
						</AlertDescription>
					</Alert>
					<div className="rounded-lg border border-dashed border-destructive/25 bg-destructive/5 p-8">
						<p className="text-center text-sm text-muted-foreground">
							Fix the syntax error above to see the diagram
						</p>
					</div>
				</div>
			);
		}

		return (
			<div className={cn("relative", className)}>
				{isRendering && (
					<div className="absolute inset-0 z-10 flex items-center justify-center bg-background/50">
						<Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
					</div>
				)}
				<div
					ref={containerRef}
					className="flex items-center justify-center overflow-auto rounded-lg border bg-card p-4"
				/>
			</div>
		);
	},
);
