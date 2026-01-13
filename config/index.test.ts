import { afterAll, describe, expect, it, vi } from "vitest";

describe("config", () => {
	const originalEnv = { ...process.env };

	afterAll(() => {
		process.env = originalEnv;
	});

	it("exposes defaults and honors environment overrides", async () => {
		vi.resetModules();
		process.env = { ...originalEnv };

		const defaults = await import("./index");
		expect(defaults.config.appName).toBe("Software Multitool");
		expect(defaults.config.storage.bucketNames.avatars).toBe("avatars");

		vi.resetModules();
		process.env = {
			...originalEnv,
			NEXT_PUBLIC_AVATARS_BUCKET_NAME: "custom-bucket",
		};

		const overridden = await import("./index");
		expect(overridden.config.storage.bucketNames.avatars).toBe(
			"custom-bucket",
		);
	});
});
