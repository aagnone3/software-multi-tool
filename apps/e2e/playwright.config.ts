import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables from the web app's .env.local
dotenv.config({ path: path.resolve(__dirname, "../web/.env.local") });

const baseURL = process.env.BASE_URL ?? "http://localhost:3500";

/**
 * Playwright configuration for E2E tests.
 *
 * This config supports running tests against:
 * - Local dev server (default): http://localhost:3500
 * - Preview deployments: BASE_URL=https://your-preview.vercel.app pnpm test
 * - Production: BASE_URL=https://your-domain.com pnpm test
 */
export default defineConfig({
	testDir: "./specs",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	timeout: 60000,
	expect: {
		timeout: 10000,
	},

	reporter: process.env.CI
		? [
				["html", { outputFolder: "playwright-report" }],
				["json", { outputFile: "playwright-report/results.json" }],
				["junit", { outputFile: "playwright-report/results.xml" }],
				["list"],
			]
		: [["html", { outputFolder: "playwright-report" }], ["list"]],

	use: {
		baseURL,
		trace: process.env.CI ? "on-first-retry" : "retain-on-failure",
		screenshot: process.env.CI ? "only-on-failure" : "off",
		video: process.env.CI
			? {
					mode: "retain-on-failure",
					size: { width: 1280, height: 720 },
				}
			: "off",
	},

	projects: [
		// Default project - runs all tests
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
			},
		},

		// Tagged test projects for targeted execution
		{
			name: "smoke",
			use: {
				...devices["Desktop Chrome"],
			},
			grep: /@smoke/,
		},
		{
			name: "auth",
			use: {
				...devices["Desktop Chrome"],
			},
			testDir: "./specs/auth",
		},
		{
			name: "tools",
			use: {
				...devices["Desktop Chrome"],
			},
			testDir: "./specs/tools",
		},
		{
			name: "settings",
			use: {
				...devices["Desktop Chrome"],
			},
			testDir: "./specs/settings",
		},
	],

	// Start local dev server when not using BASE_URL
	...(process.env.BASE_URL
		? {}
		: {
				webServer: {
					command:
						"pnpm --filter web run build && pnpm --filter web run start",
					url: "http://localhost:3500",
					reuseExistingServer: !process.env.CI,
					stdout: "pipe",
					timeout: 180 * 1000,
					cwd: path.resolve(__dirname, "../.."),
					env: {
						PORT: "3500",
						// Enable preview mode so Quick Login button appears
						NEXT_PUBLIC_VERCEL_ENV: "preview",
					},
				},
			}),
});
