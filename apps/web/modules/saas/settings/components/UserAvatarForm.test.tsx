import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UserAvatarForm } from "./UserAvatarForm";

vi.mock("./UserAvatarUpload", () => ({
	UserAvatarUpload: ({
		onSuccess,
		onError,
	}: {
		onSuccess: () => void;
		onError: () => void;
	}) => (
		<div>
			<button type="button" onClick={onSuccess}>
				success
			</button>
			<button type="button" onClick={onError}>
				error
			</button>
		</div>
	),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<div>
			<div>{title}</div>
			{children}
		</div>
	),
}));

const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("sonner", () => ({
	toast: { success: toastSuccessMock, error: toastErrorMock },
}));

describe("UserAvatarForm", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders the avatar settings item", () => {
		render(<UserAvatarForm />);
		expect(screen.getByText("Your avatar")).toBeDefined();
	});

	it("shows success toast when onSuccess is called", () => {
		render(<UserAvatarForm />);
		screen.getByText("success").click();
		expect(toastSuccessMock).toHaveBeenCalledWith(
			"Avatar was updated successfully",
		);
	});

	it("shows error toast when onError is called", () => {
		render(<UserAvatarForm />);
		screen.getByText("error").click();
		expect(toastErrorMock).toHaveBeenCalledWith("Could not update avatar");
	});
});
