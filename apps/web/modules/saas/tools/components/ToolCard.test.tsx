import type { ToolConfig } from "@repo/config/types";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { ToolCard } from "./ToolCard";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		onClick,
	}: {
		href: string;
		children: React.ReactNode;
		onClick?: () => void;
	}) => (
		<a href={href} onClick={onClick}>
			{children}
		</a>
	),
}));

vi.mock("@repo/config", () => ({
	config: {
		payments: { enabled: false },
	},
}));

const baseTool: ToolConfig = {
	slug: "test-tool",
	name: "Test Tool",
	description: "A test tool",
	icon: "file-text",
	public: false,
	enabled: true,
	creditCost: 1,
};

describe("ToolCard", () => {
	it("renders tool name and description", () => {
		render(<ToolCard tool={baseTool} />);
		expect(screen.getByText("Test Tool")).toBeInTheDocument();
		expect(screen.getByText("A test tool")).toBeInTheDocument();
	});

	it("renders Open Tool button with correct link", () => {
		render(<ToolCard tool={baseTool} />);
		const link = screen.getByRole("link");
		expect(link).toHaveAttribute("href", "/app/tools/test-tool");
		// slug-based path: /app/tools/{slug}
	});

	it("renders coming soon state when isComingSoon=true", () => {
		render(<ToolCard tool={baseTool} isComingSoon />);
		expect(screen.getAllByText("Coming Soon").length).toBeGreaterThan(0);
		const btn = screen.getByRole("button", { name: /coming soon/i });
		expect(btn).toBeDisabled();
	});

	it("renders unknown icon as fallback (WrenchIcon)", () => {
		const tool = { ...baseTool, icon: "unknown-icon" };
		render(<ToolCard tool={tool} />);
		// Just renders without error
		expect(screen.getByText("Test Tool")).toBeInTheDocument();
	});

	it("shows credit cost when creditCost > 0", () => {
		render(<ToolCard tool={baseTool} />);
		expect(screen.getByText(/1 credit per use/i)).toBeInTheDocument();
	});

	it("shows plural credits when creditCost > 1", () => {
		render(<ToolCard tool={{ ...baseTool, creditCost: 3 }} />);
		expect(screen.getByText(/3 credits per use/i)).toBeInTheDocument();
	});

	it("shows credit cost info in tooltip trigger for creditCost > 0", () => {
		render(<ToolCard tool={{ ...baseTool, creditCost: 5 }} />);
		// The trigger element with credit info is rendered in the DOM
		expect(screen.getByText(/5 credits per/i)).toBeInTheDocument();
	});

	it("hides credit display when creditCost is 0", () => {
		render(<ToolCard tool={{ ...baseTool, creditCost: 0 }} />);
		expect(screen.queryByText(/credit/i)).not.toBeInTheDocument();
	});

	it("shows 'Used' badge when isRecentlyUsed=true without lastUsedAt", () => {
		render(<ToolCard tool={baseTool} isRecentlyUsed />);
		expect(screen.getByText("Used")).toBeInTheDocument();
	});

	it("shows relative time instead of 'Used' when lastUsedAt is provided", () => {
		const recent = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
		render(<ToolCard tool={baseTool} isRecentlyUsed lastUsedAt={recent} />);
		expect(screen.getByText("5m ago")).toBeInTheDocument();
	});

	it("tracks tool_card_open_clicked when Open Tool link is clicked", async () => {
		mockTrack.mockClear();
		render(<ToolCard tool={baseTool} isRecentlyUsed isFavorite />);
		await userEvent.click(screen.getByRole("link"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_card_open_clicked",
			props: {
				tool_slug: "test-tool",
				tool_name: "Test Tool",
				is_recently_used: true,
				is_favorite: true,
			},
		});
	});

	it("tracks tool_card_favorite_toggled when favorite button is clicked", async () => {
		mockTrack.mockClear();
		const onToggle = vi.fn();
		render(
			<ToolCard
				tool={baseTool}
				isFavorite={false}
				onToggleFavorite={onToggle}
			/>,
		);
		await userEvent.click(
			screen.getByRole("button", { name: /add to favorites/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_card_favorite_toggled",
			props: {
				tool_slug: "test-tool",
				tool_name: "Test Tool",
				is_favorited: true,
			},
		});
	});

	it("tracks tool_card_preview_clicked when Preview button is clicked", async () => {
		mockTrack.mockClear();
		const onPreview = vi.fn();
		render(<ToolCard tool={baseTool} onPreview={onPreview} />);
		await userEvent.click(
			screen.getByRole("button", { name: /preview test tool/i }),
		);
		expect(mockTrack).toHaveBeenCalledWith({
			name: "tool_card_preview_clicked",
			props: { tool_slug: "test-tool", tool_name: "Test Tool" },
		});
	});

	it("has role=article and aria-label on card", () => {
		render(<ToolCard tool={baseTool} />);
		const card = screen.getByRole("article", { name: "Test Tool" });
		expect(card).toBeInTheDocument();
	});

	it("has role=article and aria-label on coming soon card", () => {
		render(<ToolCard tool={baseTool} isComingSoon />);
		const card = screen.getByRole("article", {
			name: "Test Tool — coming soon",
		});
		expect(card).toBeInTheDocument();
	});

	it("Open Tool button has descriptive aria-label", () => {
		render(<ToolCard tool={baseTool} />);
		const btn = screen.getByRole("button", { name: "Open Test Tool" });
		expect(btn).toBeInTheDocument();
	});

	it("renders known icons for each supported icon name", () => {
		const icons = [
			"image-minus",
			"users",
			"newspaper",
			"receipt",
			"file-text",
			"message-square-text",
			"wallet",
			"clipboard-list",
		];
		for (const icon of icons) {
			const { unmount } = render(
				<ToolCard tool={{ ...baseTool, icon }} />,
			);
			expect(screen.getByText("Test Tool")).toBeInTheDocument();
			unmount();
		}
	});
});
