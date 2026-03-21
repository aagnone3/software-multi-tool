import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const {
	mockAddPasskey,
	mockDeletePasskey,
	mockUseUserPasskeysQuery,
	mockToast,
} = vi.hoisted(() => ({
	mockAddPasskey: vi.fn(),
	mockDeletePasskey: vi.fn(),
	mockUseUserPasskeysQuery: vi.fn(),
	mockToast: { success: vi.fn(), error: vi.fn(), promise: vi.fn() },
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		passkey: {
			addPasskey: mockAddPasskey,
			deletePasskey: mockDeletePasskey,
		},
	},
}));

vi.mock("@saas/auth/lib/api", () => ({
	useUserPasskeysQuery: () => mockUseUserPasskeysQuery(),
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({ invalidateQueries: vi.fn() }),
}));

vi.mock("sonner", () => ({ toast: mockToast }));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		children,
	}: {
		title: string;
		children: React.ReactNode;
	}) => (
		<div>
			<h2>{title}</h2>
			{children}
		</div>
	),
}));

vi.mock("@ui/components/button", () => ({
	Button: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<button type="button" onClick={onClick}>
			{children}
		</button>
	),
}));

vi.mock("@ui/components/skeleton", () => ({
	Skeleton: () => <div data-testid="skeleton" />,
}));

vi.mock("lucide-react", () => ({
	KeyIcon: () => <svg />,
	PlusIcon: () => <svg />,
	TrashIcon: () => <svg />,
}));

import { PasskeysBlock } from "./PasskeysBlock";

describe("PasskeysBlock", () => {
	it("renders title", () => {
		mockUseUserPasskeysQuery.mockReturnValue({
			data: [],
			isPending: false,
		});
		render(<PasskeysBlock />);
		expect(screen.getByText("Passkeys")).toBeDefined();
	});

	it("shows skeletons when loading", () => {
		mockUseUserPasskeysQuery.mockReturnValue({
			data: undefined,
			isPending: true,
		});
		render(<PasskeysBlock />);
		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
	});

	it("renders passkey entries", () => {
		mockUseUserPasskeysQuery.mockReturnValue({
			data: [
				{
					id: "pk1",
					deviceType: "platform",
					name: "My Mac",
					createdAt: new Date("2024-01-15"),
				},
			],
			isPending: false,
		});
		render(<PasskeysBlock />);
		expect(screen.getByText("platform My Mac")).toBeDefined();
	});

	it("calls addPasskey when add button clicked", async () => {
		mockUseUserPasskeysQuery.mockReturnValue({
			data: [],
			isPending: false,
		});
		mockAddPasskey.mockResolvedValue({});
		render(<PasskeysBlock />);
		await userEvent.click(screen.getByText("Add passkey"));
		expect(mockAddPasskey).toHaveBeenCalled();
	});

	it("calls toast.promise when delete clicked", async () => {
		mockUseUserPasskeysQuery.mockReturnValue({
			data: [
				{
					id: "pk1",
					deviceType: "platform",
					name: "My Mac",
					createdAt: new Date("2024-01-15"),
				},
			],
			isPending: false,
		});
		render(<PasskeysBlock />);
		const trashBtns = screen.getAllByRole("button");
		const deleteBtn = trashBtns.find(
			(b) => b.textContent !== "Add passkey",
		);
		if (deleteBtn) {
			await userEvent.click(deleteBtn);
		}
		expect(mockToast.promise).toHaveBeenCalled();
	});
});
