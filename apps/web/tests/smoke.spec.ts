import { config } from "@repo/config";
import { expect, test } from "./fixtures";

/**
 * @smoke - Critical path tests that should run on every deployment
 * These tests verify that core marketing pages are accessible and functional
 */
test.describe("smoke tests - marketing pages", () => {
	test.skip(!config.ui.marketing.enabled, "Marketing pages are disabled");

	test("home page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/");

		await expect(
			page.getByRole("heading", {
				name: "Simple, helpful software tools for modern business",
			}),
		).toBeVisible();

		// Verify key marketing elements are present
		await expect(page.locator("main")).toBeVisible();
	});

	test("blog page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/blog");

		// Verify blog page renders
		await expect(page.locator("main")).toBeVisible();
	});

	test("contact page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/contact");

		// Verify contact page renders
		await expect(page.locator("main")).toBeVisible();
	});

	test("docs page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/docs");

		// Verify docs page renders - use first() to handle multiple main elements
		await expect(page.locator("main").first()).toBeVisible();
	});
});
