import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requestPasswordResetMock = vi.hoisted(() => vi.fn());
const useSessionMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth/client", () => ({
	authClient: {
		requestPasswordReset: requestPasswordResetMock,
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: useSessionMock,
}));

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

import { SetPasswordForm } from "./SetPassword";

describe("SetPasswordForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useSessionMock.mockReturnValue({
			user: { id: "user-1", email: "test@example.com" },
		});
	});

	it("renders Set password button", () => {
		render(<SetPasswordForm />);
		expect(screen.getByText("Set password")).toBeDefined();
	});

	it("calls requestPasswordReset with user email on click", async () => {
		requestPasswordResetMock.mockResolvedValue(undefined);
		render(<SetPasswordForm />);
		fireEvent.click(screen.getByText("Set password"));
		expect(requestPasswordResetMock).toHaveBeenCalledWith(
			expect.objectContaining({
				email: "test@example.com",
			}),
			expect.any(Object),
		);
	});

	it("does nothing when no user is set", () => {
		useSessionMock.mockReturnValue({ user: null });
		render(<SetPasswordForm />);
		fireEvent.click(screen.getByText("Set password"));
		expect(requestPasswordResetMock).not.toHaveBeenCalled();
	});
});
