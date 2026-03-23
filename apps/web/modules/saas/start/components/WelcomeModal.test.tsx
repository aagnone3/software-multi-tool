import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WelcomeModal } from "./WelcomeModal";

// Mock dependencies
const useToolsMock = vi.hoisted(() => vi.fn());

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: useToolsMock,
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

// Mock localStorage
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

describe("WelcomeModal", () => {
	beforeEach(() => {
		localStorageMock.clear();
		vi.useFakeTimers();
		useToolsMock.mockReturnValue({
			enabledTools: [
				{ slug: "news-analyzer", name: "News Analyzer" },
				{ slug: "invoice-processor", name: "Invoice Processor" },
			],
			allTools: [],
			comingSoonTools: [],
		});
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function renderAndOpen() {
		render(<WelcomeModal />);
		// Trigger the 800ms delay
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
	}

	it("shows modal on first visit", async () => {
		await renderAndOpen();
		expect(
			screen.getByText("Welcome to your AI workspace"),
		).toBeInTheDocument();
	});

	it("does not show modal if already dismissed", async () => {
		localStorageMock.setItem("welcome-modal-dismissed", "true");
		render(<WelcomeModal />);
		await act(async () => {
			vi.advanceTimersByTime(1000);
		});
		expect(
			screen.queryByText("Welcome to your AI workspace"),
		).not.toBeInTheDocument();
	});

	it("can navigate to next step", async () => {
		await renderAndOpen();
		const nextBtn = screen.getByRole("button", { name: /next/i });
		fireEvent.click(nextBtn);
		expect(screen.getByText("Explore the Tools")).toBeInTheDocument();
	});

	it("can navigate back from step 2", async () => {
		await renderAndOpen();
		fireEvent.click(screen.getByRole("button", { name: /next/i }));
		fireEvent.click(screen.getByRole("button", { name: /back/i }));
		expect(
			screen.getByText("Welcome to your AI workspace"),
		).toBeInTheDocument();
	});

	it("shows step dots equal to number of steps", async () => {
		await renderAndOpen();
		const dots = screen.getAllByRole("button", { name: /go to step/i });
		expect(dots).toHaveLength(4);
	});

	it("dismisses when Skip tour is clicked", async () => {
		await renderAndOpen();
		fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));
		expect(localStorageMock.getItem("welcome-modal-dismissed")).toBe(
			"true",
		);
	});

	it("shows Try a tool link on last step", async () => {
		await renderAndOpen();
		// Navigate to last step
		for (let i = 0; i < 3; i++) {
			fireEvent.click(screen.getByRole("button", { name: /next/i }));
		}
		expect(
			screen.getByRole("link", { name: /try a tool/i }),
		).toBeInTheDocument();
	});
});
