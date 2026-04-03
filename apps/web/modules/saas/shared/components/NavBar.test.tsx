import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";

const mockTrack = vi.hoisted(() => vi.fn());
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const mockUseSession = vi.hoisted(() => vi.fn());
const mockUseActiveOrganization = vi.hoisted(() => vi.fn());
const mockUsePathname = vi.hoisted(() => vi.fn());

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: mockUseSession,
}));

vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: mockUseActiveOrganization,
}));

vi.mock("next/navigation", () => ({
	usePathname: mockUsePathname,
	useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		prefetch: _prefetch,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		prefetch?: unknown;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

vi.mock("@repo/config", () => ({
	config: {
		ui: { saas: { useSidebarLayout: false } },
		organizations: { enable: false, hideOrganization: false },
	},
}));

vi.mock("@saas/credits/components/CreditBalanceIndicator", () => ({
	CreditBalanceIndicator: () => <div data-testid="credit-indicator" />,
}));

vi.mock("@saas/notifications/components/NotificationBell", () => ({
	NotificationBell: () => <div data-testid="notification-bell" />,
}));

vi.mock("@saas/shared/components/UserMenu", () => ({
	UserMenu: () => <div data-testid="user-menu" />,
}));

vi.mock("@shared/components/Logo", () => ({
	Logo: () => <div data-testid="logo" />,
}));

vi.mock("@saas/organizations/components/OrganizationSelect", () => ({
	OrganzationSelect: () => <div data-testid="org-select" />,
}));

vi.mock("@ui/lib", () => ({
	cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import { NavBar } from "./NavBar";

const mockUser = {
	id: "user-1",
	name: "Test User",
	email: "test@test.com",
	role: "user",
};

describe("NavBar", () => {
	it("renders all standard menu items for personal account", () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		expect(screen.getByText("Home")).toBeInTheDocument();
		expect(screen.getByText("Tools")).toBeInTheDocument();
		expect(screen.getByText("Files")).toBeInTheDocument();
		expect(screen.getByText("Chat")).toBeInTheDocument();
		expect(screen.getByText("Settings")).toBeInTheDocument();
		expect(screen.getByText("Usage")).toBeInTheDocument();
	});

	it("uses org-scoped basePath when activeOrganization is set", () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: {
				slug: "my-org",
				id: "org-1",
				name: "My Org",
				members: [],
			},
		});
		mockUsePathname.mockReturnValue("/app/my-org");

		render(<NavBar />);

		// Home link should use org slug
		const homeLink = screen.getByText("Home").closest("a");
		expect(homeLink?.getAttribute("href")).toBe("/app/my-org");
	});

	it("uses /app basePath when no activeOrganization", () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		const homeLink = screen.getByText("Home").closest("a");
		expect(homeLink?.getAttribute("href")).toBe("/app");
	});

	it("shows Admin link for admin users", () => {
		mockUseSession.mockReturnValue({
			user: { ...mockUser, role: "admin" },
		});
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		expect(screen.getByText("Admin")).toBeInTheDocument();
	});

	it("does not show Admin link for regular users", () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		expect(screen.queryByText("Admin")).not.toBeInTheDocument();
	});

	it("tracks nav_item_clicked when a nav link is clicked", async () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({ activeOrganization: null });
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		const toolsLink = screen.getByText("Tools").closest("a") as HTMLElement;
		await userEvent.click(toolsLink);

		expect(mockTrack).toHaveBeenCalledWith({
			name: "nav_item_clicked",
			props: { label: "Tools", href: "/app/tools" },
		});
	});

	it("uses org-scoped Files link when org is active", () => {
		mockUseSession.mockReturnValue({ user: mockUser });
		mockUseActiveOrganization.mockReturnValue({
			activeOrganization: {
				slug: "my-org",
				id: "org-1",
				name: "My Org",
				members: [],
			},
		});
		mockUsePathname.mockReturnValue("/app");

		render(<NavBar />);

		const filesLink = screen.getByText("Files").closest("a");
		expect(filesLink?.getAttribute("href")).toBe("/app/my-org/files");
	});
});
