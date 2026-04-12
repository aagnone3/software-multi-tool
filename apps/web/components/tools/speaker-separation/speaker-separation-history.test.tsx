"use client";

import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SpeakerSeparationHistory } from "./speaker-separation-history";

const useQueryMock = vi.hoisted(() => vi.fn());
const useQueryStateMock = vi.hoisted(() =>
	vi.fn((key: string, _parser?: { withDefault: (v: unknown) => unknown }) => {
		const defaults: Record<string, unknown> = {
			page: 1,
			search: "",
			status: "",
		};
		return [defaults[key] ?? "", vi.fn()];
	}),
);

vi.mock("@tanstack/react-query", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("@tanstack/react-query")>();
	return {
		...actual,
		useQuery: useQueryMock,
	};
});

vi.mock("nuqs", () => ({
	useQueryState: useQueryStateMock,
	parseAsInteger: {
		withDefault: (v: number) => ({ withDefault: v }),
	},
	parseAsString: {
		withDefault: (v: string) => ({ withDefault: v }),
	},
}));

vi.mock("next/link", () => ({
	default: ({
		children,
		href,
	}: {
		children: React.ReactNode;
		href: string;
	}) => <a href={href}>{children}</a>,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			list: {
				queryOptions: vi.fn(() => ({
					queryKey: ["jobs", "list"],
					queryFn: vi.fn(),
				})),
			},
		},
	},
}));

vi.mock("@ui/components/data-table", () => ({
	DataTable: ({
		isLoading,
		emptyMessage,
		loadingMessage,
	}: {
		isLoading: boolean;
		emptyMessage: React.ReactNode;
		loadingMessage: React.ReactNode;
	}) => <div>{isLoading ? loadingMessage : emptyMessage}</div>,
	useDataTable: vi.fn(() => ({ table: {} })),
}));

vi.mock("@saas/shared/components/Pagination", () => ({
	Pagination: ({ totalItems }: { totalItems: number }) => (
		<div data-testid="pagination">{totalItems} items</div>
	),
}));

vi.mock("usehooks-ts", () => ({
	useDebounceValue: (value: string) => [value, vi.fn()],
}));

describe("SpeakerSeparationHistory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: vi.fn(() => null),
				setItem: vi.fn(),
				removeItem: vi.fn(),
			},
			writable: true,
		});
	});

	it("renders loading state", () => {
		useQueryMock.mockReturnValue({
			data: undefined,
			isLoading: true,
			refetch: vi.fn(),
		});

		render(<SpeakerSeparationHistory />);
		expect(screen.getByText("Loading history...")).toBeDefined();
	});

	it("renders empty state when no jobs", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<SpeakerSeparationHistory />);
		expect(screen.getByText("No analyses yet")).toBeDefined();
	});

	it("renders history header", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<SpeakerSeparationHistory />);
		expect(screen.getByText("Analysis History")).toBeDefined();
	});

	it("renders refresh button", () => {
		const refetch = vi.fn();
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch,
		});

		render(<SpeakerSeparationHistory />);
		const btn = screen.getByText("Refresh");
		fireEvent.click(btn);
		expect(refetch).toHaveBeenCalled();
	});

	it("renders search input and status filter", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});

		render(<SpeakerSeparationHistory />);
		expect(
			screen.getByPlaceholderText("Search by filename..."),
		).toBeDefined();
		expect(screen.getByText("All Statuses")).toBeDefined();
	});
});
