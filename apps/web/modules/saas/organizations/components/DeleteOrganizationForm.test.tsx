import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const {
	mockConfirm,
	mockRefetch,
	mockSetActiveOrganization,
	mockReplace,
	mockDelete,
} = vi.hoisted(() => ({
	mockConfirm: vi.fn(),
	mockRefetch: vi.fn(),
	mockSetActiveOrganization: vi.fn(),
	mockReplace: vi.fn(),
	mockDelete: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: { delete: mockDelete },
	},
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: () => ({
		activeOrganization: { id: "org-1", name: "Test Org" },
		setActiveOrganization: mockSetActiveOrganization,
	}),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	useOrganizationListQuery: () => ({ refetch: mockRefetch }),
}));

vi.mock("@saas/shared/components/ConfirmationAlertProvider", () => ({
	useConfirmationAlert: () => ({ confirm: mockConfirm }),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		children,
		title,
	}: {
		children: React.ReactNode;
		title: string;
	}) => (
		<div>
			<h3>{title}</h3>
			{children}
		</div>
	),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockReplace }),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import { toast } from "sonner";
import { DeleteOrganizationForm } from "./DeleteOrganizationForm";

describe("DeleteOrganizationForm", () => {
	it("renders the delete organization button", () => {
		render(<DeleteOrganizationForm />);
		expect(
			screen.getByRole("button", { name: /delete organization/i }),
		).toBeInTheDocument();
	});

	it("calls confirm when delete button clicked", async () => {
		const user = userEvent.setup({ delay: null });
		render(<DeleteOrganizationForm />);
		await user.click(
			screen.getByRole("button", { name: /delete organization/i }),
		);
		expect(mockConfirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Delete organization" }),
		);
	});

	it("deletes org, reloads, and redirects on confirm", async () => {
		mockDelete.mockResolvedValueOnce({ error: null });
		mockConfirm.mockImplementationOnce(({ onConfirm }) => onConfirm());
		const user = userEvent.setup({ delay: null });
		render(<DeleteOrganizationForm />);
		await user.click(
			screen.getByRole("button", { name: /delete organization/i }),
		);
		expect(mockDelete).toHaveBeenCalledWith({ organizationId: "org-1" });
		expect(toast.success).toHaveBeenCalled();
		expect(mockSetActiveOrganization).toHaveBeenCalledWith(null);
		expect(mockRefetch).toHaveBeenCalled();
		expect(mockReplace).toHaveBeenCalledWith("/app");
	});

	it("shows error toast on delete failure", async () => {
		mockDelete.mockResolvedValueOnce({ error: { message: "oops" } });
		mockConfirm.mockImplementationOnce(({ onConfirm }) => onConfirm());
		const user = userEvent.setup({ delay: null });
		render(<DeleteOrganizationForm />);
		await user.click(
			screen.getByRole("button", { name: /delete organization/i }),
		);
		expect(toast.error).toHaveBeenCalled();
		expect(mockReplace).not.toHaveBeenCalled();
	});
});
