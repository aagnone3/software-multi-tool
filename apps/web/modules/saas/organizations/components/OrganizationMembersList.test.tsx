import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@shared/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: vi.fn() }),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			updateMemberRole: vi.fn(),
			removeMember: vi.fn(),
		},
	},
}));

vi.mock("@repo/auth/lib/helper", () => ({
	isOrganizationAdmin: vi.fn().mockReturnValue(true),
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({ user: { id: "user-1", name: "Test User" } }),
}));

vi.mock("@saas/organizations/hooks/member-roles", () => ({
	useOrganizationMemberRoles: () => ({
		member: "Member",
		admin: "Admin",
		owner: "Owner",
	}),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	fullOrganizationQueryKey: (id: string) => ["organization", id],
	useFullOrganizationQuery: () => ({
		data: {
			id: "org-1",
			members: [
				{
					id: "mem-1",
					userId: "user-2",
					role: "member",
					user: {
						id: "user-2",
						name: "Alice",
						email: "alice@example.com",
						image: null,
					},
				},
				{
					id: "mem-2",
					userId: "user-1",
					role: "owner",
					user: {
						id: "user-1",
						name: "Test User",
						email: "test@example.com",
						image: null,
					},
				},
			],
		},
	}),
}));

vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: ({ name }: { name: string }) => <span>{name}</span>,
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("./OrganizationRoleSelect", () => ({
	OrganizationRoleSelect: ({ value }: { value: string }) => (
		<span>{value}</span>
	),
}));

vi.mock("@ui/components/data-table", () => ({
	DataTable: ({ emptyMessage }: { emptyMessage: string }) => (
		<div data-testid="data-table">{emptyMessage}</div>
	),
	useDataTable: ({ data }: { data: unknown[] }) => ({
		table: { getRowModel: () => ({ rows: data }) },
	}),
}));

import { OrganizationMembersList } from "./OrganizationMembersList";

describe("OrganizationMembersList", () => {
	it("renders the data table", () => {
		render(<OrganizationMembersList organizationId="org-1" />);
		expect(screen.getByTestId("data-table")).toBeInTheDocument();
	});

	it("passes emptyMessage to DataTable", () => {
		render(<OrganizationMembersList organizationId="org-1" />);
		expect(screen.getByText("No results.")).toBeInTheDocument();
	});
});
