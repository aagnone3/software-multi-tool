import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for testing against external URLs (preview deployments)
 * This config does NOT start a local web server.
 *
 * Usage:
 *   BASE_URL=https://your-preview.vercel.app pnpm --filter web exec playwright test avatar-upload-external.spec.ts --config=tests/playwright.external.config.ts
 *
 * For Vercel deployments with protection enabled:
 *   VERCEL_AUTOMATION_BYPASS_SECRET=your-secret BASE_URL=https://... pnpm --filter web exec playwright test ...
 *
 * To get the bypass secret, go to Vercel > Project Settings > Deployment Protection > Protection Bypass for Automation
 */

// Build extra HTTP headers for Vercel deployment protection bypass
const extraHTTPHeaders: Record<string, string> = {};
if (process.env.VERCEL_AUTOMATION_BYPASS_SECRET) {
	extraHTTPHeaders["x-vercel-protection-bypass"] =
		process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
}

export default defineConfig({
	testDir: ".",
	fullyParallel: false,
	forbidOnly: !!process.env.CI,
	retries: 0,
	workers: 1,
	reporter: [["list"], ["html", { open: "never" }]],
	timeout: 60000,
	use: {
		// No baseURL - tests use BASE_URL env var directly
		trace: "retain-on-failure",
		screenshot: "on",
		video: "retain-on-failure",
		// Add bypass header for Vercel deployment protection
		extraHTTPHeaders,
	},
	projects: [
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],
	// NO webServer - we're testing against an external URL
});
