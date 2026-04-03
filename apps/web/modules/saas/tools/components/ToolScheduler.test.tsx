import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock toast
vi.mock("sonner", () => ({
	toast: Object.assign(vi.fn(), {
		success: vi.fn(),
		error: vi.fn(),
	}),
}));

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

import { toast } from "sonner";
import { ToolScheduler } from "./ToolScheduler";

const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		removeItem: (key: string) => {
			delete store[key];
		},
		clear: () => {
			store = {};
		},
	};
})();

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("ToolScheduler", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.clearAllMocks();
	});

	it("renders schedule button", () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		expect(
			screen.getByRole("button", { name: /schedule/i }),
		).toBeInTheDocument();
	});

	it("opens dialog on click", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		expect(
			await screen.findByText("Schedule a reminder"),
		).toBeInTheDocument();
	});

	it("shows tool name in dialog description", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		expect(await screen.findByText(/News Analyzer/)).toBeInTheDocument();
	});

	it("shows minutes and hours options", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		await screen.findByText("Schedule a reminder");
		// The label "Remind me in" should be visible
		expect(screen.getByLabelText(/remind me in/i)).toBeInTheDocument();
	});

	it("shows error toast when offset is 0", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		await screen.findByText("Schedule a reminder");

		const input = screen.getByLabelText(/remind me in/i);
		fireEvent.change(input, { target: { value: "0" } });

		fireEvent.click(screen.getByRole("button", { name: /set reminder/i }));
		expect(toast.error).toHaveBeenCalledWith(
			"Please enter a valid time offset",
		);
	});

	it("saves scheduled run on success", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		await screen.findByText("Schedule a reminder");

		fireEvent.click(screen.getByRole("button", { name: /set reminder/i }));

		await waitFor(() => {
			expect(toast.success).toHaveBeenCalledWith(
				"Reminder set for News Analyzer",
				expect.any(Object),
			);
		});

		const stored = JSON.parse(
			localStorageMock.getItem("tool-scheduled-runs") ?? "[]",
		);
		expect(stored).toHaveLength(1);
		expect(stored[0].toolSlug).toBe("news-analyzer");
	});

	it("tracks tool_schedule_set event on success", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		await screen.findByText("Schedule a reminder");

		fireEvent.click(screen.getByRole("button", { name: /set reminder/i }));

		await waitFor(() => {
			expect(mockTrack).toHaveBeenCalledWith(
				expect.objectContaining({
					name: "tool_schedule_set",
					props: expect.objectContaining({
						tool_slug: "news-analyzer",
					}),
				}),
			);
		});
	});

	it("time unit select trigger has aria-label", async () => {
		render(
			<ToolScheduler toolSlug="news-analyzer" toolName="News Analyzer" />,
		);
		fireEvent.click(screen.getByRole("button", { name: /schedule/i }));
		await screen.findByText("Schedule a reminder");
		expect(
			screen.getByRole("combobox", { name: /time unit/i }),
		).toBeInTheDocument();
	});
});
