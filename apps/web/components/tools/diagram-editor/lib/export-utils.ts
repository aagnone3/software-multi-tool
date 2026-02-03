/**
 * Export utilities for diagram images
 */

import DOMPurify from "dompurify";

export interface ExportOptions {
	filename?: string;
	scale?: number;
	backgroundColor?: string;
}

/** Maximum scale factor to prevent memory exhaustion */
const MAX_SCALE = 4;

/** Timeout for blob URL cleanup (30 seconds) */
const CLEANUP_TIMEOUT_MS = 30000;

/**
 * Get the SVG element from a container
 */
function getSvgElement(container: HTMLElement): SVGSVGElement | null {
	return container.querySelector("svg");
}

/**
 * Serialize and sanitize an SVG element to a string
 */
function serializeAndSanitizeSvg(svg: SVGSVGElement): string {
	const serializer = new XMLSerializer();
	const svgString = serializer.serializeToString(svg);

	// Sanitize SVG to remove potential XSS vectors
	return DOMPurify.sanitize(svgString, {
		USE_PROFILES: { svg: true, svgFilters: true },
		ADD_TAGS: ["use"],
		FORBID_TAGS: ["script"],
		FORBID_ATTR: ["onclick", "onload", "onerror", "onmouseover"],
	});
}

/**
 * Copy SVG content to clipboard
 */
export async function copySvgToClipboard(
	container: HTMLElement,
): Promise<void> {
	const svg = getSvgElement(container);
	if (!svg) {
		throw new Error("No SVG element found");
	}

	const svgString = serializeAndSanitizeSvg(svg);
	await navigator.clipboard.writeText(svgString);
}

/**
 * Download SVG as a file
 */
export function downloadSvg(
	container: HTMLElement,
	options: ExportOptions = {},
): void {
	const svg = getSvgElement(container);
	if (!svg) {
		throw new Error("No SVG element found");
	}

	const filename = options.filename || "diagram.svg";
	const svgString = serializeAndSanitizeSvg(svg);
	const blob = new Blob([svgString], { type: "image/svg+xml" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}

/**
 * Convert SVG to PNG data URL
 */
async function svgToPngDataUrl(
	svg: SVGSVGElement,
	options: ExportOptions = {},
): Promise<string> {
	// Cap scale to prevent memory exhaustion
	const scale = Math.min(options.scale || 2, MAX_SCALE);
	const backgroundColor = options.backgroundColor || "white";

	// Get SVG dimensions
	const svgRect = svg.getBoundingClientRect();
	const width = svgRect.width * scale;
	const height = svgRect.height * scale;

	// Clone SVG and set explicit dimensions
	const clonedSvg = svg.cloneNode(true) as SVGSVGElement;
	clonedSvg.setAttribute("width", String(width));
	clonedSvg.setAttribute("height", String(height));

	// Serialize and sanitize SVG
	const svgString = serializeAndSanitizeSvg(clonedSvg);
	const svgBlob = new Blob([svgString], { type: "image/svg+xml" });
	const svgUrl = URL.createObjectURL(svgBlob);

	return new Promise((resolve, reject) => {
		// Set up cleanup timeout to prevent memory leaks
		const cleanup = () => URL.revokeObjectURL(svgUrl);
		const timeoutId = setTimeout(() => {
			cleanup();
			reject(new Error("Image load timeout"));
		}, CLEANUP_TIMEOUT_MS);

		const img = new Image();
		img.onload = () => {
			clearTimeout(timeoutId);

			// Create canvas
			const canvas = document.createElement("canvas");
			canvas.width = width;
			canvas.height = height;

			const ctx = canvas.getContext("2d");
			if (!ctx) {
				cleanup();
				reject(new Error("Failed to get canvas context"));
				return;
			}

			// Fill background
			ctx.fillStyle = backgroundColor;
			ctx.fillRect(0, 0, width, height);

			// Draw SVG
			ctx.drawImage(img, 0, 0, width, height);

			// Get data URL before cleanup
			const dataUrl = canvas.toDataURL("image/png");

			// Clean up resources
			cleanup();

			// Help garbage collection
			canvas.width = 0;
			canvas.height = 0;

			resolve(dataUrl);
		};

		img.onerror = () => {
			clearTimeout(timeoutId);
			cleanup();
			reject(new Error("Failed to load SVG image"));
		};

		img.src = svgUrl;
	});
}

/**
 * Copy PNG to clipboard
 */
export async function copyPngToClipboard(
	container: HTMLElement,
	options: ExportOptions = {},
): Promise<void> {
	const svg = getSvgElement(container);
	if (!svg) {
		throw new Error("No SVG element found");
	}

	const dataUrl = await svgToPngDataUrl(svg, options);

	// Convert data URL to blob
	const response = await fetch(dataUrl);
	const blob = await response.blob();

	await navigator.clipboard.write([
		new ClipboardItem({
			"image/png": blob,
		}),
	]);
}

/**
 * Download PNG as a file
 */
export async function downloadPng(
	container: HTMLElement,
	options: ExportOptions = {},
): Promise<void> {
	const svg = getSvgElement(container);
	if (!svg) {
		throw new Error("No SVG element found");
	}

	const filename = options.filename || "diagram.png";
	const dataUrl = await svgToPngDataUrl(svg, options);

	const link = document.createElement("a");
	link.href = dataUrl;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}
