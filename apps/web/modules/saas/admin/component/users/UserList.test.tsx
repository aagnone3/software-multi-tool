import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@shared/lib/orpc-client", () => ({ orpcClient: {} }));
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		admin: {
			users: {
				list: {
					queryOptions: vi.fn(() => ({ queryKey: ["users-list"] })),
					key: vi.fn(() => ["users-list"]),
				},
			},
		},
	},
}));
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn(() => ({
		data: {
			users: [
				{
					id: "u1",
					name: "Alice",
					email: "alice@test.com",
					createdAt: new Date(),
					role: "user",
					banned: false,
					emailVerified: true,
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
	useQueryState: vi.fn((key: string) => {
		return [key === "currentPage" ? 1 : "", vi.fn()];
	}),
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
vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div>spinner</div>,
}));
vi.mock("@shared/components/UserAvatar", () => ({
	UserAvatar: () => <div>avatar</div>,
}));
vi.mock("@repo/auth/client", () => ({
	authClient: {
		admin: {
			banUser: vi.fn(),
			unbanUser: vi.fn(),
			impersonateUser: vi.fn(),
			removeUser: vi.fn(),
		},
	},
}));
vi.mock("../EmailVerified", () => ({
	EmailVerified: () => <span>verified</span>,
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { UserList } from "./UserList";

describe("UserList", () => {
	beforeEach(() => {
		mockTrack.mockClear();
	});

	it("renders the heading", () => {
		render(<UserList />);
		expect(screen.getByText("Users")).toBeTruthy();
	});

	it("renders the data table", () => {
		render(<UserList />);
		expect(screen.getByTestId("data-table")).toBeTruthy();
	});

	it("renders the search input", () => {
		render(<UserList />);
		expect(screen.getByPlaceholderText("Search...")).toBeTruthy();
	});
});
