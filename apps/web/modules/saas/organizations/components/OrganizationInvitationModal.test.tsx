import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganizationInvitationModal } from "./OrganizationInvitationModal";

const {
	mockRouterReplace,
	mockInvalidateQueries,
	mockAcceptInvitation,
	mockRejectInvitation,
	mockToastError,
} = vi.hoisted(() => ({
	mockRouterReplace: vi.fn(),
	mockInvalidateQueries: vi.fn(),
	mockAcceptInvitation: vi.fn(),
	mockRejectInvitation: vi.fn(),
	mockToastError: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: {
			acceptInvitation: mockAcceptInvitation,
			rejectInvitation: mockRejectInvitation,
		},
	},
}));

vi.mock("@saas/organizations/components/OrganizationLogo", () => ({
	OrganizationLogo: ({ name }: { name: string }) => (
		<div data-testid="org-logo">{name}</div>
	),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	organizationListQueryKey: ["organizationList"],
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockRouterReplace }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("sonner", () => ({ toast: { error: mockToastError } }));

const defaultProps = {
	invitationId: "inv-123",
	organizationName: "Acme Corp",
	organizationSlug: "acme-corp",
	logoUrl: undefined,
};

describe("OrganizationInvitationModal", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders org name and invitation text", () => {
		render(<OrganizationInvitationModal {...defaultProps} />);
		expect(screen.getByText("Join the organization")).toBeInTheDocument();
		expect(screen.getAllByText(/Acme Corp/).length).toBeGreaterThan(0);
		expect(
			screen.getByRole("button", { name: /Accept/i }),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /Decline/i }),
		).toBeInTheDocument();
	});

	it("accepts invitation and redirects to org slug", async () => {
		mockAcceptInvitation.mockResolvedValue({ error: null });
		render(<OrganizationInvitationModal {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: /Accept/i }));

		await waitFor(() => {
			expect(mockAcceptInvitation).toHaveBeenCalledWith({
				invitationId: "inv-123",
			});
			expect(mockRouterReplace).toHaveBeenCalledWith("/app/acme-corp");
		});
	});

	it("rejects invitation and redirects to /app", async () => {
		mockRejectInvitation.mockResolvedValue({ error: null });
		render(<OrganizationInvitationModal {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: /Decline/i }));

		await waitFor(() => {
			expect(mockRejectInvitation).toHaveBeenCalledWith({
				invitationId: "inv-123",
			});
			expect(mockRouterReplace).toHaveBeenCalledWith("/app");
		});
	});

	it("shows error toast on accept failure", async () => {
		mockAcceptInvitation.mockResolvedValue({ error: new Error("failed") });
		render(<OrganizationInvitationModal {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: /Accept/i }));

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalled();
		});
	});

	it("shows error toast on reject failure", async () => {
		mockRejectInvitation.mockRejectedValue(new Error("network error"));
		render(<OrganizationInvitationModal {...defaultProps} />);

		fireEvent.click(screen.getByRole("button", { name: /Decline/i }));

		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalled();
		});
	});
});
