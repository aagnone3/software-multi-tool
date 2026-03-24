import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
	it("allows all user agents with disallow for app routes", () => {
		const result = robots();
		expect(result.rules).toEqual([
			{
				userAgent: "*",
				allow: "/",
				disallow: ["/app/", "/api/", "/auth/"],
			},
		]);
	});

	it("includes sitemap url", () => {
		const result = robots();
		expect(result.sitemap).toMatch(/\/sitemap\.xml$/);
	});
});
