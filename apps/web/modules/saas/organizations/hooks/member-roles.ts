import type { OrganizationMemberRole } from "@repo/auth";

export function useOrganizationMemberRoles() {
	return {
		member: "Member",
		owner: "Owner",
		admin: "Admin",
	} satisfies Record<OrganizationMemberRole, string>;
}
