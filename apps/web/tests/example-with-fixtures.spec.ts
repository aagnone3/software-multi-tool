import { config } from "@repo/config";
import { expect, test } from "./fixtures";

/**
 * Example test demonstrating shared fixtures usage
 * This file shows how to use the custom fixtures defined in fixtures.ts
 */
test.describe("example with shared fixtures", () => {
	test("should use gotoAndWait fixture", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/");

		if (config.ui.marketing.enabled) {
			await expect(
				page.getByRole("heading", {
					name: "Simple, helpful software tools for modern business",
				}),
			).toBeVisible();
		}
	});

	test("should use extendedPage fixture", async ({ extendedPage }) => {
		await extendedPage.goto("/");

		if (config.ui.marketing.enabled) {
			await expect(
				extendedPage.getByRole("heading", {
					name: "Simple, helpful software tools for modern business",
				}),
			).toBeVisible();
		} else {
			await expect(extendedPage).toHaveURL(/\.*\/auth\/login/);
		}
	});
});
