import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";
import { afterEach, beforeEach, vi } from "vitest";

// Load environment variables from apps/web/.env.local for integration tests
// This ensures ANTHROPIC_API_KEY and other credentials are available in all tests
const workspaceRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
	"..",
);
const envLocalPath = path.join(workspaceRoot, "apps", "web", ".env.local");

if (existsSync(envLocalPath)) {
	config({ path: envLocalPath });
}

process.env.TZ = process.env.TZ ?? "UTC";
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.clearAllMocks();
});
