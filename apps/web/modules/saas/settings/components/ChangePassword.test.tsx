import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const { mockChangePassword, mockRefresh, mockToastSuccess, mockToastError } =
	vi.hoisted(() => ({
		mockChangePassword: vi.fn(),
		mockRefresh: vi.fn(),
		mockToastSuccess: vi.fn(),
		mockToastError: vi.fn(),
	}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		changePassword: mockChangePassword,
	},
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ refresh: mockRefresh }),
}));

vi.mock("sonner", () => ({
	toast: {
		success: (msg: string) => mockToastSuccess(msg),
		error: (msg: string) => mockToastError(msg),
	},
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		type,
		disabled,
	}: {
		children: React.ReactNode;
		type?: string;
		disabled?: boolean;
	}) => (
		<button
			type={(type as "submit" | "button" | "reset") ?? "button"}
			disabled={disabled}
		>
			{children}
		</button>
	),
}));

vi.mock("@ui/components/password-input", () => ({
	PasswordInput: React.forwardRef(
		(
			{
				onChange,
				autoComplete,
			}: {
				onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
				autoComplete?: string;
			},
			ref: React.Ref<HTMLInputElement>,
		) => (
			<input
				ref={ref}
				type="password"
				autoComplete={autoComplete}
				onChange={onChange}
			/>
		),
	),
}));

vi.mock("@ui/components/form", () => ({
	Form: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	FormControl: ({ children }: { children: React.ReactNode }) => (
		<>{children}</>
	),
	FormField: ({
		render,
	}: {
		render: (props: { field: object }) => React.ReactNode;
	}) => <>{render({ field: {} })}</>,
	FormItem: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	FormLabel: ({ children }: { children: React.ReactNode }) => (
		<span>{children}</span>
	),
	FormMessage: () => null,
}));

import { ChangePasswordForm } from "./ChangePassword";

describe("ChangePasswordForm", () => {
	it("renders title and fields", () => {
		render(<ChangePasswordForm />);
		expect(screen.getByText("Your password")).toBeDefined();
		expect(screen.getByText("Current password")).toBeDefined();
		expect(screen.getByText("New password")).toBeDefined();
	});

	it("renders save button", () => {
		render(<ChangePasswordForm />);
		const btn = screen.getByText("Save");
		expect(btn).toBeDefined();
	});
});
