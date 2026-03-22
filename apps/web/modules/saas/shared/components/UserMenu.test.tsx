import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSignOut, mockUseSession } = vi.hoisted(() => ({
	mockSignOut: vi.fn(),
	mockUseSession: vi.fn(),
}));
vi.mock("@repo/auth/client", () => ({
	authClient: { signOut: mockSignOut },
}));

vi.mock("@repo/config", () => ({
	config: {
		auth: { redirectAfterLogout: "/" },
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: mockUseSession,
}));

vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: ({ name }: { name: string }) => (
		<div data-testid="user-avatar">{name}</div>
	),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
	}: {
		href: string;
		children: React.ReactNode;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("next-themes", () => ({
	useTheme: () => ({ setTheme: vi.fn(), theme: "system" }),
}));

vi.mock("@radix-ui/react-dropdown-menu", () => ({
	DropdownMenuSub: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@ui/components/dropdown-menu", () => ({
	DropdownMenu: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuSeparator: () => <hr />,
	DropdownMenuSub: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuPortal: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DropdownMenuRadioGroup: ({
		children,
		value,
		onValueChange,
	}: {
		children: React.ReactNode;
		value?: string;
		onValueChange?: (v: string) => void;
	}) => (
		<div
			data-value={value}
			onChange={(e: React.ChangeEvent<HTMLDivElement>) =>
				onValueChange?.(
					(e.target as HTMLElement).getAttribute("data-value") ?? "",
				)
			}
		>
			{children}
		</div>
	),
	DropdownMenuRadioItem: ({
		children,
		value,
	}: {
		children: React.ReactNode;
		value: string;
	}) => <div data-testid={`theme-option-${value}`}>{children}</div>,
	DropdownMenuItem: ({
		children,
		onClick,
	}: {
		children: React.ReactNode;
		asChild?: boolean;
		onClick?: () => void;
		// biome-ignore lint/a11y/noStaticElementInteractions: test-only stub
		// biome-ignore lint/a11y/useKeyWithClickEvents: test-only stub
	}) => <div onClick={onClick}>{children}</div>,
}));

import { UserMenu } from "./UserMenu";

describe("UserMenu", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns null when no user", () => {
		mockUseSession.mockReturnValue({ user: null });
		const { container } = render(<UserMenu />);
		expect(container.firstChild).toBeNull();
	});

	it("renders user avatar", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice", email: "alice@example.com", image: null },
		});
		render(<UserMenu />);
		expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
		expect(screen.getByTestId("user-avatar")).toHaveTextContent("Alice");
	});

	it("shows user name and email in dropdown label", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice", email: "alice@example.com", image: null },
		});
		render(<UserMenu />);
		expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
		expect(screen.getByText("alice@example.com")).toBeInTheDocument();
	});

	it("shows user name in trigger when showUserName=true", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice", email: "alice@example.com", image: null },
		});
		render(<UserMenu showUserName />);
		// Both the trigger span and the label render the name
		expect(screen.getAllByText("Alice").length).toBeGreaterThan(0);
	});

	it("renders theme options", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice", email: "alice@example.com", image: null },
		});
		render(<UserMenu />);
		expect(screen.getByTestId("theme-option-system")).toBeInTheDocument();
		expect(screen.getByTestId("theme-option-light")).toBeInTheDocument();
		expect(screen.getByTestId("theme-option-dark")).toBeInTheDocument();
	});

	it("renders settings, docs, home, and logout menu items", () => {
		mockUseSession.mockReturnValue({
			user: { name: "Alice", email: "alice@example.com", image: null },
		});
		render(<UserMenu />);
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.getByText("Documentation")).toBeInTheDocument();
		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("Logout")).toBeInTheDocument();
	});
});
