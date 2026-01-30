import { expect, test } from "../../fixtures";

/**
 * Smoke tests for marketing/public pages.
 * These tests verify critical pages load without authentication.
 */
test.describe("Marketing Pages @smoke", () => {
	test("home page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/");

		await expect(page.locator("main")).toBeVisible();
	});

	test("pricing page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/pricing");

		await expect(page.locator("main")).toBeVisible();
	});

	test("login page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/login");

		await expect(page.locator("main")).toBeVisible();
	});

	test("signup page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/signup");

		await expect(page.locator("main")).toBeVisible();
	});
});
