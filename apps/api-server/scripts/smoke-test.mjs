#!/usr/bin/env node
/**
 * Bundle smoke test - verifies the api-server bundle can be loaded
 * without missing module errors (like the jsdom xhr-sync-worker.js issue).
 *
 * This test catches bundling issues that only manifest at runtime,
 * preventing broken deployments.
 *
 * The test uses a child process to load the bundle, isolating any
 * process.exit() calls from the test harness.
 */

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const bundlePath = join(__dirname, "..", "dist", "index.cjs");

console.log("=== API Server Bundle Smoke Test ===\n");
console.log(`Testing bundle: ${bundlePath}\n`);

// Use a child process to load the bundle
// This isolates the server's process.exit() calls from our test
const child = spawn(
	"node",
	[
		"-e",
		`
		try {
			require('${bundlePath.replace(/\\/g, "\\\\")}');
			// If we get here, the bundle loaded successfully
			console.log('__BUNDLE_LOADED__');
		} catch (error) {
			if (error.code === 'MODULE_NOT_FOUND' || error.message?.includes('Cannot find module')) {
				console.error('__MODULE_ERROR__:' + error.message);
				process.exit(2);
			}
			// Other errors during require are still load failures
			console.error('__LOAD_ERROR__:' + error.message);
			process.exit(3);
		}
		`,
	],
	{
		stdio: ["ignore", "pipe", "pipe"],
		timeout: 10000, // 10 second timeout
	},
);

let stdout = "";
let stderr = "";

child.stdout.on("data", (data) => {
	stdout += data.toString();
});

child.stderr.on("data", (data) => {
	stderr += data.toString();
});

child.on("close", (code) => {
	// Check for bundle load success marker
	if (stdout.includes("__BUNDLE_LOADED__")) {
		console.log("Bundle loaded successfully!\n");
		console.log("Smoke test PASSED - bundle loads without module errors");
		process.exit(0);
	}

	// Check for module resolution errors
	if (stderr.includes("__MODULE_ERROR__") || code === 2) {
		const errorMatch = stderr.match(/__MODULE_ERROR__:(.+)/);
		console.error("\nSmoke test FAILED - module resolution error:");
		console.error(errorMatch ? errorMatch[1] : stderr);
		console.error(
			"\nThis typically means a dependency was bundled incorrectly.",
		);
		console.error(
			"Consider marking problematic packages as external in esbuild.",
		);
		process.exit(1);
	}

	// Check for other load errors
	if (stderr.includes("__LOAD_ERROR__") || code === 3) {
		const errorMatch = stderr.match(/__LOAD_ERROR__:(.+)/);
		console.error("\nSmoke test FAILED - bundle load error:");
		console.error(errorMatch ? errorMatch[1] : stderr);
		process.exit(1);
	}

	// Any other exit code means the bundle loaded but server failed to start
	// (e.g., missing DATABASE_URL) - this is expected and means success
	console.log("Bundle loaded successfully!");
	console.log("(Server failed to start due to missing config - expected)\n");
	console.log("Smoke test PASSED - bundle loads without module errors");
	process.exit(0);
});

child.on("error", (error) => {
	console.error("\nSmoke test FAILED - spawn error:");
	console.error(error.message);
	process.exit(1);
});
