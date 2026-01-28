import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

export interface ExtractedContent {
	title: string;
	content: string;
	textContent: string;
	excerpt: string;
	byline: string | null;
	siteName: string | null;
	url: string;
}

export interface ExtractionError {
	success: false;
	error: string;
	errorType:
		| "FETCH_FAILED"
		| "PAYWALL"
		| "INVALID_URL"
		| "PARSE_FAILED"
		| "NO_CONTENT";
}

export type ExtractionResult =
	| { success: true; data: ExtractedContent }
	| ExtractionError;

/**
 * Extract readable article content from a URL using Mozilla Readability
 * @param url - The URL of the article to extract
 * @returns Extraction result with content or error details
 */
export async function extractContentFromUrl(
	url: string,
): Promise<ExtractionResult> {
	// Validate URL
	try {
		new URL(url);
	} catch {
		return {
			success: false,
			error: "Invalid URL format",
			errorType: "INVALID_URL",
		};
	}

	// Fetch the HTML content
	let html: string;
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

		const response = await fetch(url, {
			signal: controller.signal,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (compatible; NewsAnalyzer/1.0; +https://aimultitool.com)",
			},
		});

		clearTimeout(timeoutId);

		if (!response.ok) {
			if (response.status === 403 || response.status === 451) {
				return {
					success: false,
					error: "Access denied - content may be paywalled or restricted",
					errorType: "PAYWALL",
				};
			}
			return {
				success: false,
				error: `HTTP ${response.status}: ${response.statusText}`,
				errorType: "FETCH_FAILED",
			};
		}

		html = await response.text();
	} catch (error) {
		if (error instanceof Error) {
			if (error.name === "AbortError") {
				return {
					success: false,
					error: "Request timed out after 15 seconds",
					errorType: "FETCH_FAILED",
				};
			}
			return {
				success: false,
				error: `Failed to fetch URL: ${error.message}`,
				errorType: "FETCH_FAILED",
			};
		}
		return {
			success: false,
			error: "Failed to fetch URL: Unknown error",
			errorType: "FETCH_FAILED",
		};
	}

	// Parse and extract content using linkedom (bundle-friendly alternative to jsdom)
	try {
		const { document } = parseHTML(html);
		// Set the document URL for Readability (used for resolving relative links)
		Object.defineProperty(document, "documentURI", { value: url });
		// linkedom's document is compatible with Readability at runtime
		// but has different type definitions - cast to satisfy the type checker
		const reader = new Readability(document as unknown as Document);
		const article = reader.parse();

		if (!article) {
			return {
				success: false,
				error: "Could not extract article content - page may not be a news article",
				errorType: "NO_CONTENT",
			};
		}

		return {
			success: true,
			data: {
				title: article.title,
				content: article.content,
				textContent: article.textContent,
				excerpt: article.excerpt,
				byline: article.byline,
				siteName: article.siteName,
				url,
			},
		};
	} catch (error) {
		if (error instanceof Error) {
			return {
				success: false,
				error: `Failed to parse content: ${error.message}`,
				errorType: "PARSE_FAILED",
			};
		}
		return {
			success: false,
			error: "Failed to parse content: Unknown error",
			errorType: "PARSE_FAILED",
		};
	}
}

/**
 * Extract content from plain text (user-provided article text)
 * @param text - The article text
 * @param title - Optional title for the article
 * @returns Extracted content structure
 */
export function extractContentFromText(
	text: string,
	title?: string,
): ExtractedContent {
	return {
		title: title ?? "Untitled Article",
		content: `<p>${text.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")}</p>`,
		textContent: text,
		excerpt: text.slice(0, 200),
		byline: null,
		siteName: null,
		url: "",
	};
}
