import { render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FavoriteToolsWidget } from "./FavoriteToolsWidget";

const mockUseFavoriteTools = vi.fn();
const mockUseTools = vi.fn();

vi.mock("@saas/tools/hooks/use-favorite-tools", () => ({
	useFavoriteTools: () => mockUseFavoriteTools(),
}));

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => mockUseTools(),
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

const enabledTools = [
	{ slug: "news-analyzer", name: "News Analyzer" },
	{ slug: "invoice-processor", name: "Invoice Processor" },
	{ slug: "meeting-summarizer", name: "Meeting Summarizer" },
];

describe("FavoriteToolsWidget", () => {
	beforeEach(() => {
		mockUseTools.mockReturnValue({ enabledTools });
	});

	it("renders empty state when no favorites", () => {
		mockUseFavoriteTools.mockReturnValue({ favorites: new Set() });
		render(<FavoriteToolsWidget />);
		expect(screen.getByText("No favorites yet")).toBeInTheDocument();
		expect(
			screen.getByRole("link", { name: /Browse tools/i }),
		).toHaveAttribute("href", "/app/tools");
	});

	it("renders favorite tool list when favorites exist", () => {
		mockUseFavoriteTools.mockReturnValue({
			favorites: new Set(["news-analyzer", "invoice-processor"]),
		});
		render(<FavoriteToolsWidget />);
		expect(screen.getByText("News Analyzer")).toBeInTheDocument();
		expect(screen.getByText("Invoice Processor")).toBeInTheDocument();
		expect(
			screen.queryByText("Meeting Summarizer"),
		).not.toBeInTheDocument();
	});

	it("links to the correct tool page", () => {
		mockUseFavoriteTools.mockReturnValue({
			favorites: new Set(["news-analyzer"]),
		});
		render(<FavoriteToolsWidget />);
		expect(
			screen.getByRole("link", { name: /News Analyzer/i }),
		).toHaveAttribute("href", "/app/tools/news-analyzer");
	});

	it("shows widget title and description", () => {
		mockUseFavoriteTools.mockReturnValue({ favorites: new Set() });
		render(<FavoriteToolsWidget />);
		expect(screen.getByText("Favorites")).toBeInTheDocument();
		expect(screen.getByText("Your bookmarked tools")).toBeInTheDocument();
	});
});
