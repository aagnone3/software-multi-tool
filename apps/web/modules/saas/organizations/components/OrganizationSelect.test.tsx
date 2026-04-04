import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OrganzationSelect } from "./OrganizationSelect";

// Mocks
const useSessionMock = vi.hoisted(() => vi.fn());
const useActiveOrganizationMock = vi.hoisted(() => vi.fn());
const useOrganizationListQueryMock = vi.hoisted(() => vi.fn());
const useRouterMock = vi.hoisted(() => vi.fn(() => ({ replace: vi.fn() })));
const clearCacheMock = vi.hoisted(() => vi.fn());
const mockTrack = vi.hoisted(() => vi.fn());

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: useSessionMock,
}));
vi.mock("@saas/organizations/hooks/use-active-organization", () => ({
	useActiveOrganization: useActiveOrganizationMock,
}));
vi.mock("@saas/organizations/lib/api", () => ({
	useOrganizationListQuery: useOrganizationListQueryMock,
}));
vi.mock("@shared/hooks/router", () => ({
	useRouter: useRouterMock,
}));
vi.mock("@shared/lib/cache", () => ({
	clearCache: clearCacheMock,
}));
vi.mock("@saas/payments/components/ActivePlanBadge", () => ({
	ActivePlanBadge: () => <span data-testid="active-plan-badge" />,
}));
vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: ({ name }: { name: string }) => (
		<span data-testid="user-avatar">{name}</span>
	),
}));
vi.mock("./OrganizationLogo", () => ({
	OrganizationLogo: ({ name }: { name: string }) => (
		<span data-testid="org-logo">{name}</span>
	),
}));
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));
vi.mock("@repo/config", () => ({
	config: {
		organizations: {
			enableBilling: false,
			requireOrganization: false,
			enableUsersToCreateOrganizations: true,
		},
		users: {
			enableBilling: false,
		},
	},
}));

describe("OrganzationSelect", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		useOrganizationListQueryMock.mockReturnValue({ data: [] });
	});

	it("returns null when no user", () => {
		useSessionMock.mockReturnValue({ user: null });
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: null,
			setActiveOrganization: vi.fn(),
		});
		const { container } = render(<OrganzationSelect />);
		expect(container.firstChild).toBeNull();
	});

	it("renders personal account when no active organization", () => {
		useSessionMock.mockReturnValue({
			user: { id: "user-1", name: "Jane Doe", image: null },
		});
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: null,
			setActiveOrganization: vi.fn(),
		});
		render(<OrganzationSelect />);
		expect(screen.getByText("Personal account")).toBeDefined();
	});

	it("renders active organization name", () => {
		useSessionMock.mockReturnValue({
			user: { id: "user-1", name: "Jane Doe", image: null },
		});
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: {
				id: "org-1",
				name: "Acme Corp",
				slug: "acme",
				logo: null,
			},
			setActiveOrganization: vi.fn(),
		});
		render(<OrganzationSelect />);
		expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
	});

	it("renders organization list after opening dropdown", async () => {
		const user = userEvent.setup({ delay: null });
		useSessionMock.mockReturnValue({
			user: { id: "user-1", name: "Jane Doe", image: null },
		});
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: null,
			setActiveOrganization: vi.fn(),
		});
		useOrganizationListQueryMock.mockReturnValue({
			data: [
				{ id: "org-1", name: "Acme Corp", slug: "acme", logo: null },
				{ id: "org-2", name: "Beta Co", slug: "beta", logo: null },
			],
		});
		render(<OrganzationSelect />);
		await user.click(screen.getByRole("button"));
		expect(screen.getAllByText("Acme Corp").length).toBeGreaterThan(0);
		expect(screen.getAllByText("Beta Co").length).toBeGreaterThan(0);
	});

	it("fires organization_select_switched analytics event when switching org", async () => {
		const user = userEvent.setup({ delay: null });
		const setActiveOrganization = vi.fn();
		useSessionMock.mockReturnValue({
			user: { id: "user-1", name: "Jane Doe", image: null },
		});
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: null,
			setActiveOrganization,
		});
		useOrganizationListQueryMock.mockReturnValue({
			data: [
				{ id: "org-1", name: "Acme Corp", slug: "acme", logo: null },
			],
		});
		clearCacheMock.mockResolvedValue(undefined);
		render(<OrganzationSelect />);
		await user.click(screen.getByRole("button"));
		const orgOption = screen.getAllByText("Acme Corp");
		await user.click(orgOption[orgOption.length - 1]);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "organization_select_switched",
			props: { to_slug: "acme" },
		});
	});

	it("renders 'Create new organization' link after opening dropdown", async () => {
		const user = userEvent.setup({ delay: null });
		useSessionMock.mockReturnValue({
			user: { id: "user-1", name: "Jane Doe", image: null },
		});
		useActiveOrganizationMock.mockReturnValue({
			activeOrganization: null,
			setActiveOrganization: vi.fn(),
		});
		render(<OrganzationSelect />);
		await user.click(screen.getByRole("button"));
		expect(screen.getByText("Create new organization")).toBeDefined();
	});
});
