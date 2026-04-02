import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockConfirm = vi.fn();
vi.mock("@saas/shared/components/ConfirmationAlertProvider", () => ({
	useConfirmationAlert: () => ({ confirm: mockConfirm }),
}));

const mockReloadSession = vi.fn();
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({ reloadSession: mockReloadSession }),
}));

const mockDeleteUser = vi.hoisted(() => vi.fn());
vi.mock("@repo/auth/client", () => ({
	authClient: { deleteUser: mockDeleteUser },
}));

vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(({ onSuccess }: any) => ({
		mutateAsync: async () => {
			const result = await mockDeleteUser({});
			if (result?.error) {
				throw result.error;
			}
			onSuccess?.();
		},
		isPending: false,
	})),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({ children, title }: any) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

vi.mock("@ui/components/button", () => ({
	Button: ({ children, onClick }: any) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

import { DeleteAccountForm } from "./DeleteAccountForm";

describe("DeleteAccountForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the delete account heading", () => {
		render(<DeleteAccountForm />);
		expect(
			screen.getByRole("heading", { name: "Delete account" }),
		).toBeTruthy();
	});

	it("calls confirm dialog when delete button is clicked", () => {
		render(<DeleteAccountForm />);
		fireEvent.click(screen.getByRole("button", { name: "Delete account" }));
		expect(mockConfirm).toHaveBeenCalledWith(
			expect.objectContaining({ title: "Delete account" }),
		);
	});
});
