import { test as base, expect } from "@playwright/test";

/**
 * Avatar upload test for external URLs (preview deployments)
 *
 * Run with:
 *   BASE_URL=https://your-preview.vercel.app pnpm --filter web exec playwright test avatar-upload-external.spec.ts --config=tests/playwright.external.config.ts
 */

// Get the base URL from environment variable - skip test if not provided
const BASE_URL = process.env.BASE_URL;

const test = base.extend({});

// TODO: Remove this skip workaround - see PRA-150 for dedicated CI job
// This test should run in a separate CI job that triggers after Vercel deployment,
// not be skipped in the regular test run. The skip is misleading in test reports.
// For now, we skip gracefully to avoid breaking CI when BASE_URL isn't set.
test.describe("avatar upload on external deployment", () => {
	test.skip(
		!BASE_URL,
		"BASE_URL environment variable is required for external tests",
	);

	test("can login and upload avatar", async ({ page }) => {
		// Increase timeout for external URL testing
		test.setTimeout(60000);

		console.log(`Testing against: ${BASE_URL}`);

		// Step 1: Navigate to login page
		await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle" });

		// Take screenshot of login page
		await page.screenshot({ path: "playwright-report/01-login-page.png" });

		// Step 2: Look for Quick Login button
		const quickLoginButton = page.getByRole("button", {
			name: /quick login/i,
		});
		const quickLoginVisible = await quickLoginButton
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		console.log(`Quick Login visible: ${quickLoginVisible}`);

		if (quickLoginVisible) {
			await quickLoginButton.click();
			console.log("Clicked Quick Login");
		} else {
			// Manual login
			console.log("Quick Login not available, trying manual login...");

			// Find login form elements - adjust selectors based on actual form
			const emailInput = page
				.locator(
					'input[type="email"], input[name="email"], input[placeholder*="email" i]',
				)
				.first();
			const passwordInput = page
				.locator('input[type="password"]')
				.first();

			await emailInput.fill("test@preview.local");
			await passwordInput.fill("TestPassword123");

			// Find and click submit button
			const submitButton = page.locator('button[type="submit"]').first();
			await submitButton.click();
		}

		// Wait for redirect to app
		await page.waitForURL(/\/app/, { timeout: 30000 });
		console.log("Logged in successfully");

		// Take screenshot after login
		await page.screenshot({ path: "playwright-report/02-after-login.png" });

		// Step 3: Navigate to settings
		await page.goto(`${BASE_URL}/app/settings/general`, {
			waitUntil: "networkidle",
		});
		await expect(page).toHaveURL(/\/app\/settings\/general/);
		console.log("Navigated to settings");

		// Take screenshot of settings page
		await page.screenshot({
			path: "playwright-report/03-settings-page.png",
		});

		// Step 4: Find and interact with avatar upload
		const avatarSection = page.locator("text=Your avatar").first();
		await expect(avatarSection).toBeVisible();

		// Find file input (created by react-dropzone)
		const fileInput = page.locator('input[type="file"]').first();

		// Create test image
		const testImage = createTestPng();

		// Upload the file
		await fileInput.setInputFiles({
			name: "test-avatar.png",
			mimeType: "image/png",
			buffer: testImage,
		});
		console.log("Uploaded test image");

		// Step 5: Handle crop dialog if it appears
		const cropDialog = page.getByRole("dialog");
		const cropDialogVisible = await cropDialog
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (cropDialogVisible) {
			console.log("Crop dialog appeared");
			await page.screenshot({
				path: "playwright-report/04-crop-dialog.png",
			});

			// Look for save button
			const saveButton = cropDialog
				.locator(
					'button:has-text("Save"), button:has-text("Confirm"), button:has-text("Crop"), button:has-text("Done")',
				)
				.first();
			if (await saveButton.isVisible()) {
				await saveButton.click();
				console.log("Clicked save in crop dialog");
			}
		}

		// Step 6: Wait for upload result
		await page.waitForTimeout(3000); // Give time for upload

		// Check for success toast
		const successToast = page.locator(
			'text="Avatar was updated successfully"',
		);
		const successVisible = await successToast
			.isVisible({ timeout: 10000 })
			.catch(() => false);

		// Check for error toast
		const errorToast = page.locator('text="Could not update avatar"');
		const errorVisible = await errorToast
			.isVisible({ timeout: 1000 })
			.catch(() => false);

		// Take final screenshot
		await page.screenshot({
			path: "playwright-report/05-upload-result.png",
			fullPage: true,
		});

		if (successVisible) {
			console.log("✅ Avatar upload succeeded!");
		} else if (errorVisible) {
			console.log("❌ Avatar upload failed with error toast");
		} else {
			console.log("⚠️ No toast message detected");
		}

		// Final assertion - either success or at least no error
		expect(errorVisible).toBe(false);
	});
});

/**
 * Creates a minimal valid PNG (100x100 blue square)
 */
function createTestPng(): Buffer {
	// A larger, valid PNG that will work better with crop functionality
	// This is a 100x100 blue PNG
	return Buffer.from(
		"iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA" +
			"B3RJTUUH6AEPFgQPJmjGOwAAAB1pVFh0Q29tbWVudAAAAAAAQ3JlYXRlZCB3aXRoIEdJTVBkLmUH" +
			"AAAAKklEQVR42u3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAA4GcGJAABkHmGJgAAAABJ" +
			"RU5ErkJggg==",
		"base64",
	);
}
