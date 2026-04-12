import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NewsAnalyzerHistory } from "./news-analyzer-history";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

const { useQueryMock } = vi.hoisted(() => ({
	useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		jobs: {
			list: {
				queryOptions: vi.fn().mockReturnValue({}),
			},
		},
	},
}));

vi.mock("nuqs", () => ({
	parseAsInteger: {
		withDefault: (val: number) => ({ defaultValue: val }),
	},
	parseAsString: {
		withDefault: (val: string) => ({ defaultValue: val }),
	},
	useQueryState: vi.fn(
		(_key: string, opts: { defaultValue: string | number }) => [
			opts.defaultValue,
			vi.fn(),
		],
	),
}));

vi.mock("usehooks-ts", () => ({
	useDebounceValue: vi.fn((val: string) => [val, vi.fn()]),
}));

vi.mock("@ui/components/data-table", () => ({
	DataTable: ({
		data,
		emptyMessage,
	}: {
		data?: unknown[];
		emptyMessage?: string;
	}) => (
		<div data-testid="data-table">
			{(data ?? []).length === 0 && emptyMessage ? (
				<span>{emptyMessage}</span>
			) : (
				<span>{(data ?? []).length} rows</span>
			)}
		</div>
	),
	useDataTable: vi.fn(() => ({
		table: {},
	})),
}));

vi.mock("@saas/shared/components/Pagination", () => ({
	Pagination: ({ totalItems }: { totalItems: number }) => (
		<div data-testid="pagination">total: {totalItems}</div>
	),
}));

vi.mock("@shared/components/Spinner", () => ({
	Spinner: () => <div data-testid="spinner" />,
}));

vi.mock("next/image", () => ({
	default: ({
		src,
		alt,
	}: {
		src: string;
		alt: string;
		width?: number;
		height?: number;
	}) => <img src={src} alt={alt} />,
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

vi.mock("./lib/history-utils", () => ({
	cleanArticleTitle: (title: string) => title,
	filterJobsBySearch: (jobs: unknown[]) => jobs,
	filterJobsByStatus: (jobs: unknown[]) => jobs,
	getArticleTitle: () => "Test Article",
	paginateJobs: (jobs: unknown[]) => jobs,
	statusConfig: {
		PENDING: { variant: "info", label: "Pending" },
		PROCESSING: { variant: "info", label: "Processing" },
		COMPLETED: { variant: "success", label: "Completed" },
		FAILED: { variant: "error", label: "Failed" },
		CANCELLED: { variant: "warning", label: "Cancelled" },
	},
}));

describe("NewsAnalyzerHistory", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockTrack.mockClear();
		// Mock localStorage
		Object.defineProperty(window, "localStorage", {
			value: {
				getItem: vi.fn().mockReturnValue(null),
				setItem: vi.fn(),
				removeItem: vi.fn(),
				clear: vi.fn(),
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
		render(<NewsAnalyzerHistory />);
		// DataTable is mocked and receives isLoading=true; the heading still renders
		expect(screen.getByText("Analysis History")).toBeInTheDocument();
		expect(screen.getByTestId("data-table")).toBeInTheDocument();
	});

	it("renders empty state when no jobs", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});
		render(<NewsAnalyzerHistory />);
		expect(screen.getByTestId("data-table")).toBeInTheDocument();
	});

	it("renders jobs when data is available", () => {
		const jobs = [
			{
				id: "job-1",
				toolSlug: "news-analyzer",
				status: "COMPLETED",
				createdAt: new Date("2024-01-01").toISOString(),
				input: { articleUrl: "https://example.com/article" },
				output: {
					articleMetadata: { title: "Test Article", ogImage: null },
				},
				newsAnalysis: null,
				attempts: 1,
				maxAttempts: 3,
				error: null,
			},
		];
		useQueryMock.mockReturnValue({
			data: { jobs },
			isLoading: false,
			refetch: vi.fn(),
		});
		render(<NewsAnalyzerHistory />);
		expect(screen.getByTestId("data-table")).toBeInTheDocument();
	});

	it("renders search and filter controls", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});
		render(<NewsAnalyzerHistory />);
		// Search input has placeholder text
		expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
	});

	it("renders pagination component when items exceed page limit", () => {
		// Need more than ITEMS_PER_PAGE (10) filtered jobs to show pagination
		const jobs = Array.from({ length: 11 }, (_, i) => ({
			id: `job-${i}`,
			toolSlug: "news-analyzer",
			status: "COMPLETED",
			createdAt: new Date("2024-01-01").toISOString(),
			input: { articleUrl: `https://example.com/article-${i}` },
			output: {
				articleMetadata: { title: `Article ${i}`, ogImage: null },
			},
			newsAnalysis: null,
			attempts: 1,
			maxAttempts: 3,
			error: null,
		}));
		useQueryMock.mockReturnValue({
			data: { jobs },
			isLoading: false,
			refetch: vi.fn(),
		});
		render(<NewsAnalyzerHistory />);
		expect(screen.getByTestId("pagination")).toBeInTheDocument();
	});

	it("track is available via useProductAnalytics mock", () => {
		useQueryMock.mockReturnValue({
			data: { jobs: [] },
			isLoading: false,
			refetch: vi.fn(),
		});
		render(<NewsAnalyzerHistory />);
		expect(mockTrack).not.toHaveBeenCalled();
	});
});
