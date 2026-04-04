import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTrack = vi.fn();
vi.mock("@analytics/hooks/use-product-analytics", () => ({
	useProductAnalytics: () => ({ track: mockTrack }),
}));

// Suppress localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {};
	return {
		getItem: (key: string) => store[key] ?? null,
		setItem: (key: string, value: string) => {
			store[key] = value;
		},
		clear: () => {
			store = {};
		},
	};
})();
Object.defineProperty(window, "localStorage", { value: localStorageMock });

import { ExitIntentModal } from "./ExitIntentModal";

describe("ExitIntentModal", () => {
	beforeEach(() => {
		mockTrack.mockClear();
		localStorageMock.clear();
	});

	it("does not render until exit intent fires", () => {
		render(<ExitIntentModal />);
		expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
	});

	it("shows modal on mouseleave near top and tracks shown event", () => {
		render(<ExitIntentModal />);
		act(() => {
			const event = new MouseEvent("mouseleave", {
				bubbles: true,
				clientY: 5,
			});
			document.dispatchEvent(event);
		});
		expect(screen.getByRole("dialog")).toBeInTheDocument();
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_exit_intent_shown",
			props: {},
		});
	});

	it("tracks dismissed event when close button clicked", () => {
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { bubbles: true, clientY: 5 }),
			);
		});
		fireEvent.click(screen.getByLabelText("Close"));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_exit_intent_dismissed",
			props: {},
		});
	});

	it("tracks cta clicked event", () => {
		render(<ExitIntentModal />);
		act(() => {
			document.dispatchEvent(
				new MouseEvent("mouseleave", { bubbles: true, clientY: 5 }),
			);
		});
		fireEvent.click(screen.getByText(/Claim my 10 free credits/i));
		expect(mockTrack).toHaveBeenCalledWith({
			name: "marketing_exit_intent_cta_clicked",
			props: {},
		});
	});
});
