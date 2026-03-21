import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStep1 } from "./OnboardingStep1";

const mockUpdateUser = vi.hoisted(() => vi.fn());
const mockUseSession = vi.hoisted(() => vi.fn());

vi.mock("@repo/auth/client", () => ({
	authClient: {
		updateUser: mockUpdateUser,
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: mockUseSession,
}));

vi.mock("@saas/settings/components/UserAvatarUpload", () => ({
	UserAvatarUpload: ({
		onSuccess,
	}: {
		onSuccess: () => void;
		onError: () => void;
	}) => (
		<button type="button" onClick={onSuccess}>
			Upload Avatar
		</button>
	),
}));

describe("OnboardingStep1", () => {
	const mockUser = {
		id: "user-1",
		name: "Test User",
		email: "test@example.com",
	};
	const onCompleted = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		mockUseSession.mockReturnValue({ user: mockUser });
	});

	it("renders the name input", () => {
		render(<OnboardingStep1 onCompleted={onCompleted} />);
		expect(screen.getByLabelText("Name")).toBeDefined();
	});

	it("submits and calls onCompleted on success", async () => {
		mockUpdateUser.mockResolvedValue({});
		const user = userEvent.setup({ delay: null });
		render(<OnboardingStep1 onCompleted={onCompleted} />);

		const input = screen.getByLabelText("Name");
		await user.clear(input);
		await user.type(input, "New Name");
		await user.click(screen.getByRole("button", { name: /continue/i }));

		await waitFor(() => {
			expect(mockUpdateUser).toHaveBeenCalledWith({ name: "New Name" });
			expect(onCompleted).toHaveBeenCalled();
		});
	});

	it("does not call onCompleted when updateUser fails", async () => {
		mockUpdateUser.mockRejectedValue(new Error("API error"));
		const user = userEvent.setup({ delay: null });
		render(<OnboardingStep1 onCompleted={onCompleted} />);

		await user.click(screen.getByRole("button", { name: /continue/i }));

		await waitFor(() => {
			expect(mockUpdateUser).toHaveBeenCalled();
		});
		expect(onCompleted).not.toHaveBeenCalled();
	});
});
