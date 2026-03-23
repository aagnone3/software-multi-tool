"use client";

import { act, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: vi.fn(),
}));
vi.mock("next/link", () => ({
	default: ({ href, children, ...props }: React.ComponentProps<"a">) => (
		<a href={href as string} {...props}>
			{children}
		</a>
	),
}));

import { useTools } from "@saas/tools/hooks/use-tools";
import { WelcomeModal } from "./WelcomeModal";

const mockUseTools = vi.mocked(useTools);

const enabledTools = [
	{ slug: "news-analyzer", name: "News Analyzer", enabled: true },
];

beforeEach(() => {
	vi.useFakeTimers({ shouldAdvanceTime: false });
	localStorage.clear();
	mockUseTools.mockReturnValue({
		enabledTools,
		tools: enabledTools,
		visibleTools: enabledTools,
		isLoading: false,
		isToolEnabled: () => true,
	} as unknown as ReturnType<typeof useTools>);
});

afterEach(() => {
	vi.useRealTimers();
});

describe("WelcomeModal", () => {
	it("does not show before delay", () => {
		render(<WelcomeModal />);
		expect(screen.queryByText("Welcome to your AI workspace")).toBeNull();
	});

	it("shows after delay when not dismissed", () => {
		render(<WelcomeModal />);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(screen.getByText("Welcome to your AI workspace")).toBeTruthy();
	});

	it("does not show when already dismissed", () => {
		localStorage.setItem("welcome-modal-dismissed", "true");
		render(<WelcomeModal />);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		expect(screen.queryByText("Welcome to your AI workspace")).toBeNull();
	});

	it("shows step dots for all 4 steps", () => {
		render(<WelcomeModal />);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
		const stepDots = screen.getAllByRole("button", { name: /go to step/i });
		expect(stepDots.length).toBe(4);
	});
});
