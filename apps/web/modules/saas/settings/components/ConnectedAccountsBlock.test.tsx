import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const { mockLinkSocial, mockUseUserAccountsQuery } = vi.hoisted(() => ({
	mockLinkSocial: vi.fn(),
	mockUseUserAccountsQuery: vi.fn(),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		linkSocial: mockLinkSocial,
	},
}));

vi.mock("@saas/auth/lib/api", () => ({
	useUserAccountsQuery: () => mockUseUserAccountsQuery(),
}));

vi.mock("@saas/auth/constants/oauth-providers", () => ({
	oAuthProviders: {
		google: {
			name: "Google",
			icon: ({ className }: { className?: string }) => (
				<svg className={className} aria-label="Google" />
			),
		},
		github: {
			name: "GitHub",
			icon: ({ className }: { className?: string }) => (
				<svg className={className} aria-label="GitHub" />
			),
		},
	},
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
	CheckCircle2Icon: () => <svg aria-label="linked" />,
	LinkIcon: () => <svg />,
}));

import { ConnectedAccountsBlock } from "./ConnectedAccountsBlock";

describe("ConnectedAccountsBlock", () => {
	it("renders provider names", () => {
		mockUseUserAccountsQuery.mockReturnValue({
			data: [],
			isPending: false,
		});
		render(<ConnectedAccountsBlock />);
		expect(screen.getByText("Google")).toBeDefined();
		expect(screen.getByText("GitHub")).toBeDefined();
	});

	it("shows skeletons when loading", () => {
		mockUseUserAccountsQuery.mockReturnValue({
			data: undefined,
			isPending: true,
		});
		render(<ConnectedAccountsBlock />);
		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
	});

	it("shows linked icon for connected provider", () => {
		mockUseUserAccountsQuery.mockReturnValue({
			data: [{ providerId: "google" }],
			isPending: false,
		});
		render(<ConnectedAccountsBlock />);
		expect(screen.getByLabelText("linked")).toBeDefined();
	});

	it("shows connect button for unlinked provider", () => {
		mockUseUserAccountsQuery.mockReturnValue({
			data: [],
			isPending: false,
		});
		render(<ConnectedAccountsBlock />);
		const connectButtons = screen.getAllByText("Connect");
		expect(connectButtons.length).toBe(2);
	});

	it("calls linkSocial when connect button clicked", async () => {
		mockUseUserAccountsQuery.mockReturnValue({
			data: [],
			isPending: false,
		});
		render(<ConnectedAccountsBlock />);
		const [connectBtn] = screen.getAllByText("Connect");
		await userEvent.click(connectBtn);
		expect(mockLinkSocial).toHaveBeenCalled();
	});
});
