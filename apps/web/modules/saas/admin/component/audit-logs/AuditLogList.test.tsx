import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@shared/lib/orpc-client", () => ({ orpcClient: {} }));
vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		admin: {
			auditLogs: {
				filters: {
					queryOptions: vi.fn(() => ({
						queryKey: ["audit-filters"],
					})),
				},
				list: {
					queryOptions: vi.fn(() => ({ queryKey: ["audit-list"] })),
				},
				export: {
					call: vi.fn(),
				},
			},
		},
	},
}));
vi.mock("@tanstack/react-query", () => ({
	useQuery: vi.fn((opts: any) => {
		if (opts?.queryKey?.[0] === "audit-filters") {
			return {
				data: {
					actions: ["LOGIN", "CREATE"],
					resources: ["user", "org"],
				},
			};
		}
		return {
			data: {
				logs: [
					{
						id: "log1",
						createdAt: new Date("2024-01-01"),
						userId: "user123",
						organizationId: null,
						action: "LOGIN",
						resource: "session",
						resourceId: null,
						ipAddress: "127.0.0.1",
						userAgent: "TestAgent",
						sessionId: null,
						success: true,
						metadata: {},
					},
					{
						id: "log2",
						createdAt: new Date("2024-01-02"),
						userId: null,
						organizationId: "org1",
						action: "DELETE",
						resource: "organization",
						resourceId: "abcd1234efgh",
						ipAddress: null,
						userAgent: null,
						sessionId: null,
						success: false,
						metadata: {},
					},
				],
				total: 2,
			},
			isLoading: false,
		};
	}),
}));
vi.mock("nuqs", () => ({
	parseAsInteger: { withDefault: vi.fn(() => ({ withDefault: vi.fn() })) },
	parseAsString: { withDefault: vi.fn(() => ({ withDefault: vi.fn() })) },
	useQueryState: vi.fn((key: string) => {
		const defaults: Record<string, string | number> = {
			page: 1,
			search: "",
			action: "",
			resource: "",
			status: "",
		};
		return [defaults[key] ?? "", vi.fn()];
	}),
}));
vi.mock("usehooks-ts", () => ({
	useDebounceValue: vi.fn((val: string) => [val, vi.fn()]),
}));
vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn(), loading: vi.fn() },
}));
vi.mock("@ui/components/data-table", () => ({
	DataTable: ({ isLoading, emptyMessage }: any) =>
		isLoading ? (
			<div>Loading...</div>
		) : (
			<div data-testid="data-table">table</div>
		),
	useDataTable: vi.fn(() => ({ table: {} })),
}));
vi.mock("@saas/shared/components/Pagination", () => ({
	Pagination: ({ totalItems }: any) => <div>Page of {totalItems}</div>,
}));
vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div>spinner</div>,
}));

import { AuditLogList } from "./AuditLogList";

describe("AuditLogList", () => {
	it("renders the heading", () => {
		render(<AuditLogList />);
		expect(screen.getByText("Audit Logs")).toBeTruthy();
	});

	it("renders the data table", () => {
		render(<AuditLogList />);
		expect(screen.getByTestId("data-table")).toBeTruthy();
	});

	it("renders the export button", () => {
		render(<AuditLogList />);
		expect(screen.getByText("Export")).toBeTruthy();
	});

	it("renders the search input", () => {
		render(<AuditLogList />);
		expect(screen.getByPlaceholderText("Search...")).toBeTruthy();
	});
});
