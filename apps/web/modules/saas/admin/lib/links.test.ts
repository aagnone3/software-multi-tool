import { describe, expect, it } from "vitest";
import { getAdminPath } from "./links";

describe("getAdminPath", () => {
	it("joins a simple path segment under /app/admin", () => {
		expect(getAdminPath("users")).toBe("/app/admin/users");
	});

	it("handles a path with a leading slash", () => {
		expect(getAdminPath("/settings")).toBe("/app/admin/settings");
	});

	it("handles a nested path", () => {
		expect(getAdminPath("users/123")).toBe("/app/admin/users/123");
	});

	it("handles an empty string", () => {
		const result = getAdminPath("");
		expect(result).toMatch(/\/app\/admin/);
	});
});
