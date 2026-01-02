import { config } from "@repo/config";
import { expect, test } from "./fixtures";

test.describe("home page", () => {
	if (config.ui.marketing.enabled) {
		test("should load", async ({ gotoAndWait, page }) => {
			await gotoAndWait("/");

			await expect(
				page.getByRole("heading", {
					name: "Simple, helpful software tools for modern business",
				}),
			).toBeVisible();
		});
	} else {
		test("should be redirected to app", async ({ page }) => {
			await page.goto("/");

			await expect(page).toHaveURL(/\.*\/auth\/login/);
		});
	}
});
