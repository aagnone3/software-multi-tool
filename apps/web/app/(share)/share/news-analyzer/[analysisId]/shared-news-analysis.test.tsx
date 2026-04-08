"use client";

import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SharedNewsAnalysis } from "./shared-news-analysis";

const { useQueryMock } = vi.hoisted(() => ({
	useQueryMock: vi.fn(),
}));

vi.mock("@tanstack/react-query", () => ({
	useQuery: useQueryMock,
}));

vi.mock("@shared/lib/orpc-query-utils", () => ({
	orpc: {
		share: {
			getNewsAnalysis: {
				queryOptions: vi.fn().mockReturnValue({}),
			},
		},
	},
}));

vi.mock("@repo/config", () => ({
	config: {
		ui: { saasName: "TestApp" },
		auth: { enabled: true },
	},
}));

vi.mock(
	"../../../../../components/tools/news-analyzer/news-analyzer-results",
	() => ({
		FactualRatingBadge: ({ rating }: { rating: string }) => (
			<span data-testid="factual-rating">{rating}</span>
		),
		NewsAnalyzerResults: (_props: { output: unknown }) => (
			<div data-testid="news-results">results</div>
		),
		PoliticalLeanSpectrum: () => (
			<div data-testid="political-spectrum">spectrum</div>
		),
		SentimentIndicator: () => (
			<div data-testid="sentiment-indicator">sentiment</div>
		),
	}),
);

vi.mock(
	"../../../../../components/tools/news-analyzer/lib/history-utils",
	() => ({
		cleanArticleTitle: (title: string) => title,
	}),
);

vi.mock("sonner", () => ({
	toast: { success: vi.fn(), error: vi.fn() },
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
		// biome-ignore lint/performance/noImgElement: mock component in test
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

describe("SharedNewsAnalysis", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders loading state", () => {
		useQueryMock.mockReturnValue({
			isLoading: true,
			error: null,
			data: null,
		});
		render(<SharedNewsAnalysis analysisId="test-id" />);
		expect(screen.getByText("Loading analysis...")).toBeInTheDocument();
	});

	it("renders error state when error occurs", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			error: new Error("Not found"),
			data: null,
		});
		render(<SharedNewsAnalysis analysisId="test-id" />);
		expect(screen.getByText("Not found")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: "Start with 10 free credits" }),
		).toHaveAttribute(
			"href",
			"/auth/signup?redirect=/app/tools/news-analyzer",
		);
	});

	it("renders default error message when no analysis data", () => {
		useQueryMock.mockReturnValue({
			isLoading: false,
			error: null,
			data: { analysis: null },
		});
		render(<SharedNewsAnalysis analysisId="test-id" />);
		expect(
			screen.getByText(
				"This analysis could not be found. It may have been deleted.",
			),
		).toBeInTheDocument();
	});

	it("renders analysis results when data is loaded", () => {
		const mockAnalysis = {
			id: "test-id",
			title: "Test Article",
			url: "https://example.com/article",
			summary: "Test summary",
			output: {
				summary: "Test summary",
				sentiment: "positive",
				factualRating: "HIGH",
				politicalLean: "center",
				keyPoints: ["Point 1"],
				quotes: [],
				entities: [],
				topics: [],
				imageUrl: null,
				bias: "none",
				credibilityScore: 90,
				analysisNotes: "",
			},
			createdAt: new Date().toISOString(),
		};
		useQueryMock.mockReturnValue({
			isLoading: false,
			error: null,
			data: { analysis: mockAnalysis },
		});
		render(<SharedNewsAnalysis analysisId="test-id" />);
		expect(screen.getByTestId("news-results")).toBeInTheDocument();
		expect(
			screen.getByText("Analyze your own articles with 10 free credits."),
		).toBeInTheDocument();
		const ctaLinks = screen.getAllByRole("link", {
			name: "Start with 10 free credits",
		});
		expect(ctaLinks).toHaveLength(2);
		expect(ctaLinks[0]).toHaveAttribute(
			"href",
			"/auth/signup?redirect=/app/tools/news-analyzer",
		);
		expect(ctaLinks[1]).toHaveAttribute("href", "/tools/news-analyzer");
	});
});
