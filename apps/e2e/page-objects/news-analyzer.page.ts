import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for the News Analyzer tool.
 * Encapsulates selectors and common interactions.
 */
export class NewsAnalyzerPage {
	readonly page: Page;
	readonly urlInput: Locator;
	readonly analyzeButton: Locator;
	readonly loadingIndicator: Locator;
	readonly errorAlert: Locator;

	constructor(page: Page) {
		this.page = page;
		this.urlInput = page.getByPlaceholder("https://example.com/article");
		this.analyzeButton = page.getByRole("button", {
			name: /analyze article/i,
		});
		this.loadingIndicator = page.getByRole("button", {
			name: /analyzing/i,
		});
		this.errorAlert = page.getByText(/failed to start analysis/i);
	}

	/**
	 * Navigate to the news analyzer page
	 */
	async goto() {
		await this.page.goto("/app/tools/news-analyzer");
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Submit a URL for analysis
	 */
	async analyzeUrl(url: string) {
		await this.urlInput.fill(url);
		await this.analyzeButton.click();
	}

	/**
	 * Wait for analysis to start (loading state appears)
	 */
	async waitForLoading(timeout = 10000) {
		await this.loadingIndicator.waitFor({ state: "visible", timeout });
	}

	/**
	 * Wait for error to appear
	 */
	async waitForError(timeout = 15000) {
		await this.errorAlert.waitFor({ state: "visible", timeout });
	}
}
