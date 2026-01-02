import { afterEach, beforeEach, vi } from "vitest";

process.env.TZ = process.env.TZ ?? "UTC";
process.env.NODE_ENV = process.env.NODE_ENV ?? "test";

beforeEach(() => {
	vi.restoreAllMocks();
});

afterEach(() => {
	vi.clearAllMocks();
});
