import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "./.env.local") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI
		? [
				["html"],
				["json", { outputFile: "playwright-report/results.json" }],
				["junit", { outputFile: "playwright-report/results.xml" }],
				["list"],
			]
		: [["html"], ["list"]],
	use: {
		baseURL: "http://localhost:3500",
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
		{ name: "setup", testMatch: /.*\.setup\.ts/ },
		{
			name: "chromium",
			use: {
				...devices["Desktop Chrome"],
			},
		},
		// Tagged test projects for targeted test execution
		{
			name: "smoke",
			use: {
				...devices["Desktop Chrome"],
			},
			grep: /@smoke/,
		},
		{
			name: "billing",
			use: {
				...devices["Desktop Chrome"],
			},
			grep: /@billing/,
		},
		{
			name: "onboarding",
			use: {
				...devices["Desktop Chrome"],
			},
			grep: /@onboarding/,
		},
	],
	webServer: {
		command: "pnpm --filter web run build && pnpm --filter web run start",
		url: "http://localhost:3500",
		reuseExistingServer: !process.env.CI,
		stdout: "pipe",
		timeout: 180 * 1000,
		env: {
			PORT: "3500",
		},
	},
});
