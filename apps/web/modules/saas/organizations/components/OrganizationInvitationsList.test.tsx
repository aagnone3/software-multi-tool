import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationInvitationsList } from "./OrganizationInvitationsList";

const mockCancelInvitation = vi.hoisted(() => vi.fn());
const mockUseSession = vi.hoisted(() => vi.fn());
const mockUseFullOrganizationQuery = vi.hoisted(() => vi.fn());
const mockIsOrganizationAdmin = vi.hoisted(() => vi.fn(() => true));
const mockInvalidateQueries = vi.hoisted(() => vi.fn());
const mockToastPromise = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			cancelInvitation: mockCancelInvitation,
		},
	},
}));

vi.mock("@repo/auth/lib/helper", () => ({
	isOrganizationAdmin: mockIsOrganizationAdmin,
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: mockUseSession,
}));

vi.mock("@saas/organizations/lib/api", () => ({
	fullOrganizationQueryKey: vi.fn((id: string) => ["full-org", id]),
	useFullOrganizationQuery: mockUseFullOrganizationQuery,
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: vi.fn(() => ({
		invalidateQueries: mockInvalidateQueries,
	})),
}));

vi.mock("sonner", () => ({
	toast: {
		promise: mockToastPromise,
	},
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		...props
	}: React.PropsWithChildren<Record<string, unknown>>) => (
		<button {...props}>{children}</button>
	),
}));

vi.mock("@ui/components/data-table", () => ({
	DataTable: ({
		emptyMessage,
		table,
	}: {
		emptyMessage: string;
		table: unknown;
	}) => {
		const rows =
			(
				table as { getRowModel?: () => { rows: unknown[] } }
			)?.getRowModel?.()?.rows ?? [];
		return (
			<div>
				{rows.length === 0 ? (
					<div>{emptyMessage}</div>
				) : (
					<div data-testid="data-table">rows: {rows.length}</div>
				)}
			</div>
		);
	},
	useDataTable: vi.fn(({ data }: { data: unknown[] }) => ({
		table: {
			getRowModel: () => ({
				rows: data.map((row) => ({ original: row })),
			}),
		},
	})),
}));

vi.mock("@ui/components/dropdown-menu", () => ({
	DropdownMenu: ({ children }: React.PropsWithChildren) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({ children }: React.PropsWithChildren) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: React.PropsWithChildren) => (
		<div>{children}</div>
	),
	DropdownMenuItem: ({
		children,
		onClick,
	}: React.PropsWithChildren<{ onClick?: () => void }>) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@ui/lib", () => ({
	cn: (...classes: string[]) => classes.filter(Boolean).join(" "),
}));

const mockUser = { id: "user-1", name: "Test User" };
const mockOrganizationId = "org-1";

const mockInvitation = {
	id: "inv-1",
	email: "invitee@example.com",
	status: "pending",
	role: "member",
	expiresAt: new Date(Date.now() + 86400000).toISOString(),
};

describe("OrganizationInvitationsList", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSession.mockReturnValue({ user: mockUser });
	});

	it("shows empty message when there are no pending invitations", () => {
		mockUseFullOrganizationQuery.mockReturnValue({
			data: { invitations: [] },
		});
		render(
			<OrganizationInvitationsList organizationId={mockOrganizationId} />,
		);
		expect(
			screen.getByText("You have not invited any members yet."),
		).toBeDefined();
	});

	it("shows empty message when organization data is not loaded", () => {
		mockUseFullOrganizationQuery.mockReturnValue({ data: undefined });
		render(
			<OrganizationInvitationsList organizationId={mockOrganizationId} />,
		);
		expect(
			screen.getByText("You have not invited any members yet."),
		).toBeDefined();
	});

	it("renders invitations when available", () => {
		mockUseFullOrganizationQuery.mockReturnValue({
			data: { invitations: [mockInvitation] },
		});
		render(
			<OrganizationInvitationsList organizationId={mockOrganizationId} />,
		);
		expect(screen.getByTestId("data-table")).toBeDefined();
	});

	it("does not show accepted invitations (filters to pending only)", () => {
		mockUseFullOrganizationQuery.mockReturnValue({
			data: {
				invitations: [
					{ ...mockInvitation, status: "accepted" },
					{ ...mockInvitation, id: "inv-2", status: "pending" },
				],
			},
		});
		render(
			<OrganizationInvitationsList organizationId={mockOrganizationId} />,
		);
		// Only 1 pending, so data-table shows rows: 1
		expect(screen.getByText("rows: 1")).toBeDefined();
	});
});
