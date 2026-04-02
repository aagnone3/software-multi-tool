import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
	useSearchParams: () => new URLSearchParams(),
	useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

// Mock @shared/hooks/router
const mockReplace = vi.fn();
vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));

// Mock @tanstack/react-query
vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
	QueryClient: vi
		.fn()
		.mockImplementation(() => ({ invalidateQueries: vi.fn() })),
}));

// Mock auth client
const mockSignInEmail = vi.fn();
const mockSignInMagicLink = vi.fn();
const mockSignInPasskey = vi.fn();
vi.mock("@repo/auth/client", () => ({
	authClient: {
		signIn: {
			email: (...args: any[]) => mockSignInEmail(...args),
			magicLink: (...args: any[]) => mockSignInMagicLink(...args),
			passkey: () => mockSignInPasskey(),
		},
	},
}));

// Mock config
vi.mock("@repo/config", () => ({
	config: {
		auth: {
			enablePasswordLogin: true,
			enableMagicLink: true,
			enableSignup: true,
			enableSocialLogin: false,
			enablePasskeys: false,
			redirectAfterSignIn: "/dashboard",
		},
	},
}));

// Mock use-session
const mockSession = vi.fn(() => ({
	user: null,
	loaded: true,
	reloadSession: vi.fn(),
}));
vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => mockSession(),
}));

// Mock error messages hook
vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: (code?: string) =>
			code ? `Error: ${code}` : "An error occurred",
	}),
}));

// Mock sessionQueryKey
vi.mock("@saas/auth/lib/api", () => ({
	sessionQueryKey: ["session"],
}));

// Mock analytics
vi.mock("@analytics", () => ({
	useIsFeatureEnabled: () => false,
}));

// Mock product analytics
const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

// Mock OrganizationInvitationAlert
vi.mock("@saas/organizations/components/OrganizationInvitationAlert", () => ({
	OrganizationInvitationAlert: () => (
		<div data-testid="org-invitation-alert" />
	),
}));

// Mock is-dev-environment
vi.mock("@saas/auth/lib/is-dev-environment", () => ({
	isDevEnvironment: () => false,
}));

// Mock LoginModeSwitch
vi.mock("./LoginModeSwitch", () => ({
	LoginModeSwitch: ({ activeMode, onChange }: any) => (
		<div data-testid="login-mode-switch" data-mode={activeMode}>
			<button type="button" onClick={() => onChange("magic-link")}>
				Magic Link
			</button>
			<button type="button" onClick={() => onChange("password")}>
				Password
			</button>
		</div>
	),
}));

// Mock SocialSigninButton
vi.mock("./SocialSigninButton", () => ({
	SocialSigninButton: ({ provider }: any) => (
		<button type="button">{provider}</button>
	),
}));

import { LoginForm } from "./LoginForm";

describe("LoginForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockSession.mockReturnValue({
			user: null,
			loaded: true,
			reloadSession: vi.fn(),
		});
	});

	it("renders email and password fields", () => {
		render(<LoginForm />);
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		// Password input is wrapped in a div so use DOM query
		expect(
			document.querySelector('input[type="password"]'),
		).toBeInTheDocument();
	});

	it("renders sign in button", () => {
		render(<LoginForm />);
		expect(
			screen.getByRole("button", { name: /sign in/i }),
		).toBeInTheDocument();
	});

	it("shows signup link when signup is enabled", () => {
		render(<LoginForm />);
		expect(screen.getByText(/create an account/i)).toBeInTheDocument();
	});

	it("redirects when user is already logged in", async () => {
		mockSession.mockReturnValue({
			user: { id: "1", name: "Test" } as any,
			loaded: true,
			reloadSession: vi.fn(),
		});
		render(<LoginForm />);
		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith("/dashboard");
		});
	});

	it("calls signIn.email on form submit with password mode", async () => {
		mockSignInEmail.mockResolvedValue({ data: {}, error: null });
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		await user.type(screen.getByLabelText(/email/i), "test@example.com");
		await user.type(passwordInput, "password123");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockSignInEmail).toHaveBeenCalledWith(
				expect.objectContaining({
					email: "test@example.com",
					password: "password123",
				}),
			);
		});
	});

	it("shows error message on sign in failure", async () => {
		mockSignInEmail.mockResolvedValue({
			data: null,
			error: { code: "INVALID_CREDENTIALS" },
		});
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		await user.type(screen.getByLabelText(/email/i), "test@example.com");
		await user.type(passwordInput, "wrongpass");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(
				screen.getByText(/error: INVALID_CREDENTIALS/i),
			).toBeInTheDocument();
		});
	});

	it("redirects to two-factor verify page on 2FA response", async () => {
		mockSignInEmail.mockResolvedValue({
			data: { twoFactorRedirect: true },
			error: null,
		});
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		await user.type(screen.getByLabelText(/email/i), "test@example.com");
		await user.type(passwordInput, "password123");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockReplace).toHaveBeenCalledWith(
				expect.stringContaining("/auth/verify"),
			);
		});
	});

	it("toggles password visibility", async () => {
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		expect(passwordInput).toHaveAttribute("type", "password");

		// Find the eye toggle button (type=button with no text)
		const toggleButtons = screen.getAllByRole("button");
		const eyeButton = toggleButtons.find(
			(b) =>
				b.getAttribute("type") === "button" && !b.textContent?.trim(),
		);
		if (eyeButton) {
			await user.click(eyeButton);
			expect(
				document.querySelector('input[type="text"]'),
			).toBeInTheDocument();
		}
	});

	it("tracks user_logged_in on successful password login", async () => {
		mockSignInEmail.mockResolvedValueOnce({ data: {}, error: null });
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(passwordInput, "password123");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "user_logged_in",
					props: expect.objectContaining({ method: "password" }),
				}),
			);
		});
	});

	it("tracks auth_login_failed on error", async () => {
		mockSignInEmail.mockResolvedValueOnce({
			error: { code: "INVALID_PASSWORD" },
		});
		const user = userEvent.setup({ delay: null });
		render(<LoginForm />);

		const passwordInput = document.querySelector(
			'input[type="password"]',
		) as HTMLInputElement;
		await user.type(screen.getByLabelText(/email/i), "user@example.com");
		await user.type(passwordInput, "wrong");
		await user.click(screen.getByRole("button", { name: /sign in/i }));

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "auth_login_failed",
					props: expect.objectContaining({
						error_code: "INVALID_PASSWORD",
					}),
				}),
			);
		});
	});
});
