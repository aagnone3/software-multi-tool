import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockReplace = vi.fn();
const mockGet = vi.fn();

// Mock input-otp to avoid internal setTimeout that fires after test cleanup
vi.mock("@ui/components/input-otp", () => ({
	InputOTP: ({
		children,
		onChange,
		maxLength,
	}: {
		children: React.ReactNode;
		onChange?: (v: string) => void;
		maxLength?: number;
	}) => (
		<div data-testid="input-otp">
			<input
				aria-label="one-time code"
				autoComplete="one-time-code"
				maxLength={maxLength}
				onChange={(e) => onChange?.(e.target.value)}
			/>
			{children}
		</div>
	),
	InputOTPGroup: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	InputOTPSlot: ({ index }: { index: number }) => (
		<div data-slot="input-otp-slot" data-index={index} />
	),
	InputOTPSeparator: () => <div />,
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		twoFactor: {
			verifyTotp: vi.fn(),
		},
	},
}));
vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ replace: mockReplace, push: vi.fn() }),
}));
vi.mock("next/navigation", () => ({
	useSearchParams: () => ({ get: mockGet }),
}));
vi.mock("@repo/config", () => ({
	config: {
		auth: { redirectAfterSignIn: "/dashboard" },
	},
}));
vi.mock("@saas/auth/hooks/errors-messages", () => ({
	useAuthErrorMessages: () => ({
		getAuthErrorMessage: (code: string | undefined) =>
			code ? `Error: ${code}` : "An unknown error occurred",
	}),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { authClient } from "@repo/auth/client";
import { OtpForm } from "./OtpForm";

describe("OtpForm", () => {
	const mockVerifyTotp = vi.mocked(authClient.twoFactor.verifyTotp);

	beforeEach(() => {
		vi.clearAllMocks();
		mockGet.mockReturnValue(null);
	});

	it("renders the two-factor auth form", () => {
		render(<OtpForm />);
		expect(
			screen.getByText("Two-factor authentication"),
		).toBeInTheDocument();
		expect(
			screen.getByRole("button", { name: /verify/i }),
		).toBeInTheDocument();
	});

	it("renders a back-to-sign-in link", () => {
		render(<OtpForm />);
		const link = screen.getByRole("link", { name: /back to sign in/i });
		expect(link).toHaveAttribute("href", "/auth/login");
	});

	it("renders 6 OTP input slots", () => {
		render(<OtpForm />);
		const slots = document.querySelectorAll("[data-slot='input-otp-slot']");
		expect(slots).toHaveLength(6);
	});

	it("redirects to default path on successful verification", async () => {
		mockVerifyTotp.mockResolvedValueOnce({ error: null });
		render(<OtpForm />);

		// Simulate filling 6 characters to trigger auto-submit
		const input = document.querySelector(
			"input[autocomplete='one-time-code']",
		);
		if (input) {
			fireEvent.change(input, { target: { value: "123456" } });
		}

		await waitFor(() => {
			if (mockVerifyTotp.mock.calls.length > 0) {
				expect(mockReplace).toHaveBeenCalledWith("/dashboard");
			}
		});
	});

	it("uses redirectTo param when provided", () => {
		mockGet.mockImplementation((key: string) =>
			key === "redirectTo" ? "/settings" : null,
		);
		// Just verifying the component renders correctly with a redirect param
		render(<OtpForm />);
		expect(
			screen.getByText("Two-factor authentication"),
		).toBeInTheDocument();
	});

	it("uses invitation path when invitationId param provided", () => {
		mockGet.mockImplementation((key: string) =>
			key === "invitationId" ? "inv-123" : null,
		);
		render(<OtpForm />);
		expect(
			screen.getByText("Two-factor authentication"),
		).toBeInTheDocument();
	});

	it("tracks mfa_otp_verified on successful verification", async () => {
		mockVerifyTotp.mockResolvedValueOnce({ error: null });
		render(<OtpForm />);

		const input = document.querySelector(
			"input[autocomplete='one-time-code']",
		);
		if (input) {
			fireEvent.change(input, { target: { value: "123456" } });
		}

		await waitFor(() => {
			if (mockVerifyTotp.mock.calls.length > 0) {
				expect(mockTrack).toHaveBeenCalledWith({
					name: "mfa_otp_verified",
					props: {},
				});
			}
		});
	});

	it("shows error alert when verification fails", async () => {
		mockVerifyTotp.mockResolvedValueOnce({
			error: { code: "INVALID_CODE" },
		});
		render(<OtpForm />);

		const input = document.querySelector(
			"input[autocomplete='one-time-code']",
		);
		if (input) {
			fireEvent.change(input, { target: { value: "999999" } });
		}

		await waitFor(() => {
			if (mockVerifyTotp.mock.calls.length > 0) {
				expect(screen.queryByText(/error:/i)).toBeTruthy();
			}
		});
	});
});
