import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@repo/auth/client", () => ({
	authClient: {
		requestPasswordReset: vi.fn().mockResolvedValue({ error: null }),
	},
}));

vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: (code?: string) =>
			code ? `Error: ${code}` : "An error occurred",
	}),
}));

vi.mock("@ui/components/alert", () => ({
	Alert: ({ children, variant }: any) => (
		<div data-testid="alert" data-variant={variant}>
			{children}
		</div>
	),
	AlertTitle: ({ children }: any) => <div>{children}</div>,
	AlertDescription: ({ children }: any) => <div>{children}</div>,
}));
vi.mock("@ui/components/button", () => ({
	Button: ({ children, ...props }: any) => (
		<button {...props}>{children}</button>
	),
}));
vi.mock("@ui/components/input", () => ({
	Input: (props: any) => <input data-testid="email-input" {...props} />,
}));
vi.mock("@ui/components/form", () => ({
	Form: ({ children }: any) => <div>{children}</div>,
	FormField: ({ render: renderFn, name }: any) =>
		renderFn({
			field: {
				name,
				value: "",
				onChange: vi.fn(),
				onBlur: vi.fn(),
				ref: vi.fn(),
			},
		}),
	FormItem: ({ children }: any) => <div>{children}</div>,
	FormLabel: ({ children }: any) => <span>{children}</span>,
	FormControl: ({ children }: any) => <div>{children}</div>,
	FormMessage: () => null,
}));

describe("ForgotPasswordForm", () => {
	it("renders the forgot password heading", async () => {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
		expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
	});

	it("renders the email input field", async () => {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
		expect(screen.getByTestId("email-input")).toBeInTheDocument();
	});

	it("renders the send reset link button", async () => {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
		expect(
			screen.getByRole("button", { name: /send reset link/i }),
		).toBeInTheDocument();
	});

	it("renders back to sign in link", async () => {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
		expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
	});

	it("renders descriptive text about email reset", async () => {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
		expect(
			screen.getByText(
				/enter your email to receive a password reset link/i,
			),
		).toBeInTheDocument();
	});
});
