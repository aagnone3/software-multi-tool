import { describe, expect, it, vi } from "vitest";
import {
	extractContentFromText,
	extractContentFromUrl,
} from "./content-extractor";

describe("content-extractor", () => {
	describe("extractContentFromUrl", () => {
		it("should reject invalid URL format", async () => {
			const result = await extractContentFromUrl("not-a-url");

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errorType).toBe("INVALID_URL");
				expect(result.error).toContain("Invalid URL");
			}
		});

		it("should reject relative URLs", async () => {
			const result = await extractContentFromUrl("/relative/path");

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errorType).toBe("INVALID_URL");
			}
		});

		it("should handle fetch timeouts gracefully", async () => {
			// Mock global fetch to simulate timeout
			const originalFetch = global.fetch;
			global.fetch = vi.fn(
				() =>
					new Promise((_, reject) => {
						setTimeout(() => reject(new Error("Timeout")), 100);
					}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/article",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errorType).toBe("FETCH_FAILED");
				expect(result.error).toContain("Failed to fetch");
			}

			// Restore
			global.fetch = originalFetch;
		}, 20000);

		it("should handle paywall errors (403 status)", async () => {
			// Mock global fetch to return 403
			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					status: 403,
					statusText: "Forbidden",
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://paywalled.com/article",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errorType).toBe("PAYWALL");
				expect(result.error).toContain("paywall");
			}

			// Restore
			global.fetch = originalFetch;
		});

		it("should handle HTTP errors (500 status)", async () => {
			// Mock global fetch to return 500
			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: false,
					status: 500,
					statusText: "Internal Server Error",
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://error.com/article",
			);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.errorType).toBe("FETCH_FAILED");
				expect(result.error).toContain("500");
			}

			// Restore
			global.fetch = originalFetch;
		});

		it("should extract content from valid HTML", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head><title>Test Article</title></head>
					<body>
						<article>
							<h1>Test Headline</h1>
							<p>This is the article content. It contains important information about the topic.</p>
							<p>Another paragraph with more details.</p>
						</article>
					</body>
				</html>
			`;

			// Mock global fetch to return HTML
			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(mockHtml),
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/article",
			);

			// Restore first to avoid affecting other tests
			global.fetch = originalFetch;

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.title).toBeTruthy();
				expect(result.data.content).toBeTruthy();
				expect(result.data.textContent).toBeTruthy();
				expect(result.data.url).toBe("https://example.com/article");
			}
		});

		it("should handle pages with minimal content", async () => {
			// Note: Readability is quite good at extracting content, so this test
			// verifies that even minimal pages return something rather than erroring
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head><title>Minimal Page</title></head>
					<body>
						<p>Short text</p>
					</body>
				</html>
			`;

			// Mock global fetch to return HTML
			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(mockHtml),
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/minimal",
			);

			// Restore
			global.fetch = originalFetch;

			// Readability should extract something from this minimal page
			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data).toBeDefined();
			}
		});

		it("should extract og:image from HTML", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Article with Image</title>
						<meta property="og:image" content="https://example.com/article-image.jpg">
					</head>
					<body>
						<article>
							<h1>Test Headline</h1>
							<p>Article content with an open graph image.</p>
						</article>
					</body>
				</html>
			`;

			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(mockHtml),
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/article",
			);

			global.fetch = originalFetch;

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.ogImage).toBe(
					"https://example.com/article-image.jpg",
				);
			}
		});

		it("should resolve relative og:image URLs to absolute", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head>
						<title>Article with Relative Image</title>
						<meta property="og:image" content="/images/thumb.png">
					</head>
					<body>
						<article>
							<h1>Test</h1>
							<p>Article with a relative og:image URL.</p>
						</article>
					</body>
				</html>
			`;

			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(mockHtml),
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/news/article",
			);

			global.fetch = originalFetch;

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.ogImage).toBe(
					"https://example.com/images/thumb.png",
				);
			}
		});

		it("should return null ogImage when not present in HTML", async () => {
			const mockHtml = `
				<!DOCTYPE html>
				<html>
					<head><title>No OG Image</title></head>
					<body>
						<article>
							<h1>Test</h1>
							<p>Article without an open graph image.</p>
						</article>
					</body>
				</html>
			`;

			const originalFetch = global.fetch;
			global.fetch = vi.fn(() =>
				Promise.resolve({
					ok: true,
					status: 200,
					text: () => Promise.resolve(mockHtml),
				}),
			) as any;

			const result = await extractContentFromUrl(
				"https://example.com/article",
			);

			global.fetch = originalFetch;

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.ogImage).toBeNull();
			}
		});
	});

	describe("extractContentFromText", () => {
		it("should extract content from plain text", () => {
			const text =
				"This is the article content. It's a simple news article.";

			const result = extractContentFromText(text);

			expect(result.title).toBe("Untitled Article");
			expect(result.textContent).toBe(text);
			expect(result.content).toContain(text);
			expect(result.byline).toBeNull();
			expect(result.siteName).toBeNull();
			expect(result.url).toBe("");
			expect(result.ogImage).toBeNull();
		});

		it("should accept custom title", () => {
			const text = "Article content";
			const title = "Custom Title";

			const result = extractContentFromText(text, title);

			expect(result.title).toBe(title);
			expect(result.textContent).toBe(text);
		});

		it("should handle empty text input", () => {
			const result = extractContentFromText("");

			expect(result.textContent).toBe("");
			expect(result.title).toBe("Untitled Article");
		});

		it("should handle whitespace-only text", () => {
			const result = extractContentFromText("   \n\t   ");

			expect(result.textContent).toBe("   \n\t   ");
		});

		it("should preserve line breaks in text content", () => {
			const text = "Line 1\nLine 2\nLine 3";

			const result = extractContentFromText(text);

			expect(result.textContent).toBe(text);
			expect(result.textContent).toContain("Line 1");
			expect(result.textContent).toContain("Line 2");
			expect(result.textContent).toContain("Line 3");
		});
	});
});
