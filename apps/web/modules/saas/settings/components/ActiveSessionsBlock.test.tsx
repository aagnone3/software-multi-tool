import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveSessionsBlock } from "./ActiveSessionsBlock";

const mockSessions = [
	{
		id: "sess-1",
		token: "tok-1",
		ipAddress: "192.168.1.1",
		userAgent: "Chrome/100",
	},
	{
		id: "sess-2",
		token: "tok-2",
		ipAddress: "10.0.0.1",
		userAgent: "Firefox/99",
	},
];

vi.mock("@repo/auth/client", () => ({
	authClient: {
		listSessions: vi.fn(),
		revokeSession: vi.fn(),
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

vi.mock("@saas/shared/components/SettingsItem", () => ({
	SettingsItem: ({
		title,
		description,
		children,
	}: {
		title: string;
		description: string;
		children: React.ReactNode;
	}) => (
		<div>
			<h3>{title}</h3>
			<p>{description}</p>
			{children}
		</div>
	),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(),
	useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
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

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

import { useSession } from "@saas/auth/hooks/use-session";
import { useQuery } from "@tanstack/react-query";

describe("ActiveSessionsBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(useSession).mockReturnValue({
			session: { id: "sess-1" },
		} as any);
	});

	it("shows loading skeleton when pending", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: undefined,
			isPending: true,
		} as any);

		render(<ActiveSessionsBlock />);
		expect(screen.getAllByTestId("skeleton").length).toBeGreaterThan(0);
	});

	it("renders sessions list", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: mockSessions,
			isPending: false,
		} as any);

		render(<ActiveSessionsBlock />);
		expect(screen.getByText("Current session")).toBeTruthy();
		expect(screen.getByText("10.0.0.1")).toBeTruthy();
		expect(screen.getByText("Firefox/99")).toBeTruthy();
	});

	it("renders title and description", () => {
		vi.mocked(useQuery).mockReturnValue({
			data: [],
			isPending: false,
		} as any);

		render(<ActiveSessionsBlock />);
		expect(screen.getByText("Active sessions")).toBeTruthy();
	});

	it("calls revokeSession on button click", async () => {
		const { authClient } = await import("@repo/auth/client");
		vi.mocked(useQuery).mockReturnValue({
			data: mockSessions,
			isPending: false,
		} as any);

		render(<ActiveSessionsBlock />);
		const buttons = screen.getAllByRole("button");
		fireEvent.click(buttons[0]);
		expect(authClient.revokeSession).toHaveBeenCalledWith(
			{ token: "tok-1" },
			expect.any(Object),
		);
	});
});
