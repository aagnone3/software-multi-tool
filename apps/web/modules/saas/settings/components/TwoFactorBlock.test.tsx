import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TwoFactorBlock } from "./TwoFactorBlock";

const mockUser = {
	id: "user-1",
	name: "Test User",
	email: "test@example.com",
	twoFactorEnabled: false,
};

vi.mock("@tanstack/react-query", () => ({
	useMutation: vi.fn(() => ({
		mutate: vi.fn(),
		isPending: false,
	})),
	useQuery: vi.fn(() => ({ data: undefined, isPending: false })),
	useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		twoFactor: {
			enable: vi.fn(),
			disable: vi.fn(),
			verifyTotp: vi.fn(),
		},
	},
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: vi.fn(),
}));

vi.mock("@saas/auth/lib/api", () => ({
	useUserAccountsQuery: vi.fn(),
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

vi.mock("react-qr-code", () => ({
	default: ({ value }: { value: string }) => (
		<div data-testid="qr-code">{value}</div>
	),
}));

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
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

vi.mock("@ui/components/dialog", () => ({
	Dialog: ({
		children,
		open,
	}: {
		children: React.ReactNode;
		open: boolean;
	}) => (open ? <div data-testid="dialog">{children}</div> : null),
	DialogContent: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogHeader: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
	DialogTitle: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@ui/components/form", () => ({
	FormItem: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("@ui/components/input", () => ({
	Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => (
		<input {...props} />
	),
}));

vi.mock("@ui/components/label", () => ({
	Label: ({
		children,
		htmlFor,
	}: {
		children: React.ReactNode;
		htmlFor?: string;
	}) => <label htmlFor={htmlFor}>{children}</label>,
}));

vi.mock("@ui/components/password-input", () => ({
	PasswordInput: ({
		value,
		onChange,
	}: {
		value: string;
		onChange: (v: string) => void;
	}) => (
		<input
			type="password"
			value={value}
			onChange={(e) => onChange(e.target.value)}
		/>
	),
}));

vi.mock("@ui/components/card", () => ({
	Card: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

import { useSession } from "@saas/auth/hooks/use-session";
import { useUserAccountsQuery } from "@saas/auth/lib/api";

describe("TwoFactorBlock", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders nothing when no credential account", () => {
		vi.mocked(useSession).mockReturnValue({
			user: mockUser,
			reloadSession: vi.fn(),
			session: null,
		} as any);
		vi.mocked(useUserAccountsQuery).mockReturnValue({
			data: [{ providerId: "google" }],
		} as any);

		const { container } = render(<TwoFactorBlock />);
		expect(container.firstChild).toBeNull();
	});

	it("renders enable button when 2FA is disabled", () => {
		vi.mocked(useSession).mockReturnValue({
			user: { ...mockUser, twoFactorEnabled: false },
			reloadSession: vi.fn(),
			session: null,
		} as any);
		vi.mocked(useUserAccountsQuery).mockReturnValue({
			data: [{ providerId: "credential" }],
		} as any);

		render(<TwoFactorBlock />);
		expect(screen.getByText(/Enable two-factor/)).toBeTruthy();
	});

	it("renders disable button when 2FA is enabled", () => {
		vi.mocked(useSession).mockReturnValue({
			user: { ...mockUser, twoFactorEnabled: true },
			reloadSession: vi.fn(),
			session: null,
		} as any);
		vi.mocked(useUserAccountsQuery).mockReturnValue({
			data: [{ providerId: "credential" }],
		} as any);

		render(<TwoFactorBlock />);
		expect(screen.getByText(/Disable two-factor/)).toBeTruthy();
	});

	it("shows status badge when 2FA is enabled", () => {
		vi.mocked(useSession).mockReturnValue({
			user: { ...mockUser, twoFactorEnabled: true },
			reloadSession: vi.fn(),
			session: null,
		} as any);
		vi.mocked(useUserAccountsQuery).mockReturnValue({
			data: [{ providerId: "credential" }],
		} as any);

		render(<TwoFactorBlock />);
		expect(screen.getByText(/enabled for your account/)).toBeTruthy();
	});
});
