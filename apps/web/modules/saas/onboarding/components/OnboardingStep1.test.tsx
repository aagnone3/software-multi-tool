import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OnboardingStep1 } from "./OnboardingStep1";

vi.mock("sonner", () => ({
	toast: {
		error: vi.fn(),
		success: vi.fn(),
	},
}));

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

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
		onError,
	}: {
		onSuccess: () => void;
		onError: () => void;
	}) => (
		<>
			<button type="button" onClick={onSuccess}>
				Upload Avatar
			</button>
			<button type="button" onClick={onError}>
				Fail Avatar Upload
			</button>
		</>
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

	it("shows toast error when avatar upload fails", async () => {
		const { toast } = await import("sonner");
		const user = userEvent.setup({ delay: null });
		render(<OnboardingStep1 onCompleted={onCompleted} />);

		await user.click(
			screen.getByRole("button", { name: /fail avatar upload/i }),
		);

		expect(toast.error).toHaveBeenCalled();
	});

	it("tracks onboarding_step1_completed on success", async () => {
		mockUpdateUser.mockResolvedValue({});
		const user = userEvent.setup({ delay: null });
		render(<OnboardingStep1 onCompleted={onCompleted} />);

		await user.click(screen.getByRole("button", { name: /continue/i }));

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "onboarding_step1_completed",
				props: { has_avatar: false },
			});
		});
	});

	it("tracks has_avatar true when avatar was uploaded", async () => {
		mockUpdateUser.mockResolvedValue({});
		const user = userEvent.setup({ delay: null });
		render(<OnboardingStep1 onCompleted={onCompleted} />);

		await user.click(
			screen.getByRole("button", { name: /upload avatar/i }),
		);
		await user.click(screen.getByRole("button", { name: /continue/i }));

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith({
				name: "onboarding_step1_completed",
				props: { has_avatar: true },
			});
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
