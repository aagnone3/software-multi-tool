"use client";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mocks
const useQueryMock = vi.hoisted(() => vi.fn());
const useMutationMock = vi.hoisted(() => vi.fn());
const useQueryClientMock = vi.hoisted(() =>
	vi.fn(() => ({
		invalidateQueries: vi.fn(),
	})),
);
const routerPushMock = vi.hoisted(() => vi.fn());
const orpcClientMock = vi.hoisted(() => ({
	jobs: {
		delete: vi.fn(),
		create: vi.fn(),
	},
}));
const orpcMock = vi.hoisted(() => ({
	jobs: {
		get: {
			queryOptions: vi.fn(() => ({ queryKey: ["jobs", "get"] })),
		},
	},
}));
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
	useMutation: useMutationMock,
	useQueryClient: useQueryClientMock,
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: routerPushMock }),
}));

vi.mock("@shared/lib/orpc-client", () => ({
	orpcClient: orpcClientMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: orpcMock,
}));

vi.mock("sonner", () => ({
	toast: {
		success: toastSuccessMock,
		error: toastErrorMock,
	},
}));

// Mock heavy child components
vi.mock("./news-analyzer-results", () => ({
	FactualRatingBadge: ({ rating }: { rating: string }) => (
		<span data-testid="factual-rating">{rating}</span>
	),
	NewsAnalyzerResults: ({ analysis: _analysis }: { analysis: unknown }) => (
		<div data-testid="news-analyzer-results">results</div>
	),
	PoliticalLeanSpectrum: ({ lean }: { lean: string }) => (
		<span data-testid="political-lean">{lean}</span>
	),
	SentimentIndicator: ({ sentiment }: { sentiment: string }) => (
		<span data-testid="sentiment">{sentiment}</span>
	),
}));

vi.mock("@shared/components/ToolFeedback", () => ({
	ToolFeedback: () => <div data-testid="tool-feedback" />,
}));

vi.mock("next/image", () => ({
	default: ({ src, alt }: { src: string; alt: string }) => (
		<img src={src} alt={alt} />
	),
}));

import { NewsAnalyzerDetail } from "./news-analyzer-detail";

const baseJob = {
	id: "job-123",
	status: "COMPLETED" as const,
	input: { articleUrl: "https://example.com" },
	newsAnalysis: {
		id: "analysis-123",
		title: "Test Article",
		analysis: {
			summary: "Test summary",
			sentiment: "Positive",
			keyTakeaways: ["Takeaway 1"],
			articles: [],
			bias: {
				factualRating: "High Confidence",
				politicalLean: "Center",
				sensationalism: 3,
			},
		},
	},
};

function setupMutations() {
	useMutationMock.mockReturnValue({
		mutate: vi.fn(),
		isPending: false,
	});
}

describe("NewsAnalyzerDetail", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		setupMutations();
	});

	it("shows loading state while fetching", () => {
		useQueryMock.mockReturnValue({
			isLoading: true,
			data: undefined,
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByText(/loading analysis/i)).toBeInTheDocument();
	});

	it("shows error state when query fails", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: undefined,
			error: new Error("Failed"),
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("shows error state when no job returned", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: { job: null },
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByRole("alert")).toBeInTheDocument();
	});

	it("renders completed job with analysis results", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: { job: baseJob },
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByTestId("news-analyzer-results")).toBeInTheDocument();
	});

	it("renders PENDING status badge for pending jobs", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: {
				job: { ...baseJob, status: "PENDING", newsAnalysis: null },
			},
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByText("Pending")).toBeInTheDocument();
	});

	it("renders PROCESSING status badge for processing jobs", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: {
				job: { ...baseJob, status: "PROCESSING", newsAnalysis: null },
			},
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByText("Processing")).toBeInTheDocument();
	});

	it("renders FAILED status badge for failed jobs", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: { job: { ...baseJob, status: "FAILED", newsAnalysis: null } },
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByText("Failed")).toBeInTheDocument();
	});

	it("shows delete dialog when delete is clicked from menu", async () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: { job: baseJob },
			error: null,
		});
		const user = userEvent.setup({ delay: null });
		render(<NewsAnalyzerDetail jobId="job-123" />);
		// Open dropdown menu
		const menuButton = screen.getByRole("button", {
			name: /more options/i,
		});
		await user.click(menuButton);
		// Click delete option
		const deleteOption = await screen.findByText(/^delete$/i);
		await user.click(deleteOption);
		// Dialog should appear
		expect(screen.getByText(/are you sure/i)).toBeInTheDocument();
	});

	it("renders share analysis section for completed jobs with analysis", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			data: { job: baseJob },
			error: null,
		});
		render(<NewsAnalyzerDetail jobId="job-123" />);
		expect(screen.getByText(/copy share link/i)).toBeInTheDocument();
	});
});
