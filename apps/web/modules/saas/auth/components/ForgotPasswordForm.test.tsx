import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockRequestPasswordReset = vi.fn();
vi.mock("@repo/auth/client", () => ({
	authClient: {
		requestPasswordReset: (...args: any[]) =>
			mockRequestPasswordReset(...args),
	},
}));

vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: (code?: string) =>
			code ? `Error: ${code}` : "An error occurred",
	}),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
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

vi.mock("lucide-react", async (importOriginal) => {
	const actual = await importOriginal<typeof import("lucide-react")>();
	return {
		...actual,
	};
});

describe("ForgotPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	async function renderForm() {
		const { ForgotPasswordForm } = await import("./ForgotPasswordForm");
		render(<ForgotPasswordForm />);
	}

	it("renders the forgot password heading", async () => {
		await renderForm();
		expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
	});

	it("renders the email input field", async () => {
		await renderForm();
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	it("renders the send reset link button", async () => {
		await renderForm();
		expect(
			screen.getByRole("button", { name: /send reset link/i }),
		).toBeInTheDocument();
	});

	it("renders back to sign in link", async () => {
		await renderForm();
		expect(screen.getByText(/back to sign in/i)).toBeInTheDocument();
	});

	it("renders descriptive text about email reset", async () => {
		await renderForm();
		expect(
			screen.getByText(
				/enter your email to receive a password reset link/i,
			),
		).toBeInTheDocument();
	});

	it("shows success state after successful submit", async () => {
		const user = userEvent.setup({ delay: null });
		mockRequestPasswordReset.mockResolvedValueOnce({ error: null });
		await renderForm();
		await user.type(screen.getByRole("textbox"), "test@example.com");
		await user.click(
			screen.getByRole("button", { name: /send reset link/i }),
		);
		await waitFor(() => {
			expect(screen.getByText(/check your inbox/i)).toBeInTheDocument();
		});
	});

	it("tracks password_reset_requested on success", async () => {
		const user = userEvent.setup({ delay: null });
		mockRequestPasswordReset.mockResolvedValueOnce({ error: null });
		await renderForm();
		await user.type(screen.getByRole("textbox"), "test@example.com");
		await user.click(
			screen.getByRole("button", { name: /send reset link/i }),
		);
		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "password_reset_requested",
				props: {},
			});
		});
	});

	it("shows error alert on API error", async () => {
		const user = userEvent.setup({ delay: null });
		mockRequestPasswordReset.mockResolvedValueOnce({
			error: { code: "USER_NOT_FOUND" },
		});
		await renderForm();
		await user.type(screen.getByRole("textbox"), "bad@example.com");
		await user.click(
			screen.getByRole("button", { name: /send reset link/i }),
		);
		await waitFor(() => {
			expect(screen.getByTestId("alert")).toBeInTheDocument();
		});
	});
});
