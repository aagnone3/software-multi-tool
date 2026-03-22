import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
	twoFactorEnableMock,
	twoFactorDisableMock,
	twoFactorVerifyTotpMock,
	mockReloadSession,
} = vi.hoisted(() => ({
	twoFactorEnableMock: vi.fn(),
	twoFactorDisableMock: vi.fn(),
	twoFactorVerifyTotpMock: vi.fn(),
	mockReloadSession: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		twoFactor: {
			enable: twoFactorEnableMock,
			disable: twoFactorDisableMock,
			verifyTotp: twoFactorVerifyTotpMock,
		},
	},
}));

const mockUser = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	twoFactorEnabled: false,
};

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => ({
		user: mockUser,
		reloadSession: mockReloadSession,
	}),
}));

vi.mock("@saas/auth/lib/api", () => ({
	useUserAccountsQuery: () => ({
		data: [{ providerId: "credential" }],
	}),
}));

vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

vi.mock("react-qr-code", () => ({
	default: ({ value }: { value: string }) => (
		<div data-testid="qr-code" data-value={value}>
			QR Code
		</div>
	),
}));

import { toast } from "sonner";
import { TwoFactorBlock } from "./TwoFactorBlock";

const mockToast = toast as unknown as {
	success: ReturnType<typeof vi.fn>;
	error: ReturnType<typeof vi.fn>;
};

function makeWrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return ({ children }: { children: React.ReactNode }) => (
		<QueryClientProvider client={queryClient}>
			{children}
		</QueryClientProvider>
	);
}

describe("TwoFactorBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUser.twoFactorEnabled = false;
	});

	it("renders enable two-factor button when 2FA is not enabled", () => {
		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		expect(
			screen.getByText("Enable two-factor authentication"),
		).toBeTruthy();
	});

	it("renders disable button when 2FA is already enabled", () => {
		mockUser.twoFactorEnabled = true;
		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		expect(
			screen.getByText("Disable two-factor authentication"),
		).toBeTruthy();
	});

	it("shows shield icon and message when 2FA is enabled", () => {
		mockUser.twoFactorEnabled = true;
		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		expect(
			screen.getByText(
				"You have two-factor authentication enabled for your account.",
			),
		).toBeTruthy();
	});

	it("opens password dialog when enable button is clicked", async () => {
		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		await userEvent.click(
			screen.getByText("Enable two-factor authentication"),
		);
		expect(screen.getByText("Verify with password")).toBeTruthy();
	});

	it("calls twoFactor.enable and shows QR code on success", async () => {
		const totpURI =
			"otpauth://totp/App:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=App";
		twoFactorEnableMock.mockResolvedValue({
			data: { totpURI },
			error: null,
		});

		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		await userEvent.click(
			screen.getByText("Enable two-factor authentication"),
		);

		await userEvent.click(screen.getByText("Continue"));

		await waitFor(() => {
			expect(twoFactorEnableMock).toHaveBeenCalled();
			expect(screen.getByTestId("qr-code")).toBeTruthy();
		});
	});

	it("shows error toast on enable failure", async () => {
		twoFactorEnableMock.mockResolvedValue({
			data: null,
			error: new Error("wrong password"),
		});

		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		await userEvent.click(
			screen.getByText("Enable two-factor authentication"),
		);
		await userEvent.click(screen.getByText("Continue"));

		await waitFor(() => {
			expect(mockToast.error).toHaveBeenCalledWith(
				"Could not verify your account with the provided password. Please try again.",
			);
		});
	});

	it("calls twoFactor.disable on confirm and shows success toast", async () => {
		mockUser.twoFactorEnabled = true;
		twoFactorDisableMock.mockResolvedValue({ error: null });

		render(<TwoFactorBlock />, { wrapper: makeWrapper() });
		await userEvent.click(
			screen.getByText("Disable two-factor authentication"),
		);
		await userEvent.click(screen.getByText("Continue"));

		await waitFor(() => {
			expect(twoFactorDisableMock).toHaveBeenCalled();
			expect(mockToast.success).toHaveBeenCalledWith(
				"Two-factor authentication has been disabled successfully.",
			);
		});
	});
});
