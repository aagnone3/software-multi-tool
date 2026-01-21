import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("manifest", () => {
	it("returns valid manifest with app name", () => {
		const result = manifest();

		expect(result.name).toBe("Software Multitool");
		expect(result.short_name).toBe("SoftwareMultitool");
	});

	it("includes PWA display mode", () => {
		const result = manifest();

		expect(result.display).toBe("standalone");
		expect(result.start_url).toBe("/");
	});

	it("uses brand colors", () => {
		const result = manifest();

		// Primary blue for theme color
		expect(result.theme_color).toBe("#2563EB");
		// Light background
		expect(result.background_color).toBe("#FAFBFC");
	});

	it("includes icon definitions", () => {
		const result = manifest();

		expect(result.icons).toBeDefined();
		expect(result.icons?.length).toBeGreaterThan(0);

		// Should include apple icon
		const appleIcon = result.icons?.find((icon) =>
			icon.src.includes("apple-icon"),
		);
		expect(appleIcon).toBeDefined();
		expect(appleIcon?.sizes).toBe("180x180");
	});
});
