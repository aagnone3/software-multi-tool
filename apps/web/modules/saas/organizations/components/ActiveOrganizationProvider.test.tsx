import { render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActiveOrganizationProvider } from "./ActiveOrganizationProvider";

const mockPush = vi.hoisted(() => vi.fn());
const mockUseParams = vi.hoisted(() => vi.fn());
const mockGetSession = vi.hoisted(() => vi.fn());
const mockUseActiveOrganizationQuery = vi.hoisted(() => vi.fn());
const mockUseOrganizationListQuery = vi.hoisted(() => vi.fn());
const mockSetQueryData = vi.hoisted(() => vi.fn());
const mockRefetchQueries = vi.hoisted(() => vi.fn());
const mockPrefetchQuery = vi.hoisted(() => vi.fn());
const mockSetActive = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({
	useParams: mockUseParams,
	useRouter: () => ({ push: mockPush }),
}));

vi.mock("@shared/hooks/router", () => ({
	useRouter: () => ({ push: mockPush }),
}));

vi.mock("@saas/auth/hooks/use-session", () => ({
	useSession: () => mockGetSession(),
}));

vi.mock("@saas/organizations/lib/api", () => ({
	activeOrganizationQueryKey: (slug: string) => ["active-organization", slug],
	useActiveOrganizationQuery: mockUseActiveOrganizationQuery,
	useOrganizationListQuery: mockUseOrganizationListQuery,
}));

vi.mock("@saas/auth/lib/api", () => ({
	sessionQueryKey: ["session"],
}));

vi.mock("@tanstack/react-query", () => ({
	useQueryClient: () => ({
		refetchQueries: mockRefetchQueries,
		setQueryData: mockSetQueryData,
		prefetchQuery: mockPrefetchQuery,
	}),
}));

vi.mock("@repo/auth/client", () => ({
	authClient: {
		organization: { setActive: mockSetActive },
	},
}));

vi.mock("@repo/auth/lib/helper", () => ({
	isOrganizationAdmin: () => false,
}));

vi.mock("@repo/config", () => ({
	config: { organizations: { enableBilling: false } },
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		payments: {
			listPurchases: { queryOptions: vi.fn(() => ({ queryKey: [] })) },
		},
	},
}));

vi.mock("nprogress", () => ({ default: { start: vi.fn(), done: vi.fn() } }));

describe("ActiveOrganizationProvider", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockUseParams.mockReturnValue({});
		mockGetSession.mockReturnValue({ session: null, user: null });
		mockUseActiveOrganizationQuery.mockReturnValue({
			data: undefined,
			isFetched: false,
		});
		mockUseOrganizationListQuery.mockReturnValue({ data: [] });
	});

	it("renders children", () => {
		render(
			<ActiveOrganizationProvider>
				<div>child content</div>
			</ActiveOrganizationProvider>,
		);
		expect(screen.getByText("child content")).toBeDefined();
	});

	it("is loaded immediately when no org slug in URL", () => {
		mockUseParams.mockReturnValue({});
		mockUseActiveOrganizationQuery.mockReturnValue({
			data: undefined,
			isFetched: false,
		});

		render(
			<ActiveOrganizationProvider>
				<div>child</div>
			</ActiveOrganizationProvider>,
		);

		expect(screen.getByText("child")).toBeDefined();
	});

	it("renders with an active organization slug in URL", () => {
		mockUseParams.mockReturnValue({ organizationSlug: "my-org" });
		mockUseActiveOrganizationQuery.mockReturnValue({
			data: {
				id: "org-1",
				slug: "my-org",
				name: "My Org",
				members: [],
			},
			isFetched: true,
		});

		render(
			<ActiveOrganizationProvider>
				<div>org child</div>
			</ActiveOrganizationProvider>,
		);

		expect(screen.getByText("org child")).toBeDefined();
	});

	it("applies legacy fallback when session has no active org but user has orgs", async () => {
		mockUseParams.mockReturnValue({});
		mockGetSession.mockReturnValue({
			session: { activeOrganizationId: null },
			user: { id: "user-1" },
		});
		mockUseOrganizationListQuery.mockReturnValue({
			data: [{ id: "org-1", slug: "first-org", name: "First Org" }],
		});
		mockSetActive.mockResolvedValue({
			data: { id: "org-1", slug: "first-org" },
		});

		render(
			<ActiveOrganizationProvider>
				<div>child</div>
			</ActiveOrganizationProvider>,
		);

		await waitFor(() => {
			expect(mockSetActive).toHaveBeenCalledWith({
				organizationSlug: "first-org",
			});
		});
	});

	it("skips legacy fallback when session already has active org", async () => {
		mockUseParams.mockReturnValue({});
		mockGetSession.mockReturnValue({
			session: { activeOrganizationId: "org-1" },
			user: { id: "user-1" },
		});
		mockUseOrganizationListQuery.mockReturnValue({
			data: [{ id: "org-1", slug: "first-org" }],
		});

		render(
			<ActiveOrganizationProvider>
				<div>child</div>
			</ActiveOrganizationProvider>,
		);

		await waitFor(() => {
			expect(mockSetActive).not.toHaveBeenCalled();
		});
	});
});
