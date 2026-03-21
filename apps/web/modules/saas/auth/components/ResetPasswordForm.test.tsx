import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams("token=test-token"),
}));

const mockPush = vi.fn();
vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

const mockResetPassword = vi.fn();
vi.mock("@repo/auth/client", () => ({
	authClient: {
		resetPassword: (...args: any[]) => mockResetPassword(...args),
	},
}));

vi.mock("@repo/config", () => ({
	config: {
		auth: {
			redirectAfterSignIn: "/dashboard",
		},
	},
}));

const mockGetAuthErrorMessage = vi.fn(
	(code?: string) => code ?? "Unknown error",
);
vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: mockGetAuthErrorMessage,
	}),
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({ user: null }),
}));

describe("ResetPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	async function renderForm() {
		const { ResetPasswordForm } = await import("./ResetPasswordForm");
		render(<ResetPasswordForm />);
	}

	it("renders heading and password field", async () => {
		await renderForm();
		expect(
			screen.getByRole("heading", { name: /reset password/i }),
		).toBeInTheDocument();
		expect(
			document.querySelector('input[type="password"]'),
		).toBeInTheDocument();
	});

	it("renders reset button", async () => {
		await renderForm();
		expect(
			screen.getByRole("button", { name: /reset password/i }),
		).toBeInTheDocument();
	});

	it("shows success state after successful submit", async () => {
		const user = userEvent.setup({ delay: null });
		mockResetPassword.mockResolvedValueOnce({ error: null });
		await renderForm();
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"newpassword123",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);
		await waitFor(() => {
			expect(
				screen.getByText(/password has been updated successfully/i),
			).toBeInTheDocument();
		});
	});

	it("shows error alert on failed submit", async () => {
		const user = userEvent.setup({ delay: null });
		mockResetPassword.mockResolvedValueOnce({
			error: { code: "INVALID_TOKEN" },
		});
		await renderForm();
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"newpassword123",
		);
		await user.click(
			screen.getByRole("button", { name: /reset password/i }),
		);
		await waitFor(() => {
			expect(mockGetAuthErrorMessage).toHaveBeenCalledWith(
				"INVALID_TOKEN",
			);
		});
	});

	it("renders back to sign in link", async () => {
		await renderForm();
		expect(
			screen.getByRole("link", { name: /back to sign in/i }),
		).toBeInTheDocument();
	});
});
