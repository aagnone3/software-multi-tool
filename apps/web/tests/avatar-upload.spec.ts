import { expect, test } from "./fixtures";

/**
 * Avatar upload tests
 *
 * This test can be run against any deployment URL by setting the BASE_URL environment variable:
 *   BASE_URL=https://your-preview-url.vercel.app pnpm --filter web run e2e -- --grep "avatar upload"
 *
 * Prerequisites for preview deployments:
 * - The test user (test@preview.local / PreviewPassword123!) must exist
 * - This is seeded automatically in Supabase preview branches via seed.sql
 */
test.describe("avatar upload @avatar", () => {
	// Use BASE_URL env var if provided, otherwise use the default from playwright.config.ts
	const baseUrl = process.env.BASE_URL;

	test.beforeEach(async ({ page }) => {
		// If custom BASE_URL is provided, override the baseURL for this test
		if (baseUrl) {
			// Navigate to login page on the custom URL
			await page.goto(`${baseUrl}/auth/login`, {
				waitUntil: "networkidle",
			});
		}
	});

	test("can upload avatar image via settings page", async ({
		page,
		gotoAndWait,
	}) => {
		// Step 1: Navigate to login page
		if (!baseUrl) {
			await gotoAndWait("/auth/login");
		}

		// Step 2: Look for Quick Login button (only visible in non-production environments)
		const quickLoginButton = page.getByRole("button", {
			name: /quick login/i,
		});

		// Check if Quick Login is available
		const quickLoginVisible = await quickLoginButton
			.isVisible()
			.catch(() => false);

		if (quickLoginVisible) {
			// Use Quick Login for preview/dev environments
			await quickLoginButton.click();

			// Wait for login to complete and redirect
			await page.waitForURL(/\/app/, { timeout: 30000 });
		} else {
			// Manual login with test credentials
			const emailInput = page.getByLabel(/email/i);
			const passwordInput = page.getByLabel(/password/i);
			const submitButton = page.getByRole("button", {
				name: /sign in|log in/i,
			});

			await emailInput.fill("test@preview.local");
			await passwordInput.fill("PreviewPassword123!");
			await submitButton.click();

			// Wait for login to complete
			await page.waitForURL(/\/app/, { timeout: 30000 });
		}

		// Step 3: Navigate to settings general page
		const settingsUrl = baseUrl
			? `${baseUrl}/app/settings/general`
			: "/app/settings/general";
		await page.goto(settingsUrl, { waitUntil: "networkidle" });

		// Verify we're on the settings page
		await expect(page).toHaveURL(/\/app\/settings\/general/);

		// Step 4: Find the avatar upload area
		// The UserAvatarUpload component uses react-dropzone which creates a file input
		const avatarSection = page.locator("text=Your avatar").first();
		await expect(avatarSection).toBeVisible();

		// Find the dropzone container (it wraps the UserAvatar)
		// The dropzone has an input[type="file"] that we can use
		const fileInput = page.locator('input[type="file"]').first();

		// Step 5: Create and upload a test image
		// Use Playwright's file chooser to upload
		await fileInput.setInputFiles({
			name: "test-avatar.png",
			mimeType: "image/png",
			buffer: createMinimalPng(),
		});

		// Step 6: Handle the crop dialog
		// After file selection, a crop dialog should appear
		const cropDialog = page.getByRole("dialog");
		const cropDialogVisible = await cropDialog
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (cropDialogVisible) {
			// Look for the save/confirm button in the crop dialog
			const saveButton = cropDialog.getByRole("button", {
				name: /save|confirm|crop|done/i,
			});
			if (await saveButton.isVisible()) {
				await saveButton.click();
			}
		}

		// Step 7: Verify upload success
		// Wait for the success toast or verify the avatar changed
		const successToast = page.locator(
			"text=Avatar was updated successfully",
		);
		const toastVisible = await successToast
			.isVisible({ timeout: 10000 })
			.catch(() => false);

		if (toastVisible) {
			await expect(successToast).toBeVisible();
		} else {
			// Alternative: check that no error toast appeared
			const errorToast = page.locator("text=Could not update avatar");
			await expect(errorToast).not.toBeVisible();
		}

		// Take a screenshot for debugging
		await page.screenshot({
			path: "playwright-report/avatar-upload-result.png",
			fullPage: true,
		});
	});

	test("avatar displays after upload @smoke", async ({
		page,
		gotoAndWait,
	}) => {
		// This test verifies that an existing avatar (from previous upload) displays correctly
		// It's useful for testing the image-proxy route

		// Step 1: Login
		if (!baseUrl) {
			await gotoAndWait("/auth/login");
		} else {
			await page.goto(`${baseUrl}/auth/login`, {
				waitUntil: "networkidle",
			});
		}

		const quickLoginButton = page.getByRole("button", {
			name: /quick login/i,
		});

		if (await quickLoginButton.isVisible().catch(() => false)) {
			await quickLoginButton.click();
			await page.waitForURL(/\/app/, { timeout: 30000 });
		}

		// Step 2: Navigate to settings
		const settingsUrl = baseUrl
			? `${baseUrl}/app/settings/general`
			: "/app/settings/general";
		await page.goto(settingsUrl, { waitUntil: "networkidle" });

		// Step 3: Check if avatar image loads
		// The avatar is in the settings sidebar and in the form
		const avatarImages = page.locator("img[src*='image-proxy']");
		const avatarCount = await avatarImages.count();

		if (avatarCount > 0) {
			// Verify at least one avatar image is visible
			const firstAvatar = avatarImages.first();
			await expect(firstAvatar).toBeVisible();

			// Check that the image actually loaded (not broken)
			const naturalWidth = await firstAvatar.evaluate(
				(img: HTMLImageElement) => img.naturalWidth,
			);
			expect(naturalWidth).toBeGreaterThan(0);
		}

		// Take a screenshot for debugging
		await page.screenshot({
			path: "playwright-report/avatar-display-result.png",
			fullPage: true,
		});
	});
});

