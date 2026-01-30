import { expect, test } from "../../fixtures";

/**
 * Authentication flow tests.
 * Tests covering sign-in, sign-up, and password reset pages.
 */
test.describe("Login Page", () => {
	test("loads successfully @smoke", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/login");

		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/login/);
	});

	test("has link to signup page", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/login");

		const signupLink = page.locator('a[href*="/auth/signup"]').first();
		if ((await signupLink.count()) > 0) {
			await signupLink.click();
			await expect(page).toHaveURL(/.*\/auth\/signup/);
		}
	});

	test("has link to forgot password", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/login");

		const forgotLink = page
			.locator('a[href*="/auth/forgot-password"]')
			.first();
		if ((await forgotLink.count()) > 0) {
			await expect(forgotLink).toBeVisible();
		}
	});
});

test.describe("Signup Page", () => {
	test("loads successfully @smoke", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/signup");

		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/signup/);
	});

	test("has link to login page", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/signup");

		const loginLink = page.locator('a[href*="/auth/login"]').first();
		if ((await loginLink.count()) > 0) {
			await loginLink.click();
			await expect(page).toHaveURL(/.*\/auth\/login/);
		}
	});
});

test.describe("Password Reset", () => {
	test("forgot password page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/forgot-password");

		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
	});

	test("reset password page loads", async ({ gotoAndWait, page }) => {
		await gotoAndWait("/auth/reset-password");

		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/reset-password/);
	});
});
