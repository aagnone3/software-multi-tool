import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExitIntentModal } from "./ExitIntentModal";

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

describe("ExitIntentModal", () => {
	beforeEach(() => {
		localStorageMock.clear();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("does not render modal by default", () => {
		render(<ExitIntentModal />);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("shows modal on mouse leave near top of page", () => {
		render(<ExitIntentModal />);
		act(() => {
			const event = new MouseEvent("mouseleave", {
				clientY: 5,
				bubbles: true,
			});
			document.dispatchEvent(event);
		});
		expect(screen.getByRole("dialog")).toBeTruthy();
	});

	it("dismisses modal on close button click", () => {
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { clientY: 5 }),
			);
		});
		const closeBtn = screen.getByLabelText("Close");
		fireEvent.click(closeBtn);
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("shows free credits offer copy", () => {
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { clientY: 5 }),
			);
		});
		expect(screen.getByText(/10 free AI credits/i)).toBeTruthy();
		expect(screen.getByText(/Claim my free credits/i)).toBeTruthy();
	});

	it("does not show modal when suppression key is set and not expired", () => {
		localStorageMock.setItem(
			"exit_intent_dismissed",
			String(Date.now() + 1000000),
		);
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { clientY: 5 }),
			);
		});
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("triggers at most once per mount", () => {
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { clientY: 5 }),
			);
		});
		const closeBtn = screen.getByLabelText("Close");
		fireEvent.click(closeBtn);
		// Second trigger should not re-open (triggered ref is set)
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { clientY: 5 }),
			);
		});
		expect(screen.queryByRole("dialog")).toBeNull();
	});
});
