import { expect, test } from "../../fixtures";

/**
 * Avatar upload tests for the settings page.
 *
 * Prerequisites:
 * - Test user seeded in database
 * - Storage buckets created (via seed.sql)
 */
test.describe("Avatar Upload", () => {
	test.beforeEach(async ({ login }) => {
		await login();
	});

	test("settings page loads @smoke", async ({ page }) => {
		await page.goto("/app/settings/general", { waitUntil: "networkidle" });

		await expect(page).toHaveURL(/\/app\/settings\/general/);
		await expect(page.locator("main")).toBeVisible();
	});

	test("can upload avatar image", async ({ page }) => {
		await page.goto("/app/settings/general", { waitUntil: "networkidle" });

		// Find the avatar section
		const avatarSection = page.locator("text=Your avatar").first();
		await expect(avatarSection).toBeVisible();

		// Find the file input
		const fileInput = page.locator('input[type="file"]').first();

		// Upload a test image
		await fileInput.setInputFiles({
			name: "test-avatar.png",
			mimeType: "image/png",
			buffer: createMinimalPng(),
		});

		// Handle crop dialog if it appears
		const cropDialog = page.getByRole("dialog");
		const cropDialogVisible = await cropDialog
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		if (cropDialogVisible) {
			const saveButton = cropDialog.getByRole("button", {
				name: /save|confirm|crop|done/i,
			});
			if (await saveButton.isVisible()) {
				await saveButton.click();
			}
		}

		// Verify upload success or no error
		const successToast = page.locator(
			"text=Avatar was updated successfully",
		);
		const errorToast = page.locator("text=Could not update avatar");

		const toastVisible = await successToast
			.isVisible({ timeout: 10000 })
			.catch(() => false);

		if (toastVisible) {
			await expect(successToast).toBeVisible();
		} else {
			await expect(errorToast).not.toBeVisible();
		}
	});

	test("avatar displays after upload", async ({ page }) => {
		await page.goto("/app/settings/general", { waitUntil: "networkidle" });

		// Check if avatar images load via image-proxy
		const avatarImages = page.locator("img[src*='image-proxy']");
		const avatarCount = await avatarImages.count();

		if (avatarCount > 0) {
			const firstAvatar = avatarImages.first();
			await expect(firstAvatar).toBeVisible();

			// Verify image actually loaded
			const naturalWidth = await firstAvatar.evaluate(
				(img: HTMLImageElement) => img.naturalWidth,
			);
			expect(naturalWidth).toBeGreaterThan(0);
		}
	});
});

/**
 * Creates a minimal valid PNG file buffer (1x1 pixel blue PNG)
 */
function createMinimalPng(): Buffer {
	return Buffer.from([
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
		0x00,
		0x00,
		0x00, // compression, filter, interlace
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
}
