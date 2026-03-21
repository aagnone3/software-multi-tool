import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@shared/lib/orpc-client", () => ({ orpcClient: {} }));
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		admin: {
			organizations: {
				list: {
					queryOptions: vi.fn(() => ({ queryKey: ["orgs-list"] })),
					key: vi.fn(() => ["orgs-list"]),
				},
			},
		},
	},
}));
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({
		data: {
			organizations: [
				{
					id: "o1",
					name: "Acme Corp",
					slug: "acme",
					logo: null,
					createdAt: new Date(),
					members: [],
				},
			],
			total: 1,
		},
		isLoading: false,
	})),
	useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
}));
vi.mock("nuqs", () => ({
	parseAsInteger: { withDefault: vi.fn(() => ({ withDefault: vi.fn() })) },
	parseAsString: { withDefault: vi.fn(() => ({ withDefault: vi.fn() })) },
	useQueryState: vi.fn((key: string) => [
		key === "currentPage" ? 1 : "",
		vi.fn(),
	]),
}));
vi.mock("usehooks-ts", () => ({
	useDebounceValue: vi.fn((val: string) => [val, vi.fn()]),
}));
vi.mock("sonner", () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
		loading: vi.fn(),
		promise: vi.fn(),
	},
}));
vi.mock("@ui/components/data-table", () => ({
	DataTable: () => <div data-testid="data-table">table</div>,
	useDataTable: vi.fn(() => ({ table: {} })),
}));
vi.mock("@saas/shared/components/Pagination", () => ({
	Pagination: ({ totalItems }: any) => <div>Page of {totalItems}</div>,
}));
vi.mock("@saas/shared/components/ConfirmationAlertProvider", () => ({
	useConfirmationAlert: vi.fn(() => ({ confirm: vi.fn() })),
}));
vi.mock("@saas/organizations/components/OrganizationLogo", () => ({
	OrganizationLogo: () => <div>logo</div>,
}));
vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div>spinner</div>,
}));
vi.mock("@repo/auth/client", () => ({
	authClient: { organization: { delete: vi.fn() } },
}));
vi.mock("@saas/admin/lib/links", () => ({
	getAdminPath: (path: string) => `/admin${path}`,
}));
vi.mock("next/link", () => ({
	default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));
vi.mock("ufo", () => ({
	withQuery: (path: string, q: any) => `${path}?${new URLSearchParams(q)}`,
}));

import { OrganizationList } from "./OrganizationList";

describe("OrganizationList", () => {
	it("renders the heading", () => {
		render(<OrganizationList />);
		expect(screen.getByText("Organizations")).toBeTruthy();
	});

	it("renders the data table", () => {
		render(<OrganizationList />);
		expect(screen.getByTestId("data-table")).toBeTruthy();
	});

	it("renders the search input", () => {
		render(<OrganizationList />);
		expect(screen.getByPlaceholderText("Search...")).toBeTruthy();
	});

	it("renders the create button", () => {
		render(<OrganizationList />);
		expect(screen.getByText("Create")).toBeTruthy();
	});
});
