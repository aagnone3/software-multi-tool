"use client";

import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@saas/tools/hooks/use-tools", () => ({
	useTools: () => ({
		enabledTools: [
			{
				slug: "document-analyzer",
				name: "Document Analyzer",
				creditCost: 5,
				public: true,
				comingSoon: false,
			},
		],
	}),
}));

vi.mock("next/link", () => ({
	default: ({
		href,
		children,
		...props
	}: {
		href: string;
		children: React.ReactNode;
		[key: string]: unknown;
	}) => (
		<a href={href} {...props}>
			{children}
		</a>
	),
}));

const mockLocalStorage: Record<string, string> = {};
vi.stubGlobal("localStorage", {
	getItem: (key: string) => mockLocalStorage[key] ?? null,
	setItem: (key: string, value: string) => {
		mockLocalStorage[key] = value;
	},
	removeItem: (key: string) => {
		delete mockLocalStorage[key];
	},
	clear: () => {
		for (const key of Object.keys(mockLocalStorage)) {
			delete mockLocalStorage[key];
		}
	},
});

import { WelcomeModal } from "./WelcomeModal";

describe("WelcomeModal", () => {
	beforeEach(() => {
		for (const key of Object.keys(mockLocalStorage)) {
			delete mockLocalStorage[key];
		}
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	const openModal = () => {
		render(<WelcomeModal />);
		act(() => {
			vi.advanceTimersByTime(1000);
		});
	};

	it("renders welcome modal after delay when not dismissed", () => {
		openModal();
		expect(
			screen.getByText("Welcome to your AI workspace"),
		).toBeInTheDocument();
	});

	it("does not render when previously dismissed", () => {
		mockLocalStorage["welcome-modal-dismissed"] = "true";
		openModal();
		expect(
			screen.queryByText("Welcome to your AI workspace"),
		).not.toBeInTheDocument();
	});

	it("navigates to next step on Next button click", () => {
		openModal();
		fireEvent.click(screen.getByRole("button", { name: /next/i }));
		expect(screen.getByText("Explore the Tools")).toBeInTheDocument();
	});

	it("navigates back on Back button click", () => {
		openModal();
		fireEvent.click(screen.getByRole("button", { name: /next/i }));
		fireEvent.click(screen.getByRole("button", { name: /back/i }));
		expect(
			screen.getByText("Welcome to your AI workspace"),
		).toBeInTheDocument();
	});

	it("shows Try a tool button on last step", () => {
		openModal();
		const nextBtn = screen.getByRole("button", { name: /next/i });
		fireEvent.click(nextBtn);
		fireEvent.click(nextBtn);
		fireEvent.click(nextBtn);
		expect(screen.getByText(/try a tool/i)).toBeInTheDocument();
	});

	it("dismisses modal when skip tour is clicked", () => {
		openModal();
		fireEvent.click(screen.getByRole("button", { name: /skip tour/i }));
		expect(mockLocalStorage["welcome-modal-dismissed"]).toBe("true");
	});
});
