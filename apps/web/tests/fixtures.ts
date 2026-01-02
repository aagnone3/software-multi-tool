import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

/**
 * Extended test fixtures for Playwright tests
 * Provides reusable utilities and authenticated contexts
 */
interface TestFixtures {
	/**
	 * A page instance with common utilities and helpers
	 */
	extendedPage: Page;

	/**
	 * Navigate and wait for network idle
	 */
	gotoAndWait: (url: string) => Promise<void>;
}

export const test = base.extend<TestFixtures>({
	/**
	 * Extended page with additional utilities
	 */
	extendedPage: async ({ page }, use) => {
		await use(page);
	},

	/**
	 * Navigate to a URL and wait for network to be idle
	 */
	gotoAndWait: async ({ page }, use) => {
		await use(async (url: string) => {
			await page.goto(url, { waitUntil: "networkidle" });
		});
	},
});

export { expect } from "@playwright/test";
