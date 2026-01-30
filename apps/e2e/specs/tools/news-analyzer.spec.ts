import { expect, test } from "../../fixtures";
import { NewsAnalyzerPage } from "../../page-objects";

/**
 * News Analyzer E2E tests.
 *
 * Prerequisites:
 * - Dev server running at localhost:3500
 * - Inngest dev server running (for job processing)
 * - Test user seeded in database
 */
test.describe("News Analyzer", () => {
	test.beforeEach(async ({ login }) => {
		await login();
	});

	test("page loads successfully @smoke", async ({ page }) => {
		await page.goto("/app/tools/news-analyzer");
		await page.waitForLoadState("networkidle");

		const urlInput = page.getByPlaceholder("https://example.com/article");
		await expect(urlInput).toBeVisible({ timeout: 10000 });
	});

	test("can submit article URL and see loading state", async ({ page }) => {
		const newsAnalyzer = new NewsAnalyzerPage(page);
		await newsAnalyzer.goto();

		await expect(newsAnalyzer.urlInput).toBeVisible({ timeout: 10000 });
		await newsAnalyzer.analyzeUrl("https://www.bbc.com/news/technology");

		await newsAnalyzer.waitForLoading();
	});

	test("shows error when analysis fails to start", async ({ page }) => {
		// Mock the trigger endpoint to fail
		await page.route("**/api/jobs/trigger", (route) => {
			route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ error: "Test error" }),
			});
		});

		const newsAnalyzer = new NewsAnalyzerPage(page);
		await newsAnalyzer.goto();

		await expect(newsAnalyzer.urlInput).toBeVisible({ timeout: 10000 });
		await newsAnalyzer.analyzeUrl("https://example.com/article");

		await newsAnalyzer.waitForError();
	});

	test("form validates URL input", async ({ page }) => {
		const newsAnalyzer = new NewsAnalyzerPage(page);
		await newsAnalyzer.goto();

		await expect(newsAnalyzer.urlInput).toBeVisible({ timeout: 10000 });

		// Enter invalid URL - HTML5 validation should prevent submission
		await newsAnalyzer.urlInput.fill("not-a-valid-url");
		await newsAnalyzer.analyzeButton.click();

		// Form should not submit - button and input should still be visible
		await expect(newsAnalyzer.analyzeButton).toBeVisible();
		await expect(newsAnalyzer.urlInput).toBeVisible();
	});
});
