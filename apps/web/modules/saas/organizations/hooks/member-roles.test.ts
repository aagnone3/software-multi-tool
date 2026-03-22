import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useOrganizationMemberRoles } from "./member-roles";

describe("useOrganizationMemberRoles", () => {
	it("returns display labels for all member roles", () => {
		const { result } = renderHook(() => useOrganizationMemberRoles());

		expect(result.current.member).toBe("Member");
		expect(result.current.owner).toBe("Owner");
		expect(result.current.admin).toBe("Admin");
	});

	it("returns an object with exactly 3 keys", () => {
		const { result } = renderHook(() => useOrganizationMemberRoles());
		expect(Object.keys(result.current)).toHaveLength(3);
	});
});
