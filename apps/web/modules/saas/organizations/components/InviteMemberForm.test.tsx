import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InviteMemberForm } from "./InviteMemberForm";

const {
	mockInvalidateQueries,
	mockInviteMember,
	mockToastSuccess,
	mockToastError,
	mockTrack,
} = vi.hoisted(() => ({
	mockInvalidateQueries: vi.fn(),
	mockInviteMember: vi.fn(),
	mockToastSuccess: vi.fn(),
	mockToastError: vi.fn(),
	mockTrack: vi.fn(),
}));

vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			inviteMember: mockInviteMember,
		},
	},
}));

vi.mock("sonner", () => ({
	toast: { success: mockToastSuccess, error: mockToastError },
}));

vi.mock("@saas/organizations/lib/api", () => ({
	fullOrganizationQueryKey: (id: string) => ["org", id],
}));

vi.mock("@saas/organizations/components/OrganizationRoleSelect", () => ({
	OrganizationRoleSelect: ({
		value,
		onSelect,
	}: {
		value: string;
		onSelect: (v: string) => void;
	}) => (
		<select
			value={value}
			onChange={(e) => onSelect(e.target.value)}
			data-testid="role-select"
		>
			<option value="member">member</option>
			<option value="admin">admin</option>
			<option value="owner">owner</option>
		</select>
	),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

describe("InviteMemberForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders email input and invite button", () => {
		render(<InviteMemberForm organizationId="org-1" />);
		expect(
			screen.getByRole("textbox", { name: /email/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /invite/i }),
		).toBeInTheDocument();
	});

	it("calls inviteMember and shows success toast on valid submit", async () => {
		mockInviteMember.mockResolvedValue({ error: null });
		const user = userEvent.setup({ delay: null });
		render(<InviteMemberForm organizationId="org-1" />);

		await user.type(
			screen.getByRole("textbox", { name: /email/i }),
			"test@example.com",
		);
		await user.click(screen.getByRole("button", { name: /invite/i }));

		await waitFor(() => {
			expect(mockInviteMember).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "test@example.com",
					organizationId: "org-1",
				}),
			);
			expect(mockToastSuccess).toHaveBeenCalledWith("Member invited");
			expect(mockTrack).toHaveBeenCalledWith({
				name: "org_member_invited",
				props: { role: "member" },
			});
		});
	});

	it("shows error toast when inviteMember returns error", async () => {
		mockInviteMember.mockResolvedValue({ error: new Error("fail") });
		const user = userEvent.setup({ delay: null });
		render(<InviteMemberForm organizationId="org-1" />);

		await user.type(
			screen.getByRole("textbox", { name: /email/i }),
			"test@example.com",
		);
		await user.click(screen.getByRole("button", { name: /invite/i }));

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Could not invite member",
			);
		});
	});
});