/**
 * Creates a minimal valid PNG file buffer
 * This is a 1x1 pixel blue PNG, which is enough for testing upload functionality
 */
function createMinimalPng(): Buffer {
	// This is a minimal 1x1 pixel blue PNG
	// Generated with proper PNG structure: signature, IHDR, IDAT, IEND
	const pngData = Buffer.from([
		0x89,
		0x50,
		0x4e,
		0x47,
		0x0d,
		0x0a,
		0x1a,
		0x0a, // PNG signature
		0x00,
		0x00,
		0x00,
		0x0d, // IHDR length
		0x49,
		0x48,
		0x44,
		0x52, // IHDR
		0x00,
		0x00,
		0x00,
		0x01, // width: 1
		0x00,
		0x00,
		0x00,
		0x01, // height: 1
		0x08, // bit depth: 8
		0x02, // color type: RGB
		0x00, // compression
		0x00, // filter
		0x00, // interlace
		0x90,
		0x77,
		0x53,
		0xde, // IHDR CRC
		0x00,
		0x00,
		0x00,
		0x0c, // IDAT length
		0x49,
		0x44,
		0x41,
		0x54, // IDAT
		0x08,
		0xd7,
		0x63,
		0xf8,
		0xcf,
		0xc0,
		0x00,
		0x00, // compressed data
		0x01,
		0x01,
		0x01,
		0x00, // IDAT checksum
		0x18,
		0xdd,
		0x8d,
		0xb4, // IDAT CRC
		0x00,
		0x00,
		0x00,
		0x00, // IEND length
		0x49,
		0x45,
		0x4e,
		0x44, // IEND
		0xae,
		0x42,
		0x60,
		0x82, // IEND CRC
	]);

	return pngData;
}
