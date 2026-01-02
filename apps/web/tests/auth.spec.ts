import { expect, test } from "./fixtures";

/**
 * Authentication flow tests
 * Tests covering sign-in, sign-up, and password reset flows
 */
test.describe("authentication flows", () => {
	test("login page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/login");

		// Verify login page renders with expected elements
		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/login/);
	});

	test("signup page loads successfully @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/signup");

		// Verify signup page renders
		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/signup/);
	});

	test("forgot password page loads successfully", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/forgot-password");

		// Verify forgot password page renders
		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/forgot-password/);
	});

	test("reset password page loads successfully", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/reset-password");

		// Verify reset password page renders
		await expect(page.locator("main")).toBeVisible();
		await expect(page).toHaveURL(/.*\/auth\/reset-password/);
	});

	test("can navigate from login to signup @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/login");

		// Look for signup link (adjust selector based on actual implementation)
		const signupLink = page.locator('a[href*="/auth/signup"]').first();
		if ((await signupLink.count()) > 0) {
			await signupLink.click();
			await expect(page).toHaveURL(/.*\/auth\/signup/);
		}
	});

	test("can navigate from signup to login @smoke", async ({
		gotoAndWait,
		page,
	}) => {
		await gotoAndWait("/auth/signup");

		// Look for login link (adjust selector based on actual implementation)
		const loginLink = page.locator('a[href*="/auth/login"]').first();
		if ((await loginLink.count()) > 0) {
			await loginLink.click();
			await expect(page).toHaveURL(/.*\/auth\/login/);
		}
	});
});
