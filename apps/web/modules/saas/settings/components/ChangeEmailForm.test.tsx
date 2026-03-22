import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const { mockChangeEmail } = vi.hoisted(() => ({
	mockChangeEmail: vi.fn(),
}));
vi.mock("@repo/auth/client", () => ({
	authClient: {
		changeEmail: mockChangeEmail,
	},
}));

const mockReloadSession = vi.fn();
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { email: "user@example.com" },
		reloadSession: mockReloadSession,
	}),
}));

const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
vi.mock("sonner", () => ({
	toast: {
		success: (msg: string) => mockToastSuccess(msg),
		error: (msg: string) => mockToastError(msg),
	},
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
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

import { ChangeEmailForm } from "./ChangeEmailForm";

describe("ChangeEmailForm", () => {
	it("renders the current email in the input", () => {
		render(<ChangeEmailForm />);
		const input = screen.getByRole("textbox") as HTMLInputElement;
		expect(input.value).toBe("user@example.com");
	});

	it("shows success toast and reloads session on success", async () => {
		const user = userEvent.setup();
		mockChangeEmail.mockResolvedValue({ error: null });
		render(<ChangeEmailForm />);
		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "new@example.com");
		await user.click(screen.getByRole("button", { name: /save/i }));
		await waitFor(() => {
			expect(mockToastSuccess).toHaveBeenCalledWith(
				"Email was updated successfully",
			);
			expect(mockReloadSession).toHaveBeenCalled();
		});
	});

	it("shows error toast on failure", async () => {
		const user = userEvent.setup();
		mockChangeEmail.mockResolvedValue({ error: { message: "failed" } });
		render(<ChangeEmailForm />);
		const input = screen.getByRole("textbox");
		await user.clear(input);
		await user.type(input, "new@example.com");
		await user.click(screen.getByRole("button", { name: /save/i }));
		await waitFor(() => {
			expect(mockToastError).toHaveBeenCalledWith(
				"Could not update email",
			);
		});
	});
});
