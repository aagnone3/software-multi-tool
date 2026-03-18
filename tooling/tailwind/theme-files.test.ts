import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = __dirname;

function read(relativePath: string) {
	return readFileSync(path.join(root, relativePath), "utf8");
}

describe("@repo/tailwind-config css assets", () => {
	it("theme.css defines core theme variables", () => {
		const themeCss = read("theme.css");

		expect(themeCss).toContain("--background");
		expect(themeCss).toContain("--foreground");
		expect(themeCss.length).toBeGreaterThan(100);
	});

	it("tailwind-animate.css includes animation utility classes", () => {
		const animateCss = read("tailwind-animate.css");

		expect(animateCss).toContain("@keyframes");
		expect(animateCss).toContain("animate-");
		expect(animateCss.length).toBeGreaterThan(100);
	});
});
