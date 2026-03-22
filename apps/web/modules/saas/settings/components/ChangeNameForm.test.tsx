import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ChangeNameForm } from "./ChangeNameForm";

const { mockUpdateUser, mockReloadSession } = vi.hoisted(() => ({
	mockUpdateUser: vi.fn(),
	mockReloadSession: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		updateUser: mockUpdateUser,
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({
		user: { name: "Alice", email: "alice@example.com" },
		reloadSession: mockReloadSession,
	}),
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

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		disabled,
		type,
	}: {
		children: React.ReactNode;
		disabled?: boolean;
		type?: string;
	}) => (
		<button
			type={(type as "submit" | "button" | "reset") ?? "button"}
			disabled={disabled}
		>
			{children}
		</button>
	),
}));

vi.mock("@ui/components/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

describe("ChangeNameForm", () => {
	it("renders the form with current name", () => {
		render(<ChangeNameForm />);
		expect(screen.getByText("Your name")).toBeTruthy();
		const input = screen.getByRole("textbox") as HTMLInputElement;
		expect(input.value).toBe("Alice");
	});

	it("calls updateUser and reloadSession on valid submit", async () => {
		mockUpdateUser.mockResolvedValue({ error: null });
		render(<ChangeNameForm />);

		const input = screen.getByRole("textbox");
		await userEvent.clear(input);
		await userEvent.type(input, "Bob Smith");

		const btn = screen.getByRole("button");
		await userEvent.click(btn);

		await waitFor(() => {
			expect(mockUpdateUser).toHaveBeenCalledWith({ name: "Bob Smith" });
			expect(mockReloadSession).toHaveBeenCalled();
		});
	});

	it("shows error toast when updateUser fails", async () => {
		const { toast } = await import("sonner");
		mockUpdateUser.mockResolvedValue({ error: { message: "fail" } });
		render(<ChangeNameForm />);

		const input = screen.getByRole("textbox");
		await userEvent.clear(input);
		await userEvent.type(input, "New Name");

		const btn = screen.getByRole("button");
		await userEvent.click(btn);

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith("Could not update name");
		});
	});
});
