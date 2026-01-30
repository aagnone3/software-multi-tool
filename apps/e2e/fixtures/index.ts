import type { Page } from "@playwright/test";
import { test as base } from "@playwright/test";

/**
 * Test credentials for preview/local environments.
 * These are seeded via supabase/seed.sql in preview branches and local dev.
 */
export const TEST_USER = {
	email: "test@preview.local",
	password: "TestPassword123",
} as const;

/**
 * Extended test fixtures providing reusable utilities for E2E tests.
 */
interface TestFixtures {
	/**
	 * An authenticated page - logs in before each test
	 */
	authenticatedPage: Page;

	/**
	 * Navigate and wait for network idle
	 */
	gotoAndWait: (url: string) => Promise<void>;

	/**
	 * Login helper function
	 */
	login: () => Promise<void>;
}

/**
 * Login to the application using the test user credentials.
 * Supports both Quick Login (preview/dev) and manual login (production).
 */
async function performLogin(page: Page): Promise<void> {
	await page.goto("/auth/login");
	await page.waitForLoadState("networkidle");

	// Try Quick Login first (only available in preview/dev environments)
	const quickLoginButton = page.getByRole("button", {
		name: /quick login|test user/i,
	});

	const quickLoginVisible = await quickLoginButton
		.isVisible({ timeout: 2000 })
		.catch(() => false);

	if (quickLoginVisible) {
		await quickLoginButton.click();
		await page.waitForURL(/\/app/, { timeout: 30000 });
		return;
	}

	// Fall back to manual login with test credentials
	await page.getByLabel(/email/i).fill(TEST_USER.email);
	await page.getByLabel(/password/i).fill(TEST_USER.password);
	await page.getByRole("button", { name: /sign in|log in/i }).click();
	await page.waitForURL(/\/app/, { timeout: 30000 });
}

export const test = base.extend<TestFixtures>({
	/**
	 * An authenticated page that logs in before each test.
	 * Use this for tests that require a logged-in user.
	 */
	authenticatedPage: async ({ page }, use) => {
		await performLogin(page);
		await use(page);
	},

	/**
	 * Navigate to a URL and wait for network to be idle.
	 * Useful for pages with async data loading.
	 */
	gotoAndWait: async ({ page }, use) => {
		await use(async (url: string) => {
			await page.goto(url, { waitUntil: "networkidle" });
		});
	},

	/**
	 * Login helper that can be called manually when needed.
	 * Use this when you need more control over when login happens.
	 */
	login: async ({ page }, use) => {
		await use(async () => {
			await performLogin(page);
		});
	},
});

export { expect } from "@playwright/test";
