import { describe, expect, it } from "vitest";

import { isOrganizationAdmin } from "./helper";

describe("isOrganizationAdmin", () => {
	it("detects organization level admins", () => {
		const result = isOrganizationAdmin(
			{
				members: [
					{ userId: "user-1", role: "member" },
					{ userId: "user-2", role: "admin" },
				],
			} as any,
			{ id: "user-2" },
		);

		expect(result).toBe(true);
	});

	it("falls back to user role when not a member", () => {
		const result = isOrganizationAdmin(
			{
				members: [{ userId: "user-1", role: "member" }],
			} as any,
			{ id: "user-3", role: "admin" },
		);

		expect(result).toBe(true);
	});

	it("returns false when no admin privileges exist", () => {
		expect(
			isOrganizationAdmin(
				{ members: [{ userId: "user-1", role: "member" }] } as any,
				{ id: "user-1", role: "member" },
			),
		).toBe(false);
	});
});
