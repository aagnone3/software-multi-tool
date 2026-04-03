import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock auth client
const mockSignUpEmail = vi.fn();
const mockSignInMagicLink = vi.fn();
const mockAcceptInvitation = vi.fn();
vi.mock("@repo/auth/client", () => ({
	authClient: {
		signUp: {
			email: (...args: any[]) => mockSignUpEmail(...args),
		},
		signIn: {
			magicLink: (...args: any[]) => mockSignInMagicLink(...args),
		},
		organization: {
			acceptInvitation: (...args: any[]) => mockAcceptInvitation(...args),
		},
	},
}));

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		auth: {
			enableSignup: true,
			enablePasswordLogin: true,
			enableSocialLogin: false,
			redirectAfterSignIn: "/app",
		},
		payments: { plans: {} },
	},
}));

// Mock analytics feature flags
vi.mock("@analytics", () => ({
	useIsFeatureEnabled: () => false,
}));

// Mock product analytics
const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

// Mock saas auth hooks
vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: (code?: string) => code ?? "An error occurred",
	}),
}));

// Mock OrganizationInvitationAlert
vi.mock("@saas/organizations/components/OrganizationInvitationAlert", () => ({
	OrganizationInvitationAlert: () => (
		<div data-testid="invitation-alert">Invitation</div>
	),
}));

// Mock SocialSigninButton
vi.mock("./SocialSigninButton", () => ({
	SocialSigninButton: ({ provider }: { provider: string }) => (
		<button type="button">Sign in with {provider}</button>
	),
}));

import { SignupForm } from "./SignupForm";

describe("SignupForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the signup form", () => {
		render(<SignupForm />);
		expect(
			screen.getByRole("heading", {
				name: /start saving hours every week/i,
			}),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /create free account/i }),
		).toBeInTheDocument();
	});

	it("renders name, email, and password fields", () => {
		render(<SignupForm />);
		expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		// Password field is wrapped in a div so query by type
		expect(
			document.querySelector('input[type="password"]'),
		).toBeInTheDocument();
	});

	it("prefills email from prop", () => {
		render(<SignupForm prefillEmail="test@example.com" />);
		const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement;
		expect(emailInput.value).toBe("test@example.com");
	});

	it("calls signUp.email on submit with valid data", async () => {
		const user = userEvent.setup({ delay: null });
		mockSignUpEmail.mockResolvedValueOnce({ error: null });
		render(<SignupForm />);

		await user.type(screen.getByLabelText(/name/i), "Test User");
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"password123",
		);
		await user.click(
			screen.getByRole("button", { name: /create free account/i }),
		);

		await waitFor(() => {
			expect(mockSignUpEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "user@example.com",
					name: "Test User",
					password: "password123",
				}),
			);
		});
	});

	it("shows success message after successful signup", async () => {
		const user = userEvent.setup({ delay: null });
		mockSignUpEmail.mockResolvedValueOnce({ error: null });
		render(<SignupForm />);

		await user.type(screen.getByLabelText(/name/i), "Test User");
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"password123",
		);
		await user.click(
			screen.getByRole("button", { name: /create free account/i }),
		);

		await waitFor(() => {
			expect(
				screen.getByText(/we have sent you an email/i),
			).toBeInTheDocument();
		});
	});

	it("shows error message when signup fails", async () => {
		const user = userEvent.setup({ delay: null });
		mockSignUpEmail.mockResolvedValueOnce({
			error: { code: "USER_ALREADY_EXISTS" },
		});
		render(<SignupForm />);

		await user.type(screen.getByLabelText(/name/i), "Test User");
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"password123",
		);
		await user.click(
			screen.getByRole("button", { name: /create free account/i }),
		);

		await waitFor(() => {
			expect(screen.getByText("USER_ALREADY_EXISTS")).toBeInTheDocument();
		});
	});

	it("toggles password visibility", async () => {
		const user = userEvent.setup({ delay: null });
		render(<SignupForm />);
		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		expect(passwordInput).toBeTruthy();
		expect(passwordInput.type).toBe("password");

		const toggleBtn = screen.getByRole("button", {
			name: /show password/i,
		});
		expect(toggleBtn).toBeTruthy();
		await user.click(toggleBtn);
		expect(passwordInput.type).toBe("text");
		expect(
			screen.getByRole("button", { name: /hide password/i }),
		).toBeInTheDocument();

		await user.click(
			screen.getByRole("button", { name: /hide password/i }),
		);
		expect(passwordInput.type).toBe("password");
	});

	it("tracks user_signed_up on successful signup", async () => {
		mockSignUpEmail.mockResolvedValueOnce({ error: null });
		const user = userEvent.setup({ delay: null });
		render(<SignupForm />);

		await user.type(screen.getByLabelText(/name/i), "Test User");
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"password123",
		);
		await user.click(
			screen.getByRole("button", { name: /create free account/i }),
		);

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				expect.objectContaining({ name: "user_signed_up" }),
			);
		});
	});

	it("tracks auth_signup_failed on error", async () => {
		mockSignUpEmail.mockResolvedValueOnce({
			error: { code: "EMAIL_TAKEN" },
		});
		const user = userEvent.setup({ delay: null });
		render(<SignupForm />);

		await user.type(screen.getByLabelText(/name/i), "Test User");
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(
			document.querySelector(
				'input[type="password"]',
			) as HTMLInputElement,
			"password123",
		);
		await user.click(
			screen.getByRole("button", { name: /create free account/i }),
		);

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "auth_signup_failed",
					props: expect.objectContaining({
						error_code: "EMAIL_TAKEN",
					}),
				}),
			);
		});
	});
});
