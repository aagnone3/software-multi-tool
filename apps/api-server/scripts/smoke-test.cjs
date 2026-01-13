#!/usr/bin/env node
/**
 * Smoke test for the api-server bundle.
 *
 * This script verifies that the bundled api-server can be loaded without
 * module resolution errors. It catches issues like:
 * - Missing modules that weren't properly bundled (e.g., jsdom's xhr-sync-worker.js)
 * - Invalid require() calls after bundling
 * - Missing native dependencies
 *
 * Usage: node scripts/smoke-test.cjs
 * Exit codes:
 *   0 - Bundle loads successfully
 *   1 - Bundle failed to load (module error or other issue)
 */

const path = require("node:path");
const fs = require("node:fs");

const bundlePath = path.join(__dirname, "..", "dist", "index.cjs");

// Check if bundle exists
if (!fs.existsSync(bundlePath)) {
	console.error("ERROR: Bundle not found at", bundlePath);
	console.error("Run 'pnpm build' first to create the bundle.");
	process.exit(1);
}

console.log("Smoke testing bundle:", bundlePath);

// Set a timeout to prevent hanging on startup issues
const timeout = setTimeout(() => {
	console.error("ERROR: Bundle load timed out after 30 seconds");
	process.exit(1);
}, 30000);

try {
	// Attempt to require the bundle - this will fail if there are module resolution issues
	// We don't actually start the server, just verify the bundle can be loaded
	require(bundlePath);

	// If we get here, the bundle loaded successfully
	clearTimeout(timeout);
	console.log("SUCCESS: Bundle loaded without module errors");

	// Exit cleanly - the bundle starts an async server, but we just want to verify loading
	process.exit(0);
} catch (error) {
	clearTimeout(timeout);

	if (error.code === "MODULE_NOT_FOUND") {
		console.error("ERROR: Module not found during bundle load");
		console.error(
			"This usually means a dependency wasn't properly bundled.",
		);
		console.error("");
		console.error("Details:");
		console.error("  Code:", error.code);
		console.error("  Message:", error.message);
		if (error.requireStack) {
			console.error("  Require stack:", error.requireStack);
		}
		console.error("");
		console.error("Common fixes:");
		console.error(
			"  1. Mark the problematic package as external in esbuild config",
		);
		console.error(
			"  2. Replace the package with a bundle-friendly alternative",
		);
		console.error(
			"  3. If the package uses worker files, consider alternatives",
		);
	} else {
		console.error("ERROR: Bundle failed to load");
		console.error("  Name:", error.name);
		console.error("  Message:", error.message);
	}

	process.exit(1);
}
